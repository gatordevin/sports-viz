// BALLDONTLIE API v2 Odds Integration
// Primary source for live betting odds (GOAT subscription)
// Documentation: https://docs.balldontlie.io/

const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY || ''
const BALLDONTLIE_BASE = 'https://api.balldontlie.io'

// ============================================================================
// TYPES - BALLDONTLIE API Response Types
// ============================================================================

interface BDLTeam {
  id: number
  conference: string
  division: string
  city: string
  name: string
  full_name: string
  abbreviation: string
}

interface BDLGame {
  id: number
  date: string
  season: number
  status: string
  period: number
  time: string | null
  postseason: boolean
  home_team_score: number
  visitor_team_score: number
  home_team: BDLTeam
  visitor_team: BDLTeam
  datetime: string
}

interface BDLGamesResponse {
  data: BDLGame[]
  meta?: {
    per_page: number
    next_cursor?: number
  }
}

// Raw odds data from BALLDONTLIE API (does NOT include game object)
interface BDLOddsData {
  id: number
  game_id: number
  vendor: string
  spread_home_value: string | null
  spread_away_value: string | null
  spread_home_odds: number | null
  spread_away_odds: number | null
  moneyline_home_odds: number | null
  moneyline_away_odds: number | null
  total_value: string | null
  total_over_odds: number | null
  total_under_odds: number | null
  updated_at: string
}

interface BDLOddsResponse {
  data: BDLOddsData[]
  meta?: {
    per_page: number
    next_cursor?: number
  }
}

// ============================================================================
// TYPES - Unified Output Types (compatible with The Odds API format)
// ============================================================================

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

// ============================================================================
// API HELPERS
// ============================================================================

