// Game Outcome Predictor and Value Bet Finder
// Uses team stats, efficiency ratings, recent form, injuries, and rest to predict game outcomes

import { RecentGame } from './espn'
import { ATSRecord, OURecord, RestInfo, calculateEfficiencyRatings } from './bettingStats'

// ============================================
// TYPES
// ============================================

export interface TeamPredictionData {
  id: string
  name: string
  ppg: number
  oppg: number
  pointDiff: number
  recentGames: RecentGame[]
  atsRecord?: ATSRecord
  ouRecord?: OURecord
  restInfo?: RestInfo
  injuries: { status: string; playerName: string; position: string }[]
  isHome: boolean
}

export interface GamePrediction {
  homeTeam: string
  awayTeam: string
  predictedWinner: string
  winProbability: number // 0-100 (winner's probability for display)
  homeWinProbability: number // 0-100 (explicit home team win probability)
  awayWinProbability: number // 0-100 (explicit away team win probability)
  confidence: 'low' | 'medium' | 'high'
  predictedHomeScore: number
  predictedAwayScore: number
  predictedSpread: number // Negative = home favored
  predictedTotal: number
  factors: PredictionFactor[]
  powerRatings: {
    home: number
    away: number
    differential: number
  }
}

export interface PredictionFactor {
  name: string
  impact: number // Points of impact
  description: string
  favoredTeam: 'home' | 'away' | 'neutral'
}

export interface MarketOdds {
  spread: number // Home team spread (negative = home favored)
  total: number
  homeMoneyline: number
  awayMoneyline: number
}

export interface ValueBet {
  gameId: string
  betType: 'spread' | 'moneyline' | 'total_over' | 'total_under'
  recommendation: string
  edge: number // Percentage edge
  confidence: 'low' | 'medium' | 'high'
  ourLine: number
  marketLine: number
  explanation: string
  // New fields for clear labeling
  betSide: 'underdog' | 'favorite' | 'over' | 'under'
  teamToBet: string // team name for spread/ML bets, or "Over"/"Under" for totals
  betDescription: string // e.g., "Bet LAKERS +5.5 (Underdog)"
}

// ============================================
// POWER RATING CALCULATOR
// ============================================

const WEIGHTS = {
  // Core stats weights
  pointDifferential: 1.0,
  offensiveEfficiency: 0.8,
  defensiveEfficiency: 0.8,

  // Situational weights
  homeCourtAdvantage: 3.0, // NBA home court worth ~3 points
  restAdvantagePerDay: 0.5, // Each day of rest advantage worth 0.5 points
  backToBackPenalty: 2.5, // B2B penalty

  // Form weights
  recentFormWeight: 0.6, // Recent games weighted more
  streakBonus: 0.3, // Per game in streak (max 5 games)

  // Injury impact (approximate based on position)
  injuryImpact: {
    star: 4.0,    // Star player out
    starter: 2.0, // Regular starter out
    rotation: 0.5 // Rotation player out
  },

  // H2H adjustment
  h2hWeight: 0.3 // Per game H2H edge
}

/**
 * Calculate power rating for a team
 * Returns a normalized rating where 100 = league average
 */
export function calculatePowerRating(
  team: TeamPredictionData,
  sport: 'nba' | 'nfl'
): number {
  // Base rating from point differential
  // NBA: +10 point diff = elite team (~115 rating)
  // NFL: +7 point diff = elite team
  const pointDiffMultiplier = sport === 'nba' ? 1.5 : 2.0
  let rating = 100 + (team.pointDiff * pointDiffMultiplier)

  // Adjust for efficiency if we have recent games
  if (team.recentGames.length >= 5) {
    const efficiency = calculateEfficiencyRatings(team.recentGames, sport)
    // Net rating adjustment
    rating += efficiency.netRating * 0.3
  }

  // Recent form adjustment (last 5 games)
  const last5 = team.recentGames.slice(0, 5)
  if (last5.length > 0) {
    const recentWinPct = last5.filter(g => g.result === 'W').length / last5.length
    // Adjust by deviation from expected 50%
    rating += (recentWinPct - 0.5) * 10 * WEIGHTS.recentFormWeight
  }

  // Streak bonus/penalty
  const streak = getStreak(team.recentGames.map(g => g.result))
  if (streak.count >= 3) {
    const streakAdjust = Math.min(streak.count, 5) * WEIGHTS.streakBonus
    rating += streak.type === 'W' ? streakAdjust : -streakAdjust
  }

  // Injury adjustment
  const injuryPenalty = calculateInjuryImpact(team.injuries)
  rating -= injuryPenalty

  // Rest adjustment
  if (team.restInfo) {
    if (team.restInfo.isBackToBack) {
      rating -= WEIGHTS.backToBackPenalty
    } else if (team.restInfo.daysOfRest >= 3) {
      rating += (team.restInfo.daysOfRest - 2) * WEIGHTS.restAdvantagePerDay
    }
  }

  return Math.round(rating * 10) / 10
}

