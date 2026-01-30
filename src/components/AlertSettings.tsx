'use client'

import { useState } from 'react'
import { AlertPreferences, DEFAULT_PREFERENCES } from '@/lib/alerts'
import { useUser } from '@clerk/nextjs'

interface AlertSettingsProps {
  preferences?: Partial<AlertPreferences>
  onSave: (preferences: AlertPreferences) => void
  isLoading?: boolean
}

export function AlertSettings({ preferences, onSave, isLoading }: AlertSettingsProps) {
  const { user } = useUser()
  const userId = user?.id || 'anonymous'
  const userEmail = user?.primaryEmailAddress?.emailAddress || ''

  const [localPrefs, setLocalPrefs] = useState<AlertPreferences>({
    userId,
    email: preferences?.email || userEmail,
    enableValueBetAlerts: preferences?.enableValueBetAlerts ?? DEFAULT_PREFERENCES.enableValueBetAlerts,
    enableHighConfidenceAlerts: preferences?.enableHighConfidenceAlerts ?? DEFAULT_PREFERENCES.enableHighConfidenceAlerts,
    enableLineMovementAlerts: preferences?.enableLineMovementAlerts ?? DEFAULT_PREFERENCES.enableLineMovementAlerts,
    enableInjuryAlerts: preferences?.enableInjuryAlerts ?? DEFAULT_PREFERENCES.enableInjuryAlerts,
    minEdgeThreshold: preferences?.minEdgeThreshold ?? DEFAULT_PREFERENCES.minEdgeThreshold,
    minConfidence: preferences?.minConfidence ?? DEFAULT_PREFERENCES.minConfidence,
    sports: preferences?.sports ?? DEFAULT_PREFERENCES.sports,
  })

  const handleToggle = (key: keyof AlertPreferences) => {
    setLocalPrefs(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }))
  }

  const handleSportToggle = (sport: 'nba' | 'nfl') => {
    setLocalPrefs(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }))
  }

  const handleSave = () => {
    onSave(localPrefs)
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Alert Preferences
      </h2>

      {/* Alert Types */}
      <div className="space-y-4 mb-8">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Alert Types</h3>

        {/* Value Bet Alerts */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <h4 className="text-white font-medium">Value Bet Alerts</h4>
              <p className="text-sm text-gray-400">Get notified when our model finds betting value</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('enableValueBetAlerts')}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              localPrefs.enableValueBetAlerts ? 'bg-primary' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                localPrefs.enableValueBetAlerts ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* High Confidence Alerts */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h4 className="text-white font-medium">High Confidence Picks</h4>
              <p className="text-sm text-gray-400">Alerts for predictions with 65%+ probability</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('enableHighConfidenceAlerts')}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              localPrefs.enableHighConfidenceAlerts ? 'bg-primary' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                localPrefs.enableHighConfidenceAlerts ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Injury Alerts */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏥</span>
            <div>
              <h4 className="text-white font-medium">Injury Alerts</h4>
              <p className="text-sm text-gray-400">Notify when 2+ players are OUT for a team</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('enableInjuryAlerts')}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              localPrefs.enableInjuryAlerts ? 'bg-primary' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                localPrefs.enableInjuryAlerts ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Line Movement Alerts - Coming Soon */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg opacity-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h4 className="text-white font-medium">Line Movement Alerts</h4>
              <p className="text-sm text-gray-400">Track significant odds changes (Coming Soon)</p>
            </div>
          </div>
          <span className="px-2 py-1 text-xs bg-gray-600 rounded text-gray-300">Soon</span>
        </div>
      </div>

      {/* Thresholds */}
      <div className="space-y-4 mb-8">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Thresholds</h3>

        {/* Minimum Edge */}
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-medium">Minimum Edge</h4>
            <span className="text-primary font-mono font-bold">{localPrefs.minEdgeThreshold}+ points</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={localPrefs.minEdgeThreshold}
            onChange={(e) => setLocalPrefs(prev => ({ ...prev, minEdgeThreshold: parseInt(e.target.value) }))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 pt</span>
            <span>10 pts</span>
          </div>
        </div>

        {/* Minimum Confidence */}
        <div className="p-4 bg-white/5 rounded-lg">
          <h4 className="text-white font-medium mb-3">Minimum Confidence</h4>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map(level => (
              <button
                key={level}
                onClick={() => setLocalPrefs(prev => ({ ...prev, minConfidence: level }))}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  localPrefs.minConfidence === level
                    ? level === 'high' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : level === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sports Selection */}
      <div className="space-y-4 mb-8">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Sports to Follow</h3>
        <div className="flex gap-3">
          <button
            onClick={() => handleSportToggle('nba')}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              localPrefs.sports.includes('nba')
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <span className="text-xl">🏀</span>
            <span className="font-medium">NBA</span>
          </button>
          <button
            onClick={() => handleSportToggle('nfl')}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              localPrefs.sports.includes('nfl')
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <span className="text-xl">🏈</span>
            <span className="font-medium">NFL</span>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isLoading}
        className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary rounded-lg font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  )
}
