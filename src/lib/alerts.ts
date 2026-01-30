// Alerts System for Sports-Viz
// Generates alerts based on value bets, predictions, and user preferences

import { GamePrediction, ValueBet } from './predictor'

// ============================================
// TYPES
// ============================================

export interface AlertPreferences {
  userId: string
  email?: string
  enableValueBetAlerts: boolean
  enableHighConfidenceAlerts: boolean
  enableLineMovementAlerts: boolean
  enableInjuryAlerts: boolean
  minEdgeThreshold: number // e.g., 3 = only alert if 3%+ edge
  minConfidence: 'low' | 'medium' | 'high'
  sports: ('nba' | 'nfl')[]
}

export interface Alert {
  id: string
  userId: string
  type: 'value_bet' | 'high_confidence' | 'line_movement' | 'injury'
  title: string
  message: string
  gameId: string
  priority: 'low' | 'medium' | 'high'
  createdAt: Date | string // Can be string when received from JSON API
  read: boolean
  // Additional context
  betSide?: 'underdog' | 'favorite' | 'over' | 'under'
  edge?: number
  confidence?: 'low' | 'medium' | 'high'
  sport?: 'nba' | 'nfl'
}

export interface GameWithPrediction {
  gameId: string
  homeTeam: string
  awayTeam: string
  gameTime: string
  sport: 'nba' | 'nfl'
  prediction: GamePrediction
  valueBets: ValueBet[]
  injuries?: {
    home: { playerName: string; status: string }[]
    away: { playerName: string; status: string }[]
  }
}

// ============================================
// DEFAULT PREFERENCES
// ============================================

export const DEFAULT_PREFERENCES: Omit<AlertPreferences, 'userId'> = {
  enableValueBetAlerts: true,
  enableHighConfidenceAlerts: true,
  enableLineMovementAlerts: false, // Requires real-time data
  enableInjuryAlerts: true,
  minEdgeThreshold: 3,
  minConfidence: 'medium',
  sports: ['nba', 'nfl']
}

// ============================================
// ALERT GENERATORS
// ============================================

/**
 * Generate all alerts based on games and user preferences
 */
export function generateAlerts(
  games: GameWithPrediction[],
  preferences: AlertPreferences
): Alert[] {
  const alerts: Alert[] = []
  const now = new Date()

  // Filter games by sport preference
  const filteredGames = games.filter(g => preferences.sports.includes(g.sport))

  for (const game of filteredGames) {
    // Value Bet Alerts
    if (preferences.enableValueBetAlerts) {
      const valueBetAlerts = generateValueBetAlerts(game, preferences, now)
      alerts.push(...valueBetAlerts)
    }

    // High Confidence Alerts
    if (preferences.enableHighConfidenceAlerts) {
      const confidenceAlerts = generateHighConfidenceAlerts(game, preferences, now)
      alerts.push(...confidenceAlerts)
    }

    // Injury Alerts
    if (preferences.enableInjuryAlerts && game.injuries) {
      const injuryAlerts = generateInjuryAlerts(game, preferences, now)
      alerts.push(...injuryAlerts)
    }
  }

  // Sort by priority (high first) then by creation date (newest first)
  return alerts.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    // Handle both Date objects and ISO strings from JSON serialization
    const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt.getTime()
    const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt.getTime()
    return bTime - aTime
  })
}

/**
 * Generate alerts for value bets
 */
function generateValueBetAlerts(
  game: GameWithPrediction,
  preferences: AlertPreferences,
  now: Date
): Alert[] {
  const alerts: Alert[] = []

  // Filter value bets by edge threshold
  const qualifyingBets = game.valueBets.filter(
    bet => bet.edge >= preferences.minEdgeThreshold &&
    meetsConfidenceThreshold(bet.confidence, preferences.minConfidence)
  )

  for (const bet of qualifyingBets) {
    const isUnderdog = bet.betSide === 'underdog'
    const sideEmoji = bet.betSide === 'underdog' ? '🐕' : bet.betSide === 'favorite' ? '👑' : bet.betSide === 'over' ? '📈' : '📉'

    alerts.push({
      id: `vb-${game.gameId}-${bet.betType}-${Date.now()}`,
      userId: preferences.userId,
      type: 'value_bet',
      title: `${sideEmoji} ${bet.betSide.toUpperCase()} Value: ${bet.teamToBet}`,
      message: bet.betDescription,
      gameId: game.gameId,
      priority: bet.edge >= 5 ? 'high' : bet.edge >= 4 ? 'medium' : 'low',
      createdAt: now,
      read: false,
      betSide: bet.betSide,
      edge: bet.edge,
      confidence: bet.confidence,
      sport: game.sport
    })
  }

  return alerts
}

/**
 * Generate alerts for high confidence predictions
 */
