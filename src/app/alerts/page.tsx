'use client'

import { useState, useEffect, useCallback } from 'react'
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs'
import { Alert, AlertPreferences } from '@/lib/alerts'
import { AlertsPanel } from '@/components/AlertsPanel'
import { AlertSettings } from '@/components/AlertSettings'
import Link from 'next/link'

export default function AlertsPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [preferences, setPreferences] = useState<AlertPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'alerts' | 'settings'>('alerts')
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/alerts')

      if (!response.ok) {
        throw new Error('Failed to fetch alerts')
      }

      const data = await response.json()
      setAlerts(data.alerts || [])
      setPreferences(data.preferences || null)
    } catch (err) {
      console.error('Error fetching alerts:', err)
      setError('Failed to load alerts. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoaded) {
      fetchAlerts()
    }
  }, [isLoaded, fetchAlerts])

  const handleSavePreferences = async (newPrefs: AlertPreferences) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_preferences',
          ...newPrefs
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      setPreferences(newPrefs)
      // Refetch alerts with new preferences
      await fetchAlerts()
    } catch (err) {
      console.error('Error saving preferences:', err)
      setError('Failed to save preferences. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkRead = async (alertId: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          alertId
        })
      })

      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId ? { ...alert, read: true } : alert
        )
      )
    } catch (err) {
      console.error('Error marking alert read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const alertIds = alerts.filter(a => !a.read).map(a => a.id)
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_all_read',
          alertIds
        })
      })

      setAlerts(prev => prev.map(alert => ({ ...alert, read: true })))
    } catch (err) {
      console.error('Error marking all alerts read:', err)
    }
  }

  const unreadCount = alerts.filter(a => !a.read).length

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Alerts & Notifications
              {unreadCount > 0 && (
                <span className="px-3 py-1 text-sm font-bold bg-red-500 rounded-full text-white">
                  {unreadCount} new
                </span>
              )}
            </h1>
          </div>
          <p className="text-gray-400">
            Get notified about value bets, high confidence picks, and injury updates
          </p>
        </div>

        {/* Content for signed-in users */}
        <SignedIn>
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Alerts
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-300 hover:text-red-200"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400">Loading alerts...</p>
            </div>
          ) : (
            <>
              {/* Alerts Tab */}
              {activeTab === 'alerts' && (
                <AlertsPanel
                  alerts={alerts}
                  onMarkRead={handleMarkRead}
                  onMarkAllRead={handleMarkAllRead}
                />
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && preferences && (
                <AlertSettings
                  preferences={preferences}
                  onSave={handleSavePreferences}
                  isLoading={isSaving}
                />
              )}
            </>
          )}
        </SignedIn>

        {/* Content for signed-out users */}
        <SignedOut>
          <div className="glass-card rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">🔔</div>
            <h2 className="text-2xl font-bold text-white mb-3">Sign in to access alerts</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Create an account or sign in to receive personalized alerts for value bets, high confidence picks, and injury updates.
            </p>
            <SignInButton mode="modal">
              <button className="px-8 py-3 bg-gradient-to-r from-primary to-secondary rounded-lg font-semibold text-white hover:opacity-90 transition-opacity">
                Sign In to Get Started
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="glass-card rounded-xl p-5">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-white font-semibold mb-1">Value Bet Alerts</h3>
            <p className="text-sm text-gray-400">
              Get notified when our model finds betting edges based on your threshold settings.
            </p>
          </div>
          <div className="glass-card rounded-xl p-5">
            <div className="text-3xl mb-3">✅</div>
            <h3 className="text-white font-semibold mb-1">High Confidence Picks</h3>
            <p className="text-sm text-gray-400">
              Alerts for predictions with 65%+ win probability from our model.
            </p>
          </div>
          <div className="glass-card rounded-xl p-5">
            <div className="text-3xl mb-3">🏥</div>
            <h3 className="text-white font-semibold mb-1">Injury Alerts</h3>
            <p className="text-sm text-gray-400">
              Stay informed when multiple key players are ruled out for upcoming games.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