async function fetchBDL<T>(endpoint: string): Promise<T | null> {
  if (!BALLDONTLIE_API_KEY) {
    console.warn('BALLDONTLIE_API_KEY not set')
    return null
  }

  try {
    const url = `${BALLDONTLIE_BASE}${endpoint}`
    console.log(`[BDL Odds] Fetching: ${url}`)

    const res = await fetch(url, {
      headers: {
        'Authorization': BALLDONTLIE_API_KEY
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!res.ok) {
      console.error(`[BDL Odds] API error: ${res.status} for ${endpoint}`)
      return null
    }

    return res.json()
  } catch (error) {
    console.error(`[BDL Odds] Fetch error:`, error)
    return null
  }
}

// Get today and tomorrow's dates in YYYY-MM-DD format
function getUpcomingDates(): string[] {
  const dates: string[] = []
  const today = new Date()

  // Today and next 3 days to ensure we catch all upcoming games
  for (let i = 0; i <= 3; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }

  return dates
}

// ============================================================================
// VENDOR/SPORTSBOOK MAPPING
// ============================================================================

const VENDOR_DISPLAY_NAMES: Record<string, string> = {
  'draftkings': 'DraftKings',
  'fanduel': 'FanDuel',
  'betmgm': 'BetMGM',
  'caesars': 'Caesars',
  'betrivers': 'BetRivers',
  'bet365': 'Bet365',
  'betway': 'Betway',
  'pointsbet': 'PointsBet',
  'unibet': 'Unibet',
  'wynnbet': 'WynnBET',
  'fanatics': 'Fanatics',
  'kalshi': 'Kalshi',
  'polymarket': 'Polymarket'
}

function getVendorDisplayName(vendor: string): string {
  return VENDOR_DISPLAY_NAMES[vendor.toLowerCase()] || vendor
}

// ============================================================================
// ODDS CONVERSION
// ============================================================================

// Convert odds value to American format (handles both string and number)
function toAmericanOdds(odds: number | string | null): number {
  if (odds === null || odds === undefined) return -110 // Default juice

  const numOdds = typeof odds === 'string' ? parseFloat(odds) : odds

  // Already in American format (large positive/negative or typical -110, +100 range)
  if (Math.abs(numOdds) >= 100 || (numOdds < 0 && numOdds > -100)) {
    return Math.round(numOdds)
  }

  // Small numbers might be decimal odds, convert to American
  if (numOdds >= 2.0) {
    return Math.round((numOdds - 1) * 100)
  } else if (numOdds > 1.0) {
    return Math.round(-100 / (numOdds - 1))
  }

  return Math.round(numOdds)
}

// ============================================================================
// TRANSFORM BALLDONTLIE DATA TO UNIFIED FORMAT
// ============================================================================

function transformBDLOddsToEvents(
  oddsData: BDLOddsData[],
  gamesMap: Map<number, BDLGame>,
  sportKey: string,
  sportTitle: string
): OddsEvent[] {
  // Group odds by game_id
  const gameOddsMap = new Map<number, BDLOddsData[]>()

  for (const odds of oddsData) {
    const existing = gameOddsMap.get(odds.game_id) || []
    existing.push(odds)
    gameOddsMap.set(odds.game_id, existing)
  }

  // Transform each game's odds into an OddsEvent
  const events: OddsEvent[] = []

  for (const [gameId, gameOdds] of gameOddsMap) {
    // Get game info from games map
    const game = gamesMap.get(gameId)
    if (!game) {
      console.log(`[BDL Odds] No game found for game_id ${gameId}, skipping`)
      continue
    }

    // Skip completed games (status is 'Final' or similar)
    if (game.status === 'Final' || game.status.toLowerCase().includes('final')) {
      continue
    }

    // Build bookmakers array from all vendors
    const bookmakers: Bookmaker[] = []

    for (const odds of gameOdds) {
      const markets: Market[] = []

      // H2H (Moneyline) market
      if (odds.moneyline_home_odds !== null || odds.moneyline_away_odds !== null) {
        const h2hOutcomes: Outcome[] = []

        if (odds.moneyline_home_odds !== null) {
          h2hOutcomes.push({
            name: game.home_team.full_name,
            price: toAmericanOdds(odds.moneyline_home_odds)
          })
        }

        if (odds.moneyline_away_odds !== null) {
          h2hOutcomes.push({
            name: game.visitor_team.full_name,
            price: toAmericanOdds(odds.moneyline_away_odds)
          })
        }

        if (h2hOutcomes.length === 2) {
          markets.push({
            key: 'h2h',
            last_update: odds.updated_at,
            outcomes: h2hOutcomes
          })
        }
      }

      // Spreads market
      if (odds.spread_home_value || odds.spread_away_value) {
        const spreadOutcomes: Outcome[] = []

        if (odds.spread_home_value) {
          spreadOutcomes.push({
            name: game.home_team.full_name,
            price: toAmericanOdds(odds.spread_home_odds),
            point: parseFloat(odds.spread_home_value)
          })
        }

        if (odds.spread_away_value) {
          spreadOutcomes.push({
            name: game.visitor_team.full_name,
            price: toAmericanOdds(odds.spread_away_odds),
            point: parseFloat(odds.spread_away_value)
          })
        }

        if (spreadOutcomes.length === 2) {
          markets.push({
            key: 'spreads',
            last_update: odds.updated_at,
            outcomes: spreadOutcomes
          })
        }
      }

      // Totals (Over/Under) market
      if (odds.total_value) {
        const totalValue = parseFloat(odds.total_value)

        markets.push({
          key: 'totals',
          last_update: odds.updated_at,
          outcomes: [
            {
              name: 'Over',
              price: toAmericanOdds(odds.total_over_odds),
              point: totalValue
            },
            {
              name: 'Under',
              price: toAmericanOdds(odds.total_under_odds),
              point: totalValue
            }
          ]
        })
      }

      // Only add bookmaker if it has markets
      if (markets.length > 0) {
        bookmakers.push({
          key: odds.vendor.toLowerCase(),
          title: getVendorDisplayName(odds.vendor),
          last_update: odds.updated_at,
          markets
        })
      }
    }

    // Only create event if we have bookmakers with odds
    if (bookmakers.length > 0) {
      events.push({
        id: `bdl_${gameId}`,
        sport_key: sportKey,
        sport_title: sportTitle,
        commence_time: game.datetime,
        home_team: game.home_team.full_name,
        away_team: game.visitor_team.full_name,
        bookmakers
      })
    }
  }

  // Sort by commence_time
  events.sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime())

  return events
}

// ============================================================================
// PUBLIC API - Fetch NBA Odds from BALLDONTLIE
// ============================================================================

export async function getBDLNBAOdds(): Promise<OddsEvent[]> {
  const dates = getUpcomingDates()
  const dateParams = dates.map(d => `dates[]=${d}`).join('&')

  // Fetch both games and odds in parallel
  const [gamesResponse, oddsResponse] = await Promise.all([
    fetchBDL<BDLGamesResponse>(`/v1/games?${dateParams}&per_page=100`),
    fetchBDL<BDLOddsResponse>(`/nba/v2/odds?${dateParams}&per_page=100`)
  ])

  if (!gamesResponse?.data || gamesResponse.data.length === 0) {
    console.log('[BDL Odds] No NBA games found for dates')
    return []
  }

  if (!oddsResponse?.data || oddsResponse.data.length === 0) {
    console.log('[BDL Odds] No NBA odds data returned')
    return []
  }

  console.log(`[BDL Odds] Fetched ${gamesResponse.data.length} NBA games and ${oddsResponse.data.length} odds entries`)

  // Create games map for quick lookup
  const gamesMap = new Map<number, BDLGame>()
  for (const game of gamesResponse.data) {
    gamesMap.set(game.id, game)
  }

  return transformBDLOddsToEvents(oddsResponse.data, gamesMap, 'basketball_nba', 'NBA')
}

// Note: BALLDONTLIE has NFL odds too, but it's a different subscription tier
// For now, we'll focus on NBA which is covered by the GOAT subscription

export async function getBDLNFLOdds(): Promise<OddsEvent[]> {
  const dates = getUpcomingDates()
  const dateParams = dates.map(d => `dates[]=${d}`).join('&')

  // Fetch both games and odds in parallel
  const [gamesResponse, oddsResponse] = await Promise.all([
    fetchBDL<BDLGamesResponse>(`/nfl/v1/games?${dateParams}&per_page=100`),
    fetchBDL<BDLOddsResponse>(`/nfl/v2/odds?${dateParams}&per_page=100`)
  ])

  if (!gamesResponse?.data || !oddsResponse?.data) {
    console.log('[BDL Odds] No NFL data returned')
    return []
  }

  console.log(`[BDL Odds] Fetched ${gamesResponse.data.length} NFL games and ${oddsResponse.data.length} odds entries`)

  // Create games map for quick lookup
  const gamesMap = new Map<number, BDLGame>()
  for (const game of gamesResponse.data) {
    gamesMap.set(game.id, game)
  }

  return transformBDLOddsToEvents(oddsResponse.data, gamesMap, 'americanfootball_nfl', 'NFL')
}

// ============================================================================
// PLAYER PROPS (Bonus feature - not available in The Odds API free tier)
// ============================================================================

interface BDLPlayerProp {
  id: number
  game_id: number
  player_id: number
  vendor: string
  prop_type: string
  line_value: number
  market: {
    type: string
    odds?: number
    over_odds?: number
    under_odds?: number
  }
  updated_at: string
}

interface BDLPlayerPropsResponse {
  data: BDLPlayerProp[]
}

export interface PlayerProp {
  playerId: number
  propType: string
  line: number
  overOdds: number
  underOdds: number
  vendor: string
  updatedAt: string
}

export async function getBDLPlayerProps(gameId: number | string): Promise<PlayerProp[]> {
  // Extract numeric game ID if it has our bdl_ prefix
  const numericId = typeof gameId === 'string' && gameId.startsWith('bdl_')
    ? parseInt(gameId.replace('bdl_', ''))
    : typeof gameId === 'string'
    ? parseInt(gameId)
    : gameId

  const response = await fetchBDL<BDLPlayerPropsResponse>(
    `/nba/v2/odds/player_props?game_id=${numericId}`
  )

  if (!response?.data) {
    return []
  }

  return response.data.map(prop => ({
    playerId: prop.player_id,
    propType: prop.prop_type,
    line: prop.line_value,
    overOdds: toAmericanOdds(prop.market.over_odds ?? null),
    underOdds: toAmericanOdds(prop.market.under_odds ?? null),
    vendor: prop.vendor,
    updatedAt: prop.updated_at
  }))
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export function isBDLOddsAvailable(): boolean {
  return !!BALLDONTLIE_API_KEY
}

// Re-export helper functions that work with the unified format
export { toAmericanOdds, getVendorDisplayName }