function generateHighConfidenceAlerts(
  game: GameWithPrediction,
  preferences: AlertPreferences,
  now: Date
): Alert[] {
  const alerts: Alert[] = []

  // Only alert on high confidence predictions
  if (game.prediction.confidence === 'high' && game.prediction.winProbability >= 65) {
    alerts.push({
      id: `hc-${game.gameId}-${Date.now()}`,
      userId: preferences.userId,
      type: 'high_confidence',
      title: `High Confidence Pick: ${game.prediction.predictedWinner}`,
      message: `${game.prediction.winProbability}% win probability | ${game.awayTeam} @ ${game.homeTeam}`,
      gameId: game.gameId,
      priority: game.prediction.winProbability >= 75 ? 'high' : 'medium',
      createdAt: now,
      read: false,
      confidence: 'high',
      sport: game.sport
    })
  }

  return alerts
}

/**
 * Generate alerts for injuries
 */
function generateInjuryAlerts(
  game: GameWithPrediction,
  preferences: AlertPreferences,
  now: Date
): Alert[] {
  const alerts: Alert[] = []

  if (!game.injuries) return alerts

  // Check for significant injuries (Out/Doubtful status)
  const significantHomeInjuries = game.injuries.home.filter(
    i => i.status === 'Out' || i.status === 'Doubtful'
  )
  const significantAwayInjuries = game.injuries.away.filter(
    i => i.status === 'Out' || i.status === 'Doubtful'
  )

  // Alert if 2+ key players out
  if (significantHomeInjuries.length >= 2) {
    const players = significantHomeInjuries.slice(0, 3).map(i => i.playerName).join(', ')
    alerts.push({
      id: `inj-${game.gameId}-home-${Date.now()}`,
      userId: preferences.userId,
      type: 'injury',
      title: `Injury Alert: ${game.homeTeam}`,
      message: `${significantHomeInjuries.length} players OUT: ${players}`,
      gameId: game.gameId,
      priority: significantHomeInjuries.length >= 3 ? 'high' : 'medium',
      createdAt: now,
      read: false,
      sport: game.sport
    })
  }

  if (significantAwayInjuries.length >= 2) {
    const players = significantAwayInjuries.slice(0, 3).map(i => i.playerName).join(', ')
    alerts.push({
      id: `inj-${game.gameId}-away-${Date.now()}`,
      userId: preferences.userId,
      type: 'injury',
      title: `Injury Alert: ${game.awayTeam}`,
      message: `${significantAwayInjuries.length} players OUT: ${players}`,
      gameId: game.gameId,
      priority: significantAwayInjuries.length >= 3 ? 'high' : 'medium',
      createdAt: now,
      read: false,
      sport: game.sport
    })
  }

  return alerts
}

// ============================================
// HELPERS
// ============================================

/**
 * Check if a confidence level meets the threshold
 */
function meetsConfidenceThreshold(
  actual: 'low' | 'medium' | 'high',
  threshold: 'low' | 'medium' | 'high'
): boolean {
  const levels = { low: 0, medium: 1, high: 2 }
  return levels[actual] >= levels[threshold]
}

/**
 * Format an alert message for display
 */
export function formatAlertMessage(alert: Alert): string {
  const timeAgo = getTimeAgo(alert.createdAt)
  const priorityIcon = alert.priority === 'high' ? '🔴' : alert.priority === 'medium' ? '🟡' : '⚪'

  return `${priorityIcon} ${alert.title}\n${alert.message}\n${timeAgo}`
}

/**
 * Get time ago string
 */
function getTimeAgo(date: Date | string): string {
  const now = new Date()
  // Handle both Date objects and ISO strings from JSON serialization
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

/**
 * Get alert type icon
 */
export function getAlertTypeIcon(type: Alert['type']): string {
  switch (type) {
    case 'value_bet': return '💰'
    case 'high_confidence': return '✅'
    case 'line_movement': return '📊'
    case 'injury': return '🏥'
  }
}

/**
 * Get alert priority color
 */
export function getAlertPriorityColor(priority: Alert['priority']): string {
  switch (priority) {
    case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30'
    case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    case 'low': return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
  }
}

/**
 * Get unread alert count
 */
export function getUnreadCount(alerts: Alert[]): number {
  return alerts.filter(a => !a.read).length
}

/**
 * Group alerts by type
 */
export function groupAlertsByType(alerts: Alert[]): Record<Alert['type'], Alert[]> {
  return alerts.reduce((acc, alert) => {
    if (!acc[alert.type]) acc[alert.type] = []
    acc[alert.type].push(alert)
    return acc
  }, {} as Record<Alert['type'], Alert[]>)
}

/**
 * Filter alerts by sport
 */
export function filterAlertsBySport(alerts: Alert[], sport: 'nba' | 'nfl' | 'all'): Alert[] {
  if (sport === 'all') return alerts
  return alerts.filter(a => a.sport === sport)
}
