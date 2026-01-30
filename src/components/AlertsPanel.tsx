'use client'

import { useState } from 'react'
import { Alert, getAlertTypeIcon, getAlertPriorityColor, filterAlertsBySport } from '@/lib/alerts'

interface AlertsPanelProps {
  alerts: Alert[]
  onMarkRead: (alertId: string) => void
  onMarkAllRead: () => void
}

export function AlertsPanel({ alerts, onMarkRead, onMarkAllRead }: AlertsPanelProps) {
  const [sportFilter, setSportFilter] = useState<'all' | 'nba' | 'nfl'>('all')
  const [typeFilter, setTypeFilter] = useState<Alert['type'] | 'all'>('all')

  const filteredAlerts = filterAlertsBySport(alerts, sportFilter).filter(
    alert => typeFilter === 'all' || alert.type === typeFilter
  )

  const unreadCount = filteredAlerts.filter(a => !a.read).length

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Alerts
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-red-500 rounded-full text-white">
                {unreadCount}
              </span>
            )}
          </h2>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Sport Filter */}
          <div className="flex gap-1">
            {(['all', 'nba', 'nfl'] as const).map(sport => (
              <button
                key={sport}
                onClick={() => setSportFilter(sport)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  sportFilter === sport
                    ? 'bg-primary/20 text-primary'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {sport.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex gap-1">
            {([
              { value: 'all', label: 'All' },
              { value: 'value_bet', label: '💰 Value' },
              { value: 'high_confidence', label: '✅ Picks' },
              { value: 'injury', label: '🏥 Injury' }
            ] as const).map(filter => (
              <button
                key={filter.value}
                onClick={() => setTypeFilter(filter.value)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  typeFilter === filter.value
                    ? 'bg-primary/20 text-primary'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="max-h-[400px] overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-gray-400">No alerts yet</p>
            <p className="text-sm text-gray-500 mt-1">Alerts will appear when we find value bets or high confidence picks</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredAlerts.map(alert => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onMarkRead={onMarkRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Individual Alert Item
interface AlertItemProps {
  alert: Alert
  onMarkRead: (alertId: string) => void
}

function AlertItem({ alert, onMarkRead }: AlertItemProps) {
  const timeAgo = getTimeAgo(alert.createdAt)
  const priorityColors = getAlertPriorityColor(alert.priority)
  const typeIcon = getAlertTypeIcon(alert.type)

  return (
    <div
      className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
        !alert.read ? 'bg-primary/5' : ''
      }`}
      onClick={() => !alert.read && onMarkRead(alert.id)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-2 rounded-lg ${priorityColors}`}>
          <span className="text-lg">{typeIcon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${!alert.read ? 'text-white' : 'text-gray-300'}`}>
              {alert.title}
            </h4>
            {!alert.read && (
              <span className="w-2 h-2 bg-primary rounded-full" />
            )}
          </div>
          <p className="text-sm text-gray-400 truncate">{alert.message}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">{timeAgo}</span>
            {alert.sport && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-white/10 rounded text-gray-400">
                {alert.sport.toUpperCase()}
              </span>
            )}
            {alert.edge && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-400 rounded">
                +{alert.edge}pt
              </span>
            )}
            {alert.betSide && (
              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                alert.betSide === 'underdog' ? 'bg-purple-500/20 text-purple-400' :
                alert.betSide === 'favorite' ? 'bg-amber-500/20 text-amber-400' :
                alert.betSide === 'over' ? 'bg-green-500/20 text-green-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {alert.betSide.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Bell Icon with Badge for Navigation
interface AlertsBellProps {
  unreadCount: number
  onClick: () => void
}

export function AlertsBell({ unreadCount, onClick }: AlertsBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
      aria-label="Alerts"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-red-500 rounded-full text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}

// Dropdown Panel for Navigation
interface AlertsDropdownProps {
  alerts: Alert[]
  onMarkRead: (alertId: string) => void
  onMarkAllRead: () => void
  onClose: () => void
  onViewAll: () => void
}

export function AlertsDropdown({ alerts, onMarkRead, onMarkAllRead, onClose, onViewAll }: AlertsDropdownProps) {
  const unreadCount = alerts.filter(a => !a.read).length

  return (
    <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-dark-800 rounded-xl border border-white/10 shadow-2xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-white font-semibold flex items-center gap-2">
          Alerts
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-red-500 rounded-full text-white">
              {unreadCount}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Alerts */}
      <div className="max-h-80 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-3xl mb-2">🔔</div>
            <p className="text-gray-400 text-sm">No alerts yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {alerts.slice(0, 5).map(alert => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onMarkRead={onMarkRead}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {alerts.length > 0 && (
        <div className="p-3 border-t border-white/10">
          <button
            onClick={onViewAll}
            className="w-full py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View all alerts
          </button>
        </div>
      )}
    </div>
  )
}

// Helper
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}
