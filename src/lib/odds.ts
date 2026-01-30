// The Odds API Integration
// API Documentation: https://the-odds-api.com/liveapi/guides/v4/

const ODDS_API_KEY = process.env.ODDS_API_KEY || ''
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'

export interface Bookmaker {
  key: string
  title: string
  last_update: string
  markets: Market[]
}

export interface Market {
  key: string
  last_update: string
  outcomes: Outcome[]
}

export interface Outcome {
  name: string
  price: number
  point?: number
}

export interface OddsEvent {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Bookmaker[]
}

export interface Sport {
  key: string
  group: string
  title: string
  description: string
  active: boolean
  has_outrights: boolean
}

// Get list of available sports
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

// Get odds for a specific sport
export async function getOdds(
  sportKey: string,
  markets: string[] = ['h2h', 'spreads', 'totals'],
  regions: string[] = ['us']
): Promise<OddsEvent[]> {
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

  const res = await fetch(`${ODDS_API_BASE}/sports/${sportKey}/odds?${params}`, {
    next: { revalidate: 300 } // Revalidate every 5 minutes
  })

  if (!res.ok) {
    console.error('Failed to fetch odds:', res.status)
    return []
  }

  return res.json()
}

// Get NBA odds
export async function getNBAOdds(): Promise<OddsEvent[]> {
  return getOdds('basketball_nba')
}

// Get NFL odds
export async function getNFLOdds(): Promise<OddsEvent[]> {
  return getOdds('americanfootball_nfl')
}

// Get MLB odds
export async function getMLBOdds(): Promise<OddsEvent[]> {
  return getOdds('baseball_mlb')
}

// Get NHL odds
export async function getNHLOdds(): Promise<OddsEvent[]> {
  return getOdds('icehockey_nhl')
}

// Get NCAAB odds
export async function getNCAABOdds(): Promise<OddsEvent[]> {
  return getOdds('basketball_ncaab')
}

// Get NCAAF odds
export async function getNCAAFOdds(): Promise<OddsEvent[]> {
  return getOdds('americanfootball_ncaaf')
}

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
export function getBestOdds(event: OddsEvent, marketKey: string = 'h2h'): { home: Outcome | null; away: Outcome | null; bookmaker: string } {
  let bestHome: Outcome | null = null
  let bestAway: Outcome | null = null
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
export function getBookmakerOdds(event: OddsEvent, bookmakerKey: string): Bookmaker | undefined {
  return event.bookmakers.find(b => b.key === bookmakerKey)
}

// Popular US bookmaker keys
export const POPULAR_BOOKMAKERS = {
  draftkings: 'DraftKings',
  fanduel: 'FanDuel',
  betmgm: 'BetMGM',
  caesars: 'Caesars',
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
