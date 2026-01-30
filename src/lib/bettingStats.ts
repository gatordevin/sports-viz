// Betting Statistics Utilities
// Provides ATS records, O/U trends, rest indicators, and line movement tracking

import { RecentGame } from './espn'
import { OddsEvent, Bookmaker } from './odds'

// ATS (Against The Spread) Record
export interface ATSRecord {
  wins: number
  losses: number
  pushes: number
  percentage: number
  homeATS?: { wins: number; losses: number; pushes: number }
  awayATS?: { wins: number; losses: number; pushes: number }
  recentATS?: ('W' | 'L' | 'P')[] // Last 5-10 games ATS results
}

// Over/Under Record
export interface OURecord {
  overs: number
  unders: number
  pushes: number
  overPercentage: number
  averageTotalPoints: number
  recentOU?: ('O' | 'U' | 'P')[] // Last 5-10 games O/U results
}

// Rest/Schedule Info
export interface RestInfo {
  daysOfRest: number
  isBackToBack: boolean
  gamesInLast7Days: number
  gamesInLast14Days: number
  restAdvantage?: number // Positive = this team has more rest
}

// Line Movement
export interface LineMovement {
  openingSpread: number
  currentSpread: number
  spreadMovement: number // Positive = line moved toward this team
  openingTotal?: number
  currentTotal?: number
  totalMovement?: number
  openingMoneyline?: number
  currentMoneyline?: number
  moneylineMovement?: number
  movementDirection: 'sharps' | 'public' | 'neutral' // Interpretation
}

// Complete betting profile for a team
export interface TeamBettingProfile {
  teamId: string
  atsRecord: ATSRecord
  ouRecord: OURecord
  restInfo: RestInfo
  lineMovement?: LineMovement
}

/**
 * Calculate simulated ATS record based on recent games and point differential
 * Since we don't have historical spread data, we simulate based on margin of victory
 * A team that wins by more than expected (avg spread) covers; loses by less = covers
 */
export function calculateATSRecord(
  recentGames: RecentGame[],
  averageSpread: number = 0 // Expected spread based on team strength
): ATSRecord | null {
  if (recentGames.length === 0) {
    // Return null when no games available - UI should handle this gracefully
    return null
  }

  let wins = 0
  let losses = 0
  let pushes = 0
  let homeWins = 0, homeLosses = 0, homePushes = 0
  let awayWins = 0, awayLosses = 0, awayPushes = 0
  const recentATS: ('W' | 'L' | 'P')[] = []

  recentGames.forEach(game => {
    const margin = game.teamScore - game.opponentScore
    // Simulate a spread based on game context
    // Home teams typically favored by ~3 points
    const simulatedSpread = game.isHome ? -3 : 3
    const coverMargin = margin + simulatedSpread

    let result: 'W' | 'L' | 'P'
    if (coverMargin > 0) {
      wins++
      result = 'W'
      if (game.isHome) homeWins++
      else awayWins++
    } else if (coverMargin < 0) {
      losses++
      result = 'L'
      if (game.isHome) homeLosses++
      else awayLosses++
    } else {
      pushes++
      result = 'P'
      if (game.isHome) homePushes++
      else awayPushes++
    }

    if (recentATS.length < 10) {
      recentATS.push(result)
    }
  })

  const totalGames = wins + losses
  const percentage = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

  return {
    wins,
    losses,
    pushes,
    percentage,
    homeATS: { wins: homeWins, losses: homeLosses, pushes: homePushes },
    awayATS: { wins: awayWins, losses: awayLosses, pushes: awayPushes },
    recentATS
  }
}

/**
 * Calculate Over/Under record based on recent games
 * Uses average league total as baseline (NBA ~220, NFL ~45)
 */
export function calculateOURecord(
  recentGames: RecentGame[],
  sport: 'nba' | 'nfl'
): OURecord | null {
  if (recentGames.length === 0) {
    // Return null when no games available - UI should handle this gracefully
    return null
  }

  const avgLeagueTotal = sport === 'nba' ? 220 : 45
  let overs = 0
  let unders = 0
  let pushes = 0
  let totalPoints = 0
  const recentOU: ('O' | 'U' | 'P')[] = []

  recentGames.forEach(game => {
    const gameTotal = game.teamScore + game.opponentScore
    totalPoints += gameTotal

    let result: 'O' | 'U' | 'P'
    if (gameTotal > avgLeagueTotal) {
      overs++
      result = 'O'
    } else if (gameTotal < avgLeagueTotal) {
      unders++
      result = 'U'
    } else {
      pushes++
      result = 'P'
    }

    if (recentOU.length < 10) {
      recentOU.push(result)
    }
  })

  const totalGames = overs + unders
  const overPercentage = totalGames > 0 ? Math.round((overs / totalGames) * 100) : 0
  const averageTotalPoints = recentGames.length > 0 ? Math.round(totalPoints / recentGames.length) : 0

  return {
    overs,
    unders,
    pushes,
    overPercentage,
    averageTotalPoints,
    recentOU
  }
}

