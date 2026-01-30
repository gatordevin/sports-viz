// Real Betting Statistics using BallDontLie API
// Calculates actual ATS records, O/U records from historical game data with real spreads

const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY || ''
const BALLDONTLIE_BASE = 'https://api.balldontlie.io'

// Types for BallDontLie API responses
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
  home_team_score: number
  visitor_team_score: number
  datetime: string
  home_team: BDLTeam
  visitor_team: BDLTeam
}

interface BDLOdds {
  id: number
  game_id: number
  vendor: string
  spread_home_value: string | null
  spread_away_value: string | null
  total_value: string | null
  updated_at: string
}

// ATS Result for a single game
interface ATSGameResult {
  gameId: number
  date: string
  opponent: string
  isHome: boolean
  teamScore: number
  opponentScore: number
  spread: number // The spread the team had to cover (negative = favorite)
  actualMargin: number // How much team won/lost by
  covered: boolean // Did team cover the spread?
  push: boolean // Was it exactly on the spread?
  total: number // O/U line
  gameTotal: number // Actual combined score
  wentOver: boolean
  totalPush: boolean
}

// Complete ATS/O/U record for a team
export interface RealATSRecord {
  wins: number
  losses: number
  pushes: number
  percentage: number
  homeATS: { wins: number; losses: number; pushes: number }
  awayATS: { wins: number; losses: number; pushes: number }
  recentATS: ('W' | 'L' | 'P')[]
  isRealData: boolean
}

export interface RealOURecord {
  overs: number
  unders: number
  pushes: number
  overPercentage: number
  averageTotalPoints: number
  recentOU: ('O' | 'U' | 'P')[]
  isRealData: boolean
}

// Cache for API responses to avoid rate limits
const gameCache: Map<string, BDLGame[]> = new Map()
const oddsCache: Map<number, BDLOdds[]> = new Map()

// Fetch helper with authorization
async function fetchBDL<T>(endpoint: string, version: 'v1' | 'v2' = 'v1'): Promise<T | null> {
  if (!BALLDONTLIE_API_KEY) {
    console.warn('BALLDONTLIE_API_KEY not set')
    return null
  }

  try {
    const res = await fetch(`${BALLDONTLIE_BASE}/${version}${endpoint}`, {
      headers: {
        'Authorization': BALLDONTLIE_API_KEY
      },
      next: { revalidate: 1800 } // Cache for 30 minutes
    })

    if (!res.ok) {
      console.error(`BallDontLie API error: ${res.status} for ${endpoint}`)
      return null
    }

    return res.json()
  } catch (error) {
    console.error(`BallDontLie fetch error:`, error)
    return null
  }
}

// Get last N days of dates for API query
function getDateRange(days: number): string[] {
  const dates: string[] = []
  const today = new Date()

  for (let i = 1; i <= days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }

  return dates
}

// Fetch games for a team over the last N days
async function fetchTeamGames(teamId: number, days: number = 30): Promise<BDLGame[]> {
  const cacheKey = `team-${teamId}-${days}`

  if (gameCache.has(cacheKey)) {
    return gameCache.get(cacheKey)!
  }

  const dates = getDateRange(days)
  const dateParams = dates.map(d => `dates[]=${d}`).join('&')

  const response = await fetchBDL<{ data: BDLGame[] }>(`/games?team_ids[]=${teamId}&${dateParams}&per_page=50`)

  if (!response?.data) return []

  // Filter to only completed games
  const completedGames = response.data.filter(g => g.status === 'Final')

  gameCache.set(cacheKey, completedGames)
  return completedGames
}

// Fetch betting odds for a specific game
async function fetchGameOdds(gameId: number): Promise<BDLOdds[]> {
  if (oddsCache.has(gameId)) {
    return oddsCache.get(gameId)!
  }

  const response = await fetchBDL<{ data: BDLOdds[] }>(`/odds?game_ids[]=${gameId}`, 'v2')

  if (!response?.data) return []

  oddsCache.set(gameId, response.data)
  return response.data
}

// Get the consensus spread from odds data (prefer DraftKings/FanDuel)
function getConsensusSpread(odds: BDLOdds[], isHome: boolean): number | null {
  // Priority order for sportsbooks
  const priorityBooks = ['draftkings', 'fanduel', 'caesars', 'betmgm', 'betrivers']

  for (const book of priorityBooks) {
    const bookOdds = odds.find(o => o.vendor === book)
    if (bookOdds) {
      const spreadStr = isHome ? bookOdds.spread_home_value : bookOdds.spread_away_value
      if (spreadStr) {
        return parseFloat(spreadStr)
      }
    }
  }

  // Fallback to any available spread
  for (const o of odds) {
    const spreadStr = isHome ? o.spread_home_value : o.spread_away_value
    if (spreadStr) {
      return parseFloat(spreadStr)
    }
  }

  return null
}

