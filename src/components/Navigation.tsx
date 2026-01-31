'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'
import { isProUser } from '@/lib/admin'
import { Alert } from '@/lib/alerts'
import { AlertsDropdown } from './AlertsPanel'
import { trackNavClick, trackCTAClick, AnalyticsEvents, trackEvent } from '@/lib/analytics'

const navItems = [
  { name: 'Dashboard', href: '/' },
  { name: 'NBA', href: '/nba' },
  { name: 'NFL', href: '/nfl' },
  { name: 'Players', href: '/players' },
  { name: 'Odds', href: '/odds', premium: true, highlight: true },
]

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress
  const isPro = isProUser(userEmail)

  const closeMenu = () => setMobileMenuOpen(false)

  // Track navigation clicks
  const handleNavClick = (itemName: string, href: string) => {
    trackNavClick(href, 'main_nav')
    if (itemName === 'Odds') {
      trackEvent(AnalyticsEvents.ODDS_VIEWED, { category: 'betting' })
    }
  }

  // Track CTA clicks
  const handleCTAClick = (ctaName: string) => {
    trackCTAClick(ctaName, pathname)
  }

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/alerts')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }, [])

  useEffect(() => {
    if (isLoaded && user) {
      fetchAlerts()
      // Refresh alerts every 2 minutes
      const interval = setInterval(fetchAlerts, 120000)
      return () => clearInterval(interval)
    }
  }, [isLoaded, user, fetchAlerts])

  const handleMarkRead = async (alertId: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', alertId })
      })
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking alert read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const alertIds = alerts.filter(a => !a.read).map(a => a.id)
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read', alertIds })
      })
      setAlerts(prev => prev.map(a => ({ ...a, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all alerts read:', error)
    }
  }

  const handleViewAll = () => {
    setAlertsOpen(false)
    router.push('/alerts')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2" onClick={closeMenu}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-sm">SF</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                StatFlow
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const isHighlight = 'highlight' in item && item.highlight
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => handleNavClick(item.name, item.href)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : isHighlight
                      ? 'text-primary hover:text-white hover:bg-primary/10 border border-primary/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isHighlight && (
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                  {item.name}
                  {item.premium && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-primary to-secondary rounded text-white">
                      PRO
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  onClick={() => handleCTAClick('sign_in_nav')}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  onClick={() => {
                    handleCTAClick('get_started_nav')
                    trackEvent(AnalyticsEvents.SIGNUP_STARTED, { category: 'conversion' })
                  }}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary to-secondary rounded-lg hover:opacity-90 transition-opacity"
                >
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              {/* Alerts Bell */}
              <div className="relative">
                <button
                  onClick={() => setAlertsOpen(!alertsOpen)}
                  className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Alerts"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-red-500 rounded-full text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Alerts Dropdown */}
                {alertsOpen && (
                  <AlertsDropdown
                    alerts={alerts}
                    onMarkRead={handleMarkRead}
                    onMarkAllRead={handleMarkAllRead}
                    onClose={() => setAlertsOpen(false)}
                    onViewAll={handleViewAll}
                  />
                )}
              </div>

              {isPro ? (
                <span className="px-3 py-1.5 text-sm font-semibold bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Pro
                </span>
              ) : (
                <Link
                  href="/pricing"
                  onClick={() => {
                    handleNavClick('pricing', '/pricing')
                    trackEvent(AnalyticsEvents.PRICING_VIEWED, { category: 'conversion' })
                  }}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary to-secondary rounded-lg hover:opacity-90 transition-opacity"
                >
                  Upgrade to Pro
                </Link>
              )}
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9',
                  },
                }}
              />
            </SignedIn>
          </div>

          {/* Mobile menu button and auth */}
          <div className="flex md:hidden items-center space-x-3">
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  },
                }}
              />
            </SignedIn>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-4 space-y-2 bg-dark-900/95 border-t border-white/5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const isHighlight = 'highlight' in item && item.highlight
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeMenu}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 min-h-[48px] ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : isHighlight
                    ? 'text-primary bg-primary/5 border border-primary/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center">
                  {isHighlight && (
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                  {item.name}
                </span>
                {item.premium && (
                  <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-primary to-secondary rounded text-white">
                    PRO
                  </span>
                )}
              </Link>
            )
          })}

          {/* Alerts Link for Mobile */}
          <SignedIn>
            <Link
              href="/alerts"
              onClick={closeMenu}
              className="flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 min-h-[48px] text-gray-400 hover:text-white hover:bg-white/5"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Alerts
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-1 text-xs font-bold bg-red-500 rounded-full text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          </SignedIn>

          {/* Mobile Auth Section */}
          <div className="pt-4 mt-4 border-t border-white/10">
            <SignedOut>
              <div className="space-y-2">
                <SignInButton mode="modal">
                  <button className="w-full px-4 py-3 text-base font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors min-h-[48px]">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="w-full px-4 py-3 text-base font-medium bg-gradient-to-r from-primary to-secondary rounded-lg hover:opacity-90 transition-opacity min-h-[48px]">
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              {isPro ? (
                <div className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg">
                  <svg className="w-5 h-5 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-base font-semibold text-white">Pro Member</span>
                </div>
              ) : (
                <Link
                  href="/pricing"
                  onClick={closeMenu}
                  className="block w-full px-4 py-3 text-center text-base font-medium bg-gradient-to-r from-primary to-secondary rounded-lg hover:opacity-90 transition-opacity min-h-[48px]"
                >
                  Upgrade to Pro
                </Link>
              )}
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  )
}