/**
 * Calculate rest information for a team
 */
export function calculateRestInfo(
  recentGames: RecentGame[],
  nextGameDate: Date
): RestInfo | null {
  if (recentGames.length === 0) {
    // Return null when no games available - UI should handle this gracefully
    return null
  }

  // Sort games by date (most recent first)
  const sortedGames = [...recentGames].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const lastGameDate = new Date(sortedGames[0].date)
  const daysOfRest = Math.floor(
    (nextGameDate.getTime() - lastGameDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  const isBackToBack = daysOfRest <= 1

  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const gamesInLast7Days = sortedGames.filter(
    g => new Date(g.date) >= sevenDaysAgo
  ).length

  const gamesInLast14Days = sortedGames.filter(
    g => new Date(g.date) >= fourteenDaysAgo
  ).length

  return {
    daysOfRest,
    isBackToBack,
    gamesInLast7Days,
    gamesInLast14Days
  }
}

/**
 * Calculate rest advantage between two teams
 * Positive = team1 has more rest
 */
export function calculateRestAdvantage(
  team1Rest: RestInfo,
  team2Rest: RestInfo
): number {
  return team1Rest.daysOfRest - team2Rest.daysOfRest
}

/**
 * Detect line movement by comparing different bookmakers
 * If most books have similar lines, no significant movement
 * Sharp money typically moves lines against public sentiment
 */
export function detectLineMovement(
  event: OddsEvent,
  preferredTeam: 'home' | 'away'
): LineMovement | null {
  if (event.bookmakers.length < 2) {
    return null
  }

  // Get spreads from multiple books
  const spreads: number[] = []
  const totals: number[] = []
  const moneylines: number[] = []

  event.bookmakers.forEach(book => {
    const spreadMarket = book.markets.find(m => m.key === 'spreads')
    const totalMarket = book.markets.find(m => m.key === 'totals')
    const h2hMarket = book.markets.find(m => m.key === 'h2h')

    if (spreadMarket) {
      const teamSpread = spreadMarket.outcomes.find(o =>
        preferredTeam === 'home' ? o.name === event.home_team : o.name === event.away_team
      )
      if (teamSpread?.point !== undefined) {
        spreads.push(teamSpread.point)
      }
    }

    if (totalMarket) {
      const over = totalMarket.outcomes.find(o => o.name === 'Over')
      if (over?.point !== undefined) {
        totals.push(over.point)
      }
    }

    if (h2hMarket) {
      const teamML = h2hMarket.outcomes.find(o =>
        preferredTeam === 'home' ? o.name === event.home_team : o.name === event.away_team
      )
      if (teamML) {
        moneylines.push(teamML.price)
      }
    }
  })

  if (spreads.length < 2) {
    return null
  }

  // Use first book as "opening" and last/average as "current"
  // This is a simplification - real apps would use historical data
  const openingSpread = spreads[0]
  const currentSpread = spreads[spreads.length - 1]
  const spreadMovement = openingSpread - currentSpread // Negative movement = line moved against team

  const openingTotal = totals.length > 0 ? totals[0] : undefined
  const currentTotal = totals.length > 0 ? totals[totals.length - 1] : undefined
  const totalMovement = openingTotal && currentTotal ? currentTotal - openingTotal : undefined

  const openingMoneyline = moneylines.length > 0 ? moneylines[0] : undefined
  const currentMoneyline = moneylines.length > 0 ? moneylines[moneylines.length - 1] : undefined
  const moneylineMovement = openingMoneyline && currentMoneyline
    ? currentMoneyline - openingMoneyline
    : undefined

  // Interpret movement direction
  let movementDirection: 'sharps' | 'public' | 'neutral' = 'neutral'
  if (Math.abs(spreadMovement) >= 1) {
    // If spread moved toward underdog, likely sharp money
    // If spread moved toward favorite, likely public money
    movementDirection = spreadMovement > 0 ? 'sharps' : 'public'
  }

  return {
    openingSpread,
    currentSpread,
    spreadMovement,
    openingTotal,
    currentTotal,
    totalMovement,
    openingMoneyline,
    currentMoneyline,
    moneylineMovement,
    movementDirection
  }
}

/**
 * Get color class for ATS performance
 */
export function getATSColor(percentage: number): string {
  if (percentage >= 60) return 'text-green-400'
  if (percentage >= 55) return 'text-emerald-400'
  if (percentage >= 45) return 'text-gray-400'
  if (percentage >= 40) return 'text-orange-400'
  return 'text-red-400'
}

/**
 * Get color class for rest days
 */
export function getRestColor(daysOfRest: number): string {
  if (daysOfRest >= 3) return 'text-green-400'
  if (daysOfRest === 2) return 'text-emerald-400'
  if (daysOfRest === 1) return 'text-yellow-400'
  return 'text-red-400' // Back to back
}

/**
 * Get badge for line movement
 */
export function getLineMovementBadge(movement: LineMovement): {
  text: string
  color: string
  icon: 'up' | 'down' | 'neutral'
} | null {
  if (Math.abs(movement.spreadMovement) < 0.5) {
    return null
  }

  const moved = Math.abs(movement.spreadMovement)
  const direction = movement.spreadMovement > 0 ? 'up' : 'down'

  return {
    text: `${movement.spreadMovement > 0 ? '+' : ''}${movement.spreadMovement.toFixed(1)}`,
    color: movement.movementDirection === 'sharps'
      ? 'bg-purple-500/20 text-purple-400'
      : movement.movementDirection === 'public'
        ? 'bg-blue-500/20 text-blue-400'
        : 'bg-gray-500/20 text-gray-400',
    icon: movement.spreadMovement > 0 ? 'up' : 'down'
  }
}

/**
 * Format ATS record string
 */
export function formatATSRecord(ats: ATSRecord): string {
  const push = ats.pushes > 0 ? `-${ats.pushes}` : ''
  return `${ats.wins}-${ats.losses}${push} ATS`
}

/**
 * Format O/U record string
 */
export function formatOURecord(ou: OURecord): string {
  return `${ou.overs}-${ou.unders} O/U`
}

/**
 * Calculate pace rating (points per 48 minutes for NBA)
 * Higher = faster pace team
 */
export function calculatePaceRating(
  recentGames: RecentGame[],
  sport: 'nba' | 'nfl'
): number {
  if (recentGames.length === 0) return sport === 'nba' ? 100 : 22

  const totalPoints = recentGames.reduce(
    (sum, game) => sum + game.teamScore + game.opponentScore,
    0
  )

  const avgTotal = totalPoints / recentGames.length

  // Normalize to league average pace
  if (sport === 'nba') {
    // NBA average is ~220 total, pace of 100 is league average
    return Math.round((avgTotal / 220) * 100)
  } else {
    // NFL average is ~45 total
    return Math.round((avgTotal / 45) * 22)
  }
}

/**
 * Calculate offensive and defensive efficiency ratings
 */
export function calculateEfficiencyRatings(
  recentGames: RecentGame[],
  sport: 'nba' | 'nfl'
): { offRating: number; defRating: number; netRating: number } {
  if (recentGames.length === 0) {
    return { offRating: 100, defRating: 100, netRating: 0 }
  }

  const avgFor = recentGames.reduce((sum, g) => sum + g.teamScore, 0) / recentGames.length
  const avgAgainst = recentGames.reduce((sum, g) => sum + g.opponentScore, 0) / recentGames.length

  // Normalize to per-100-possessions basis (estimated)
  const leagueAvg = sport === 'nba' ? 110 : 22
  const offRating = Math.round((avgFor / leagueAvg) * 100)
  const defRating = Math.round((avgAgainst / leagueAvg) * 100)
  const netRating = offRating - defRating

  return { offRating, defRating, netRating }
}

/**
 * Get rating color based on value
 */
export function getRatingColor(rating: number, isDefense: boolean = false): string {
  // For defense, lower is better
  const adjusted = isDefense ? 200 - rating : rating

  if (adjusted >= 110) return 'text-green-400'
  if (adjusted >= 105) return 'text-emerald-400'
  if (adjusted >= 95) return 'text-gray-400'
  if (adjusted >= 90) return 'text-orange-400'
  return 'text-red-400'
}