/**
 * Calculate injury impact on team rating
 */
function calculateInjuryImpact(
  injuries: { status: string; playerName: string; position: string }[]
): number {
  let impact = 0

  // Count injuries by severity
  const outPlayers = injuries.filter(i =>
    i.status === 'Out' || i.status === 'Doubtful'
  )

  const questionable = injuries.filter(i =>
    i.status === 'Questionable' || i.status === 'Day-To-Day'
  )

  // Approximate impact - in reality we'd want player value/usage data
  // For now, assume first 2 "Out" players are starters
  const outStarters = Math.min(outPlayers.length, 2)
  const outRotation = Math.max(0, outPlayers.length - 2)

  impact += outStarters * WEIGHTS.injuryImpact.starter
  impact += outRotation * WEIGHTS.injuryImpact.rotation

  // Questionable players have partial impact (50%)
  impact += questionable.length * WEIGHTS.injuryImpact.rotation * 0.5

  return impact
}

/**
 * Get streak from results
 */
function getStreak(results: ('W' | 'L')[]): { type: 'W' | 'L'; count: number } {
  if (results.length === 0) return { type: 'W', count: 0 }
  const firstResult = results[0]
  let count = 0
  for (const result of results) {
    if (result === firstResult) count++
    else break
  }
  return { type: firstResult, count }
}

// ============================================
// GAME PREDICTION
// ============================================

/**
 * Predict game outcome
 */