// Get the consensus total from odds data
function getConsensusTotal(odds: BDLOdds[]): number | null {
  const priorityBooks = ['draftkings', 'fanduel', 'caesars', 'betmgm', 'betrivers']

  for (const book of priorityBooks) {
    const bookOdds = odds.find(o => o.vendor === book)
    if (bookOdds?.total_value) {
      return parseFloat(bookOdds.total_value)
    }
  }

  // Fallback to any available total
  for (const o of odds) {
    if (o.total_value) {
      return parseFloat(o.total_value)
    }
  }

  return null
}

// Calculate ATS result for a single game
function calculateGameATS(
  game: BDLGame,
  odds: BDLOdds[],
  teamId: number
): ATSGameResult | null {
  const isHome = game.home_team.id === teamId
  const teamScore = isHome ? game.home_team_score : game.visitor_team_score
  const opponentScore = isHome ? game.visitor_team_score : game.home_team_score
  const opponent = isHome ? game.visitor_team.full_name : game.home_team.full_name

  const spread = getConsensusSpread(odds, isHome)
  const total = getConsensusTotal(odds)

  if (spread === null) {
    return null // Can't calculate without spread
  }

  const actualMargin = teamScore - opponentScore
  // To cover spread: margin > -spread for favorites, margin > spread for underdogs
  // Simplified: margin + spread > 0 means covered
  const coverMargin = actualMargin + spread

  const covered = coverMargin > 0
  const push = coverMargin === 0

  const gameTotal = teamScore + opponentScore
  const wentOver = total !== null && gameTotal > total
  const totalPush = total !== null && gameTotal === total

  return {
    gameId: game.id,
    date: game.date,
    opponent,
    isHome,
    teamScore,
    opponentScore,
    spread,
    actualMargin,
    covered,
    push,
    total: total || 0,
    gameTotal,
    wentOver,
    totalPush
  }
}

// ESPN to BallDontLie team ID mapping
const ESPN_TO_BDL_TEAM_MAP: Record<string, number> = {
  '1': 1,   // Hawks
  '2': 2,   // Celtics
  '17': 3,  // Nets
  '30': 4,  // Hornets
  '4': 5,   // Bulls
  '5': 6,   // Cavaliers
  '6': 7,   // Mavericks
  '7': 8,   // Nuggets
  '8': 9,   // Pistons
  '9': 10,  // Warriors
  '10': 11, // Rockets
  '11': 12, // Pacers
  '12': 13, // Clippers
  '13': 14, // Lakers
  '29': 15, // Grizzlies
  '14': 16, // Heat
  '15': 17, // Bucks
  '16': 18, // Timberwolves
  '3': 19,  // Pelicans
  '18': 20, // Knicks
  '25': 21, // Thunder
  '19': 22, // Magic
  '20': 23, // 76ers
  '21': 24, // Suns
  '22': 25, // Trail Blazers
  '23': 26, // Kings
  '24': 27, // Spurs
  '28': 28, // Raptors
  '26': 29, // Jazz
  '27': 30  // Wizards
}

/**
 * Calculate REAL ATS record for a team using BallDontLie API
 * This fetches actual historical spreads and compares against game results
 */
export async function calculateRealATSRecord(
  espnTeamId: string,
  limit: number = 15
): Promise<RealATSRecord> {
  const bdlTeamId = ESPN_TO_BDL_TEAM_MAP[espnTeamId]

  if (!bdlTeamId) {
    console.warn(`No BDL mapping for ESPN team ID: ${espnTeamId}`)
    return getFallbackATSRecord()
  }

  try {
    // Fetch recent games
    const games = await fetchTeamGames(bdlTeamId, 45) // Look back 45 days

    if (games.length === 0) {
      return getFallbackATSRecord()
    }

    // Fetch odds for each game in parallel
    const oddsPromises = games.slice(0, limit).map(g => fetchGameOdds(g.id))
    const allOdds = await Promise.all(oddsPromises)

    // Calculate ATS results
    const results: ATSGameResult[] = []

    for (let i = 0; i < Math.min(games.length, limit); i++) {
      const result = calculateGameATS(games[i], allOdds[i], bdlTeamId)
      if (result) {
        results.push(result)
      }
    }

    if (results.length === 0) {
      return getFallbackATSRecord()
    }

    // Aggregate results
    let wins = 0, losses = 0, pushes = 0
    let homeWins = 0, homeLosses = 0, homePushes = 0
    let awayWins = 0, awayLosses = 0, awayPushes = 0
    const recentATS: ('W' | 'L' | 'P')[] = []

    for (const r of results) {
      if (r.push) {
        pushes++
        if (r.isHome) homePushes++
        else awayPushes++
        if (recentATS.length < 10) recentATS.push('P')
      } else if (r.covered) {
        wins++
        if (r.isHome) homeWins++
        else awayWins++
        if (recentATS.length < 10) recentATS.push('W')
      } else {
        losses++
        if (r.isHome) homeLosses++
        else awayLosses++
        if (recentATS.length < 10) recentATS.push('L')
      }
    }

    const totalGames = wins + losses
    const percentage = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

    return {
      wins,
      losses,
      pushes,
      percentage,
      homeATS: { wins: homeWins, losses: homeLosses, pushes: homePushes },
      awayATS: { wins: awayWins, losses: awayLosses, pushes: awayPushes },
      recentATS,
      isRealData: true
    }
  } catch (error) {
    console.error(`Error calculating ATS for team ${espnTeamId}:`, error)
    return getFallbackATSRecord()
  }
}

