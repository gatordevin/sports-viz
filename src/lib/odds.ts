// Unified Odds API Integration
// Primary: BALLDONTLIE API (GOAT subscription - NBA)
// Fallback: The Odds API (for NFL and when BALLDONTLIE unavailable)
//
// This module provides a unified interface for fetching betting odds from multiple sources

import {
  getBDLNBAOdds,
  getBDLNFLOdds,
  isBDLOddsAvailable,
  type OddsEvent as BDLOddsEvent,
  type Bookmaker as BDLBookmaker,
  type Market as BDLMarket,
  type Outcome as BDLOutcome
} from './balldontlieOdds'

// Re-export types from balldontlieOdds for compatibility
export type { BDLOddsEvent as OddsEvent, BDLBookmaker as Bookmaker, BDLMarket as Market, BDLOutcome as Outcome }

// The Odds API configuration (fallback)
const ODDS_API_KEY = process.env.ODDS_API_KEY || ''
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'

// Track which source was used for debugging
export type OddsSource = 'balldontlie' | 'the-odds-api' | 'none'

let lastOddsSource: OddsSource = 'none'

export function getLastOddsSource(): OddsSource {
  return lastOddsSource
}

export interface Sport {
  key: string
  group: string
  title: string
  description: string
  active: boolean
  has_outrights: boolean
}

// ============================================================================
// THE ODDS API (FALLBACK)
// ============================================================================

// Get list of available sports from The Odds API
export async function getSports(): Promise<Sport[]> {
  if (!ODDS_API_KEY) {
    console.warn('ODDS_API_KEY not set')
    return []
  }

  const res = await fetch(`${ODDS_API_BASE}/sports?apiKey=${ODDS_API_KEY}`, {
    next: { revalidate: 3600 }
  })

  if (!res.ok) {
    console.error('Failed to fetch sports:', res.status)
    return []
  }

  return res.json()
}

// Get odds from The Odds API (used as fallback)
async function getOddsFromTheOddsAPI(
  sportKey: string,
  markets: string[] = ['h2h', 'spreads', 'totals'],
  regions: string[] = ['us']
): Promise<BDLOddsEvent[]> {
  if (!ODDS_API_KEY) {
    console.warn('ODDS_API_KEY not set')
    return []
  }

  const params = new URLSearchParams({
    apiKey: ODDS_API_KEY,
    regions: regions.join(','),
    markets: markets.join(','),
    oddsFormat: 'american'
  })

  try {
    const res = await fetch(`${ODDS_API_BASE}/sports/${sportKey}/odds?${params}`, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    })

    if (!res.ok) {
      console.error('[The Odds API] Failed to fetch odds:', res.status)
      return []
    }

    return res.json()
  } catch (error) {
    console.error('[The Odds API] Fetch error:', error)
    return []
  }
}

// ============================================================================
// UNIFIED ODDS FETCHING (BALLDONTLIE PRIMARY, THE ODDS API FALLBACK)
// ============================================================================

/**
 * Get NBA odds - Primary: BALLDONTLIE, Fallback: The Odds API
 */
export async function getNBAOdds(): Promise<BDLOddsEvent[]> {
  // Try BALLDONTLIE first (GOAT subscription includes NBA)
  if (isBDLOddsAvailable()) {
    console.log('[Odds] Fetching NBA odds from BALLDONTLIE...')
    try {
      const bdlOdds = await getBDLNBAOdds()
      if (bdlOdds.length > 0) {
        console.log(`[Odds] Got ${bdlOdds.length} NBA games from BALLDONTLIE`)
        lastOddsSource = 'balldontlie'
        return bdlOdds
      }
      console.log('[Odds] BALLDONTLIE returned no NBA odds, trying fallback...')
    } catch (error) {
      console.error('[Odds] BALLDONTLIE NBA fetch failed:', error)
    }
  }

  // Fallback to The Odds API
  console.log('[Odds] Fetching NBA odds from The Odds API (fallback)...')
  const theOddsApiResult = await getOddsFromTheOddsAPI('basketball_nba')
  if (theOddsApiResult.length > 0) {
    lastOddsSource = 'the-odds-api'
    console.log(`[Odds] Got ${theOddsApiResult.length} NBA games from The Odds API`)
  } else {
    lastOddsSource = 'none'
  }
  return theOddsApiResult
}

/**
 * Get NFL odds - Try BALLDONTLIE first, fallback to The Odds API
 * Note: BALLDONTLIE NFL requires separate subscription, but we try anyway
 */
export async function getNFLOdds(): Promise<BDLOddsEvent[]> {
  // Try BALLDONTLIE first (may not have NFL in current subscription)
  if (isBDLOddsAvailable()) {
    console.log('[Odds] Trying BALLDONTLIE for NFL odds...')
    try {
      const bdlOdds = await getBDLNFLOdds()
      if (bdlOdds.length > 0) {
        console.log(`[Odds] Got ${bdlOdds.length} NFL games from BALLDONTLIE`)
        lastOddsSource = 'balldontlie'
        return bdlOdds
      }
    } catch (error) {
      console.log('[Odds] BALLDONTLIE NFL not available, using fallback')
    }
  }

  // Fallback to The Odds API for NFL
  console.log('[Odds] Fetching NFL odds from The Odds API...')
  const theOddsApiResult = await getOddsFromTheOddsAPI('americanfootball_nfl')
  if (theOddsApiResult.length > 0) {
    lastOddsSource = 'the-odds-api'
    console.log(`[Odds] Got ${theOddsApiResult.length} NFL games from The Odds API`)
  } else {
    lastOddsSource = 'none'
  }
  return theOddsApiResult
}

