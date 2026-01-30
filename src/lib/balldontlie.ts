// BallDontLie API Integration
// Provides detailed NBA player stats, game logs, and season averages
// API Documentation: https://www.balldontlie.io/

const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY || ''
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
  home_team?: BDLTeam
  visitor_team?: BDLTeam
  home_team_id: number
  visitor_team_id: number
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
async function fetchBDL<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const url = new URL(`${BALLDONTLIE_BASE}${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': BALLDONTLIE_API_KEY,
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!res.ok) {
      console.error(`BallDontLie API error: ${res.status} for ${endpoint}`)
      return null
    }

    return res.json()
  } catch (error) {
    console.error(`BallDontLie fetch error for ${endpoint}:`, error)
    return null
  }
}

// Get all NBA teams
export async function getBDLTeams(): Promise<BDLTeam[]> {
  try {
    const response = await fetchBDL<PaginatedResponse<BDLTeam>>('/teams')
    return response?.data ?? []
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
    return response?.data ?? []
  } catch (error) {
    console.error('Error searching players:', error)
    return []
  }
}

// Get player by ID
export async function getPlayer(playerId: number): Promise<BDLPlayer | null> {
  try {
    const response = await fetchBDL<{ data: BDLPlayer }>(`/players/${playerId}`)
    return response?.data ?? null
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
    return response?.data ?? []
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
    return response?.data ?? []
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
    return response?.data ?? []
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
  perPage: number = 25,
  season?: number
): Promise<BDLPlayerStats[]> {
  try {
    const params: Record<string, string> = {
      per_page: perPage.toString()
    }

    // Season filter - use seasons[] array format as required by API
    if (season) {
      params['seasons[]'] = season.toString()
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
    return response?.data ?? []
  } catch (error) {
    console.error('Error fetching player stats:', error)
    return []
  }
}

// Get season averages for a single player
export async function getSeasonAverage(
  season: number,
  playerId: number
): Promise<BDLSeasonAverage | null> {
  try {
    const response = await fetchBDL<{ data: BDLSeasonAverage[] }>('/season_averages', {
      season: season.toString(),
      player_id: playerId.toString()
    })
    return response?.data?.[0] ?? null
  } catch (error) {
    console.error('Error fetching season average:', error)
    return null
  }
}

// Get season averages for multiple players (fetches in parallel)
export async function getSeasonAverages(
  season: number,
  playerIds: number[]
): Promise<BDLSeasonAverage[]> {
  try {
    // Fetch each player's stats in parallel
    const promises = playerIds.map(id => getSeasonAverage(season, id))
    const results = await Promise.all(promises)
    // Filter out nulls and return
    return results.filter((avg): avg is BDLSeasonAverage => avg !== null)
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

// BallDontLie Team IDs (1-30 for current NBA teams)
export const BDL_TEAM_IDS = {
  hawks: 1, celtics: 2, nets: 3, hornets: 4, bulls: 5,
  cavaliers: 6, mavericks: 7, nuggets: 8, pistons: 9, warriors: 10,
  rockets: 11, pacers: 12, clippers: 13, lakers: 14, grizzlies: 15,
  heat: 16, bucks: 17, timberwolves: 18, pelicans: 19, knicks: 20,
  thunder: 21, magic: 22, sixers: 23, suns: 24, blazers: 25,
  kings: 26, spurs: 27, raptors: 28, jazz: 29, wizards: 30
} as const

// BallDontLie Team ID to Abbreviation mapping
export const BDL_TEAM_ABBR: Record<number, string> = {
  1: 'ATL', 2: 'BOS', 3: 'BKN', 4: 'CHA', 5: 'CHI',
  6: 'CLE', 7: 'DAL', 8: 'DEN', 9: 'DET', 10: 'GSW',
  11: 'HOU', 12: 'IND', 13: 'LAC', 14: 'LAL', 15: 'MEM',
  16: 'MIA', 17: 'MIL', 18: 'MIN', 19: 'NOP', 20: 'NYK',
  21: 'OKC', 22: 'ORL', 23: 'PHI', 24: 'PHX', 25: 'POR',
  26: 'SAC', 27: 'SAS', 28: 'TOR', 29: 'UTA', 30: 'WAS'
}

// Helper to get team abbreviation from BDL team ID
export function getTeamAbbr(teamId: number): string {
  return BDL_TEAM_ABBR[teamId] || 'N/A'
}

// ESPN Team ID to BallDontLie Team ID mapping
// ESPN uses different IDs than BallDontLie
export const ESPN_TO_BDL_TEAM_MAP: Record<string, number> = {
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

// BallDontLie Team ID to ESPN Team ID mapping (reverse of above)
export const BDL_TO_ESPN_TEAM_MAP: Record<number, string> = {
  1: '1',   // Hawks
  2: '2',   // Celtics
  3: '17',  // Nets
  4: '30',  // Hornets
  5: '4',   // Bulls
  6: '5',   // Cavaliers
  7: '6',   // Mavericks
  8: '7',   // Nuggets
  9: '8',   // Pistons
  10: '9',  // Warriors
  11: '10', // Rockets
  12: '11', // Pacers
  13: '12', // Clippers
  14: '13', // Lakers
  15: '29', // Grizzlies
  16: '14', // Heat
  17: '15', // Bucks
  18: '16', // Timberwolves
  19: '3',  // Pelicans
  20: '18', // Knicks
  21: '25', // Thunder
  22: '19', // Magic
  23: '20', // 76ers
  24: '21', // Suns
  25: '22', // Trail Blazers
  26: '23', // Kings
  27: '24', // Spurs
  28: '28', // Raptors
  29: '26', // Jazz
  30: '27'  // Wizards
}

// Helper to convert BDL team ID to ESPN team ID
export function bdlToEspnTeamId(bdlTeamId: number): string | null {
  return BDL_TO_ESPN_TEAM_MAP[bdlTeamId] || null
}

// Get active players for a team (current roster)
export async function getActivePlayersByTeam(teamId: number, perPage: number = 50): Promise<BDLPlayer[]> {
  try {
    const response = await fetchBDL<PaginatedResponse<BDLPlayer>>('/players/active', {
      'team_ids[]': teamId.toString(),
      per_page: perPage.toString()
    })
    return response?.data ?? []
  } catch (error) {
    console.error('Error fetching active players:', error)
    return []
  }
}

// Get active players by ESPN team ID (converts to BDL ID internally)
export async function getActivePlayersByESPNTeam(espnTeamId: string): Promise<BDLPlayer[]> {
  const bdlTeamId = ESPN_TO_BDL_TEAM_MAP[espnTeamId]
  if (!bdlTeamId) {
    console.error(`No BDL team mapping for ESPN team ID: ${espnTeamId}`)
    return []
  }
  return getActivePlayersByTeam(bdlTeamId)
}