/**
 * Calculate REAL O/U record for a team using BallDontLie API
 */
export async function calculateRealOURecord(
  espnTeamId: string,
  limit: number = 15
): Promise<RealOURecord> {
  const bdlTeamId = ESPN_TO_BDL_TEAM_MAP[espnTeamId]

  if (!bdlTeamId) {
    console.warn(`No BDL mapping for ESPN team ID: ${espnTeamId}`)
    return getFallbackOURecord()
  }

  try {
    // Fetch recent games
    const games = await fetchTeamGames(bdlTeamId, 45)

    if (games.length === 0) {
      return getFallbackOURecord()
    }

    // Fetch odds for each game in parallel
    const oddsPromises = games.slice(0, limit).map(g => fetchGameOdds(g.id))
    const allOdds = await Promise.all(oddsPromises)

    // Calculate O/U results
    let overs = 0, unders = 0, pushes = 0
    let totalPoints = 0
    let gamesWithTotals = 0
    const recentOU: ('O' | 'U' | 'P')[] = []

    for (let i = 0; i < Math.min(games.length, limit); i++) {
      const game = games[i]
      const odds = allOdds[i]
      const total = getConsensusTotal(odds)

      if (total === null) continue

      const gameTotal = game.home_team_score + game.visitor_team_score
      totalPoints += gameTotal
      gamesWithTotals++

      if (gameTotal > total) {
        overs++
        if (recentOU.length < 10) recentOU.push('O')
      } else if (gameTotal < total) {
        unders++
        if (recentOU.length < 10) recentOU.push('U')
      } else {
        pushes++
        if (recentOU.length < 10) recentOU.push('P')
      }
    }

    if (gamesWithTotals === 0) {
      return getFallbackOURecord()
    }

    const totalGames = overs + unders
    const overPercentage = totalGames > 0 ? Math.round((overs / totalGames) * 100) : 0
    const averageTotalPoints = Math.round(totalPoints / gamesWithTotals)

    return {
      overs,
      unders,
      pushes,
      overPercentage,
      averageTotalPoints,
      recentOU,
      isRealData: true
    }
  } catch (error) {
    console.error(`Error calculating O/U for team ${espnTeamId}:`, error)
    return getFallbackOURecord()
  }
}

// Fallback records when real data is unavailable
function getFallbackATSRecord(): RealATSRecord {
  return {
    wins: 0,
    losses: 0,
    pushes: 0,
    percentage: 0,
    homeATS: { wins: 0, losses: 0, pushes: 0 },
    awayATS: { wins: 0, losses: 0, pushes: 0 },
    recentATS: [],
    isRealData: false
  }
}

function getFallbackOURecord(): RealOURecord {
  return {
    overs: 0,
    unders: 0,
    pushes: 0,
    overPercentage: 0,
    averageTotalPoints: 0,
    recentOU: [],
    isRealData: false
  }
}

/**
 * Batch fetch ATS and O/U records for multiple teams
 * More efficient than individual calls
 */
export async function batchFetchBettingStats(
  espnTeamIds: string[]
): Promise<Map<string, { ats: RealATSRecord; ou: RealOURecord }>> {
  const results = new Map<string, { ats: RealATSRecord; ou: RealOURecord }>()

  // Process in parallel but with some batching to avoid rate limits
  const batchSize = 4

  for (let i = 0; i < espnTeamIds.length; i += batchSize) {
    const batch = espnTeamIds.slice(i, i + batchSize)

    const promises = batch.map(async (teamId) => {
      const [ats, ou] = await Promise.all([
        calculateRealATSRecord(teamId),
        calculateRealOURecord(teamId)
      ])
      return { teamId, ats, ou }
    })

    const batchResults = await Promise.all(promises)

    for (const { teamId, ats, ou } of batchResults) {
      results.set(teamId, { ats, ou })
    }
  }

  return results
}