/**
 * Get MLB odds - The Odds API only (BALLDONTLIE doesn't have MLB in GOAT tier)
 */
export async function getMLBOdds(): Promise<BDLOddsEvent[]> {
  lastOddsSource = 'the-odds-api'
  return getOddsFromTheOddsAPI('baseball_mlb')
}

/**
 * Get NHL odds - The Odds API only
 */
export async function getNHLOdds(): Promise<BDLOddsEvent[]> {
  lastOddsSource = 'the-odds-api'
  return getOddsFromTheOddsAPI('icehockey_nhl')
}

/**
 * Get NCAAB odds - The Odds API only
 */
export async function getNCAABOdds(): Promise<BDLOddsEvent[]> {
  lastOddsSource = 'the-odds-api'
  return getOddsFromTheOddsAPI('basketball_ncaab')
}

/**
 * Get NCAAF odds - The Odds API only
 */
export async function getNCAAFOdds(): Promise<BDLOddsEvent[]> {
  lastOddsSource = 'the-odds-api'
  return getOddsFromTheOddsAPI('americanfootball_ncaaf')
}

/**
 * Generic getOdds function for backwards compatibility
 */
export async function getOdds(
  sportKey: string,
  markets: string[] = ['h2h', 'spreads', 'totals'],
  regions: string[] = ['us']
): Promise<BDLOddsEvent[]> {
  // Route to appropriate function based on sport
  if (sportKey === 'basketball_nba') {
    return getNBAOdds()
  }
  if (sportKey === 'americanfootball_nfl') {
    return getNFLOdds()
  }

  // Other sports use The Odds API directly
  lastOddsSource = 'the-odds-api'
  return getOddsFromTheOddsAPI(sportKey, markets, regions)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function to format American odds
export function formatOdds(price: number): string {
  if (price > 0) {
    return `+${price}`
  }
  return price.toString()
}

// Helper function to format point spread
export function formatSpread(point: number | undefined, price: number): string {
  if (point === undefined) return formatOdds(price)
  const spreadStr = point > 0 ? `+${point}` : point.toString()
  return `${spreadStr} (${formatOdds(price)})`
}

// Helper function to get best odds from multiple bookmakers
export function getBestOdds(event: BDLOddsEvent, marketKey: string = 'h2h'): { home: BDLOutcome | null; away: BDLOutcome | null; bookmaker: string } {
  let bestHome: BDLOutcome | null = null
  let bestAway: BDLOutcome | null = null
  let bestBookmaker = ''

  for (const bookmaker of event.bookmakers) {
    const market = bookmaker.markets.find(m => m.key === marketKey)
    if (!market) continue

    const homeOutcome = market.outcomes.find(o => o.name === event.home_team)
    const awayOutcome = market.outcomes.find(o => o.name === event.away_team)

    if (homeOutcome && (!bestHome || homeOutcome.price > bestHome.price)) {
      bestHome = homeOutcome
      bestBookmaker = bookmaker.title
    }

    if (awayOutcome && (!bestAway || awayOutcome.price > bestAway.price)) {
      bestAway = awayOutcome
    }
  }

  return { home: bestHome, away: bestAway, bookmaker: bestBookmaker }
}

// Get odds from a specific bookmaker
export function getBookmakerOdds(event: BDLOddsEvent, bookmakerKey: string): BDLBookmaker | undefined {
  return event.bookmakers.find(b => b.key === bookmakerKey)
}

// Popular US bookmaker keys
export const POPULAR_BOOKMAKERS = {
  draftkings: 'DraftKings',
  fanduel: 'FanDuel',
  betmgm: 'BetMGM',
  caesars: 'Caesars',
  betrivers: 'BetRivers',
  pointsbet: 'PointsBet',
  bovada: 'Bovada',
  betonlineag: 'BetOnline.ag'
} as const

// Convert American odds to implied probability percentage
export function oddsToPercentage(odds: number): number {
  if (odds < 0) {
    // Negative odds (favorites): probability = (-odds) / ((-odds) + 100)
    return Math.round((-odds / (-odds + 100)) * 100)
  } else {
    // Positive odds (underdogs): probability = 100 / (odds + 100)
    return Math.round((100 / (odds + 100)) * 100)
  }
}

// Get color class based on win probability
export function getProbabilityColor(percentage: number): string {
  if (percentage >= 70) return 'text-green-400'
  if (percentage >= 55) return 'text-emerald-400'
  if (percentage >= 45) return 'text-yellow-400'
  if (percentage >= 30) return 'text-orange-400'
  return 'text-red-400'
}

// Get background gradient based on win probability
export function getProbabilityGradient(percentage: number): string {
  if (percentage >= 70) return 'from-green-500/20 to-green-500/5'
  if (percentage >= 55) return 'from-emerald-500/20 to-emerald-500/5'
  if (percentage >= 45) return 'from-yellow-500/15 to-yellow-500/5'
  if (percentage >= 30) return 'from-orange-500/15 to-orange-500/5'
  return 'from-red-500/15 to-red-500/5'
}

// Get bar color class based on win probability
export function getProbabilityBarColor(percentage: number): string {
  if (percentage >= 70) return 'bg-green-500'
  if (percentage >= 55) return 'bg-emerald-500'
  if (percentage >= 45) return 'bg-yellow-500'
  if (percentage >= 30) return 'bg-orange-500'
  return 'bg-red-500'
}