export function predictGame(
  homeTeam: TeamPredictionData,
  awayTeam: TeamPredictionData,
  sport: 'nba' | 'nfl',
  h2h?: { team1Wins: number; team2Wins: number; avgMargin: number }
): GamePrediction {
  const factors: PredictionFactor[] = []

  // Calculate base power ratings
  const homePower = calculatePowerRating({ ...homeTeam, isHome: true }, sport)
  const awayPower = calculatePowerRating({ ...awayTeam, isHome: false }, sport)

  // Start with power rating differential
  let predictedMargin = (homePower - awayPower) / 2 // Convert rating to expected margin

  factors.push({
    name: 'Power Rating',
    impact: (homePower - awayPower) / 2,
    description: `Home: ${homePower.toFixed(1)} vs Away: ${awayPower.toFixed(1)}`,
    favoredTeam: homePower > awayPower ? 'home' : homePower < awayPower ? 'away' : 'neutral'
  })

  // Home court advantage
  const hca = WEIGHTS.homeCourtAdvantage
  predictedMargin += hca
  factors.push({
    name: 'Home Court',
    impact: hca,
    description: `+${hca} points for home team`,
    favoredTeam: 'home'
  })

  // Rest advantage
  const homeRest = homeTeam.restInfo?.daysOfRest || 2
  const awayRest = awayTeam.restInfo?.daysOfRest || 2
  const restDiff = homeRest - awayRest

  if (homeTeam.restInfo?.isBackToBack) {
    predictedMargin -= WEIGHTS.backToBackPenalty
    factors.push({
      name: 'Home B2B',
      impact: -WEIGHTS.backToBackPenalty,
      description: 'Home team on back-to-back',
      favoredTeam: 'away'
    })
  }

  if (awayTeam.restInfo?.isBackToBack) {
    predictedMargin += WEIGHTS.backToBackPenalty
    factors.push({
      name: 'Away B2B',
      impact: WEIGHTS.backToBackPenalty,
      description: 'Away team on back-to-back',
      favoredTeam: 'home'
    })
  }

  if (Math.abs(restDiff) >= 2 && !homeTeam.restInfo?.isBackToBack && !awayTeam.restInfo?.isBackToBack) {
    const restImpact = restDiff * WEIGHTS.restAdvantagePerDay
    predictedMargin += restImpact
    factors.push({
      name: 'Rest Advantage',
      impact: restImpact,
      description: `Home: ${homeRest}d vs Away: ${awayRest}d rest`,
      favoredTeam: restDiff > 0 ? 'home' : 'away'
    })
  }

  // H2H adjustment
  if (h2h && (h2h.team1Wins > 0 || h2h.team2Wins > 0)) {
    // team1 is away team in our H2H data structure
    const h2hDiff = h2h.team2Wins - h2h.team1Wins // Positive = home team has better H2H
    if (Math.abs(h2hDiff) >= 2) {
      const h2hImpact = h2hDiff * WEIGHTS.h2hWeight
      predictedMargin += h2hImpact
      factors.push({
        name: 'Head-to-Head',
        impact: h2hImpact,
        description: `H2H: ${h2h.team2Wins}-${h2h.team1Wins} (home-away)`,
        favoredTeam: h2hDiff > 0 ? 'home' : 'away'
      })
    }
  }

  // Injury adjustment (already factored into power rating, but add as factor for display)
  const homeInjuryCount = homeTeam.injuries.filter(i => i.status === 'Out' || i.status === 'Doubtful').length
  const awayInjuryCount = awayTeam.injuries.filter(i => i.status === 'Out' || i.status === 'Doubtful').length

  if (homeInjuryCount > 0 || awayInjuryCount > 0) {
    factors.push({
      name: 'Injuries',
      impact: 0, // Already in power rating
      description: `Home: ${homeInjuryCount} out, Away: ${awayInjuryCount} out`,
      favoredTeam: homeInjuryCount > awayInjuryCount ? 'away' : homeInjuryCount < awayInjuryCount ? 'home' : 'neutral'
    })
  }

  // Calculate predicted scores
  const leagueAvgTotal = sport === 'nba' ? 225 : 45

  // Use team averages to estimate total
  const combinedPPG = (homeTeam.ppg + awayTeam.ppg) || leagueAvgTotal
  const combinedOPPG = (homeTeam.oppg + awayTeam.oppg) || leagueAvgTotal
  const avgTotal = (combinedPPG + combinedOPPG) / 2

  // Adjust total based on O/U trends if available
  let predictedTotal = avgTotal
  if (homeTeam.ouRecord && awayTeam.ouRecord) {
    const homeAvgTotal = homeTeam.ouRecord.averageTotalPoints || avgTotal
    const awayAvgTotal = awayTeam.ouRecord.averageTotalPoints || avgTotal
    predictedTotal = (homeAvgTotal + awayAvgTotal) / 2
  }

  // Ensure minimum/maximum reasonable total
  if (sport === 'nba') {
    predictedTotal = Math.max(200, Math.min(260, predictedTotal))
  } else {
    predictedTotal = Math.max(35, Math.min(60, predictedTotal))
  }

  // Calculate predicted scores based on margin and total
  // predictedMargin is HOME's margin: positive = home wins by that many, negative = away wins
  // So when margin is positive, home scores MORE than away
  // When margin is negative, home scores LESS than away (away scores more)
  const predictedHomeScore = Math.round((predictedTotal / 2) + (predictedMargin / 2))
  const predictedAwayScore = Math.round((predictedTotal / 2) - (predictedMargin / 2))

  // Calculate win probability
  // Using a simple model: margin -> probability
  // ~7 point margin in NBA = ~75% win probability
  const marginStdDev = sport === 'nba' ? 11 : 13 // Standard deviation of margin
  const zScore = predictedMargin / marginStdDev
  // normalCDF gives probability of home team winning (positive margin = home wins)
  const homeWinProb = Math.round(normalCDF(zScore) * 100)
  const awayWinProb = 100 - homeWinProb
  // winProbability is the predicted winner's probability (for display purposes)
  const winProbability = predictedMargin >= 0 ? homeWinProb : awayWinProb

  // Determine confidence
  let confidence: 'low' | 'medium' | 'high' = 'low'
  if (Math.abs(predictedMargin) >= 8 && Math.abs(homePower - awayPower) >= 8) {
    confidence = 'high'
  } else if (Math.abs(predictedMargin) >= 4) {
    confidence = 'medium'
  }

  // Reduce confidence if many injuries or small sample of recent games
  if (homeTeam.recentGames.length < 5 || awayTeam.recentGames.length < 5) {
    confidence = 'low'
  }
  if (homeInjuryCount >= 3 || awayInjuryCount >= 3) {
    if (confidence === 'high') confidence = 'medium'
    else confidence = 'low'
  }

  return {
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
    predictedWinner: predictedMargin >= 0 ? homeTeam.name : awayTeam.name,
    winProbability, // Winner's probability for display
    homeWinProbability: homeWinProb, // Explicit home team probability
    awayWinProbability: awayWinProb, // Explicit away team probability
    confidence,
    predictedHomeScore,
    predictedAwayScore,
    predictedSpread: -Math.round(predictedMargin * 2) / 2, // Round to 0.5
    predictedTotal: Math.round(predictedTotal),
    factors,
    powerRatings: {
      home: homePower,
      away: awayPower,
      differential: homePower - awayPower
    }
  }
}

