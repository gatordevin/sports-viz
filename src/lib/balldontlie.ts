// BallDontLie API Integration
// Provides detailed NBA player stats, game logs, and season averages
// API Documentation: https://www.balldontlie.io/

const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY || 'REDACTED_BDL_KEY_OLD'
const BALLDONTLIE_BASE = 'https://api.balldontlie.io/v1'

// Types
export interface BDLTeam {
  id: number
  conference: string
  division: string
  city: string
  name: string
  full_name: string
  abbreviation: string
}

export interface BDLPlayer {
  id: number
  first_name: string
  last_name: string
  position: string
  height: string
  weight: string
  jersey_number: string
  college: string
  country: string
  draft_year: number | null
  draft_round: number | null
  draft_number: number | null
  team: BDLTeam
}

export interface BDLGame {
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

export interface BDLPlayerStats {
  id: number
  min: string
  fgm: number
  fga: number
  fg_pct: number
  fg3m: number
  fg3a: number
  fg3_pct: number
  ftm: number
  fta: number
  ft_pct: number
  oreb: number
  dreb: number
  reb: number
  ast: number
  stl: number
  blk: number
  turnover: number
  pf: number
  pts: number
  player: BDLPlayer
  team: BDLTeam
  game: BDLGame
}

export interface BDLSeasonAverage {
  player_id: number
  season: number
  min: string
  fgm: number
  fga: number
  fg_pct: number
  fg3m: number
  fg3a: number
  fg3_pct: number
  ftm: number
  fta: number
  ft_pct: number
  oreb: number
  dreb: number
  reb: number
  ast: number
  stl: number
  blk: number
  turnover: number
  pf: number
  pts: number
  games_played: number
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    per_page: number
    next_cursor?: number
  }
}

// Helper function to make authenticated requests
async function fetchBDL<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BALLDONTLIE_BASE}${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': BALLDONTLIE_API_KEY,
    },
    next: { revalidate: 300 } // Cache for 5 minutes
  })

  if (!res.ok) {
    console.error(`BallDontLie API error: ${res.status}`)
    throw new Error(`BallDontLie API error: ${res.status}`)
  }

  return res.json()
}

// Get all NBA teams
export async function getBDLTeams(): Promise<BDLTeam[]> {
  try {
    const response = await fetchBDL<PaginatedResponse<BDLTeam>>('/teams')
    return response.data
  } catch (error) {
    console.error('Error fetching BDL teams:', error)
    return []
  }
}

// Search for players
export async function searchPlayers(query: string, perPage: number = 25): Promise<BDLPlayer[]> {
  try {
    const response = await fetchBDL<PaginatedResponse<BDLPlayer>>('/players', {
      search: query,
      per_page: perPage.toString()
    })
    return response.data
  } catch (error) {
    console.error('Error searching players:', error)
    return []
  }
}

// Get player by ID
export async function getPlayer(playerId: number): Promise<BDLPlayer | null> {
  try {
    const response = await fetchBDL<{ data: BDLPlayer }>(`/players/${playerId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching player:', error)
    return null
  }
}

// Get all players (paginated)
export async function getPlayers(page: number = 1, perPage: number = 25): Promise<BDLPlayer[]> {
  try {
    const response = await fetchBDL<PaginatedResponse<BDLPlayer>>('/players', {
      per_page: perPage.toString(),
      cursor: page.toString()
    })
    return response.data
  } catch (error) {
    console.error('Error fetching players:', error)
    return []
  }
}

// Get games for a specific date
export async function getGamesByDate(date: string): Promise<BDLGame[]> {
  try {
    const response = await fetchBDL<PaginatedResponse<BDLGame>>('/games', {
      'dates[]': date
    })
    return response.data
  } catch (error) {
    console.error('Error fetching games by date:', error)
    return []
  }
}

// Get games for a date range
export async function getGames(
  startDate?: string,
  endDate?: string,
  teamIds?: number[],
  perPage: number = 25
): Promise<BDLGame[]> {
  try {
    const params: Record<string, string> = {
      per_page: perPage.toString()
    }

    if (startDate) params['start_date'] = startDate
    if (endDate) params['end_date'] = endDate
    if (teamIds && teamIds.length > 0) {
      teamIds.forEach(id => {
        params[`team_ids[]`] = id.toString()
      })
    }

    const response = await fetchBDL<PaginatedResponse<BDLGame>>('/games', params)
    return response.data
  } catch (error) {
    console.error('Error fetching games:', error)
    return []
  }
}

// Get player stats for specific games/dates
export async function getPlayerStats(
  dates?: string[],
  playerIds?: number[],
  gameIds?: number[],
  perPage: number = 25
): Promise<BDLPlayerStats[]> {
  try {
    const params: Record<string, string> = {
      per_page: perPage.toString()
    }

    if (dates && dates.length > 0) {
      dates.forEach(date => {
        params['dates[]'] = date
      })
    }
    if (playerIds && playerIds.length > 0) {
      playerIds.forEach(id => {
        params['player_ids[]'] = id.toString()
      })
    }
    if (gameIds && gameIds.length > 0) {
      gameIds.forEach(id => {
        params['game_ids[]'] = id.toString()
      })
    }

    const response = await fetchBDL<PaginatedResponse<BDLPlayerStats>>('/stats', params)
    return response.data
  } catch (error) {
    console.error('Error fetching player stats:', error)
    return []
  }
}

// Get season averages for players
export async function getSeasonAverages(
  season: number,
  playerIds: number[]
): Promise<BDLSeasonAverage[]> {
  try {
    const params: Record<string, string> = {
      season: season.toString()
    }

    playerIds.forEach(id => {
      params['player_ids[]'] = id.toString()
    })

    const response = await fetchBDL<PaginatedResponse<BDLSeasonAverage>>('/season_averages', params)
    return response.data
  } catch (error) {
    console.error('Error fetching season averages:', error)
    return []
  }
}

// Helper: Get today's date string
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

// Helper: Get yesterday's date string
export function getYesterdayString(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

// Popular players for quick access
export const POPULAR_PLAYER_IDS = {
  lebronJames: 237,
  stephenCurry: 115,
  kevinDurant: 140,
  giannisAntetokounmpo: 15,
  lukaMaric: 666786, // Using available ID
  jaysonTatum: 434,
  jokicNikola: 246,
  embiidJoel: 145,
  bookerDevin: 47,
  anthonyEdwards: 666969
} as const