/**
 * Normal CDF approximation for probability calculation
 */
function normalCDF(z: number): number {
  const a1 =  0.254829592
  const a2 = -0.284496736
  const a3 =  1.421413741
  const a4 = -1.453152027
  const a5 =  1.061405429
  const p  =  0.3275911

  const sign = z < 0 ? -1 : 1
  z = Math.abs(z) / Math.sqrt(2)

  const t = 1.0 / (1.0 + p * z)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z)

  return 0.5 * (1.0 + sign * y)
}

// ============================================
// VALUE BET FINDER
// ============================================

/**
 * Convert American odds to implied probability
 */
export function oddsToImpliedProbability(odds: number): number {
  if (odds < 0) {
    return (-odds / (-odds + 100)) * 100
  } else {
    return (100 / (odds + 100)) * 100
  }
}

/**
 * Find value bets by comparing prediction to market odds
 */
export function findValueBets(
  prediction: GamePrediction,
  marketOdds: MarketOdds,
  gameId: string
): ValueBet[] {
  const valueBets: ValueBet[] = []

  // Determine who is the market favorite (negative spread = favorite)
  const homeIsFavorite = marketOdds.spread < 0
  const favoriteTeam = homeIsFavorite ? prediction.homeTeam : prediction.awayTeam
  const underdogTeam = homeIsFavorite ? prediction.awayTeam : prediction.homeTeam

  // 1. Spread Value
  // Our predicted spread vs market spread
  // If we predict home -5 and market is home -3, we should bet home spread
  const spreadDiff = marketOdds.spread - prediction.predictedSpread

  if (Math.abs(spreadDiff) >= 2) { // At least 2 point edge
    const edge = Math.abs(spreadDiff)
    const betOnHome = spreadDiff > 0 // Market has home as bigger underdog than we do

    // Determine if we're betting on the underdog or favorite
    const teamToBet = betOnHome ? prediction.homeTeam : prediction.awayTeam
    const spreadForBet = betOnHome ? marketOdds.spread : -marketOdds.spread
    const isBettingUnderdog = betOnHome ? !homeIsFavorite : homeIsFavorite
    const betSide: 'underdog' | 'favorite' = isBettingUnderdog ? 'underdog' : 'favorite'

    const sideLabel = isBettingUnderdog ? 'UNDERDOG' : 'FAVORITE'
    const betDescription = `Bet ${teamToBet} ${spreadForBet > 0 ? '+' : ''}${spreadForBet} (${sideLabel})`

    valueBets.push({
      gameId,
      betType: 'spread',
      recommendation: betOnHome
        ? `${prediction.homeTeam} ${marketOdds.spread > 0 ? '+' : ''}${marketOdds.spread}`
        : `${prediction.awayTeam} ${marketOdds.spread < 0 ? '+' : ''}${-marketOdds.spread}`,
      edge: Math.round(edge * 10) / 10,
      confidence: edge >= 4 ? 'high' : edge >= 3 ? 'medium' : 'low',
      ourLine: prediction.predictedSpread,
      marketLine: marketOdds.spread,
      explanation: `Our model: ${prediction.homeTeam} ${prediction.predictedSpread > 0 ? '+' : ''}${prediction.predictedSpread}, Market: ${marketOdds.spread > 0 ? '+' : ''}${marketOdds.spread}`,
      betSide,
      teamToBet,
      betDescription
    })
  }

  // 2. Total Value
  // If we predict 228 and market is 223, we should bet Over
  const totalDiff = prediction.predictedTotal - marketOdds.total

  if (Math.abs(totalDiff) >= 3) { // At least 3 point edge on total
    const edge = Math.abs(totalDiff)
    const betOver = totalDiff > 0
    const betSide: 'over' | 'under' = betOver ? 'over' : 'under'
    const teamToBet = betOver ? 'OVER' : 'UNDER'
    const betDescription = `Take ${teamToBet} ${marketOdds.total} points`

    valueBets.push({
      gameId,
      betType: betOver ? 'total_over' : 'total_under',
      recommendation: betOver ? `Over ${marketOdds.total}` : `Under ${marketOdds.total}`,
      edge: Math.round(edge * 10) / 10,
      confidence: edge >= 6 ? 'high' : edge >= 4 ? 'medium' : 'low',
      ourLine: prediction.predictedTotal,
      marketLine: marketOdds.total,
      explanation: `Our model: ${prediction.predictedTotal} total, Market: ${marketOdds.total}`,
      betSide,
      teamToBet,
      betDescription
    })
  }

  // 3. Moneyline Value
  // Compare our win probability to implied probability from odds
  const homeImpliedProb = oddsToImpliedProbability(marketOdds.homeMoneyline)
  const awayImpliedProb = oddsToImpliedProbability(marketOdds.awayMoneyline)

  // Our probabilities - use explicit home/away probabilities from prediction
  const ourHomeProb = prediction.homeWinProbability
  const ourAwayProb = prediction.awayWinProbability

  // Edge = our prob - market implied prob (accounting for vig)
  const homeMLEdge = ourHomeProb - homeImpliedProb
  const awayMLEdge = ourAwayProb - awayImpliedProb

  // Only add ML value if significant edge and reasonable odds
  if (homeMLEdge >= 5 && marketOdds.homeMoneyline >= -200) {
    const isBettingUnderdog = !homeIsFavorite
    const betSide: 'underdog' | 'favorite' = isBettingUnderdog ? 'underdog' : 'favorite'
    const sideLabel = isBettingUnderdog ? 'UNDERDOG' : 'FAVORITE'
    const betDescription = `Bet ${prediction.homeTeam} ML (${sideLabel})`

    valueBets.push({
      gameId,
      betType: 'moneyline',
      recommendation: `${prediction.homeTeam} ML (${marketOdds.homeMoneyline > 0 ? '+' : ''}${marketOdds.homeMoneyline})`,
      edge: Math.round(homeMLEdge),
      confidence: homeMLEdge >= 10 ? 'high' : homeMLEdge >= 7 ? 'medium' : 'low',
      ourLine: ourHomeProb,
      marketLine: homeImpliedProb,
      explanation: `Our model: ${ourHomeProb.toFixed(0)}% win, Market implies: ${homeImpliedProb.toFixed(0)}%`,
      betSide,
      teamToBet: prediction.homeTeam,
      betDescription
    })
  }

  if (awayMLEdge >= 5 && marketOdds.awayMoneyline >= -200) {
    const isBettingUnderdog = homeIsFavorite
    const betSide: 'underdog' | 'favorite' = isBettingUnderdog ? 'underdog' : 'favorite'
    const sideLabel = isBettingUnderdog ? 'UNDERDOG' : 'FAVORITE'
    const betDescription = `Bet ${prediction.awayTeam} ML (${sideLabel})`

    valueBets.push({
      gameId,
      betType: 'moneyline',
      recommendation: `${prediction.awayTeam} ML (${marketOdds.awayMoneyline > 0 ? '+' : ''}${marketOdds.awayMoneyline})`,
      edge: Math.round(awayMLEdge),
      confidence: awayMLEdge >= 10 ? 'high' : awayMLEdge >= 7 ? 'medium' : 'low',
      ourLine: ourAwayProb,
      marketLine: awayImpliedProb,
      explanation: `Our model: ${ourAwayProb.toFixed(0)}% win, Market implies: ${awayImpliedProb.toFixed(0)}%`,
      betSide,
      teamToBet: prediction.awayTeam,
      betDescription
    })
  }

  // Sort by edge (highest first)
  return valueBets.sort((a, b) => b.edge - a.edge)
}

// ============================================
// HELPER EXPORTS
// ============================================

export function getConfidenceColor(confidence: 'low' | 'medium' | 'high'): string {
  switch (confidence) {
    case 'high': return 'text-green-400'
    case 'medium': return 'text-yellow-400'
    case 'low': return 'text-gray-400'
  }
}

export function getConfidenceBgColor(confidence: 'low' | 'medium' | 'high'): string {
  switch (confidence) {
    case 'high': return 'bg-green-500/20'
    case 'medium': return 'bg-yellow-500/20'
    case 'low': return 'bg-gray-500/20'
  }
}

export function getEdgeColor(edge: number): string {
  if (edge >= 5) return 'text-green-400'
  if (edge >= 3) return 'text-emerald-400'
  if (edge >= 2) return 'text-yellow-400'
  return 'text-gray-400'
}

export function formatSpread(spread: number): string {
  if (spread === 0) return 'PK'
  return spread > 0 ? `+${spread}` : `${spread}`
}
