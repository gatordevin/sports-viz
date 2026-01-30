const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports'

export interface Team {
  id: string
  displayName: string
  abbreviation: string
  color: string
  alternateColor: string
  logo: string
  record?: string
  location?: string
  nickname?: string
}

export interface Game {
  id: string
  date: string
  status: {
    type: {
      name: string
      state: string
      completed: boolean
    }
    displayClock?: string
    period?: number
  }
  homeTeam: Team
  awayTeam: Team
  homeScore: string
  awayScore: string
  venue?: string
  broadcast?: string
}

export interface ESPNPlayer {
  id: string
  fullName: string
  firstName: string
  lastName: string
  displayName: string
  position: string
  positionAbbr: string
  jersey: string
  height: string
  weight: string
  age: number
  dateOfBirth: string
  birthPlace?: string
  college?: string
  experience?: number
  salary?: number
  headshot?: string
  status: string
}

export interface ESPNNews {
  id: string
  headline: string
  description: string
  published: string
  images: { url: string; caption?: string }[]
  links: { href: string }[]
  categories: { description: string; type: string }[]
}

export interface ESPNStanding {
  team: Team
  stats: {
    wins: number
    losses: number
    winPercentage: number
    gamesBehind: number
    streak: string
    last10: string
    homeRecord: string
    awayRecord: string
    conferenceRecord: string
    divisionRecord: string
    pointsFor: number
    pointsAgainst: number
    pointDiff: number
  }
  rank: number
  playoffSeed: number
}

export interface NBAPlayer {
  id: string
  fullName: string
  position: string
  jersey: string
  team: Team
}

// Fetch NBA scoreboard
export async function getNBAScoreboard(): Promise<Game[]> {
  const res = await fetch(`${ESPN_BASE_URL}/basketball/nba/scoreboard`, {
    next: { revalidate: 60 }
  })
  const data = await res.json()

  if (!data.events) return []

  return data.events.map((event: any) => {
    const competition = event.competitions[0]
    const homeTeamData = competition.competitors.find((c: any) => c.homeAway === 'home')
    const awayTeamData = competition.competitors.find((c: any) => c.homeAway === 'away')

    return {
      id: event.id,
      date: event.date,
      status: event.status,
      homeTeam: {
        id: homeTeamData.team.id,
        displayName: homeTeamData.team.displayName,
        abbreviation: homeTeamData.team.abbreviation,
        color: homeTeamData.team.color || '333333',
        alternateColor: homeTeamData.team.alternateColor || 'ffffff',
        logo: homeTeamData.team.logo,
        record: homeTeamData.records?.[0]?.summary,
      },
      awayTeam: {
        id: awayTeamData.team.id,
        displayName: awayTeamData.team.displayName,
        abbreviation: awayTeamData.team.abbreviation,
        color: awayTeamData.team.color || '333333',
        alternateColor: awayTeamData.team.alternateColor || 'ffffff',
        logo: awayTeamData.team.logo,
        record: awayTeamData.records?.[0]?.summary,
      },
      homeScore: homeTeamData.score || '0',
      awayScore: awayTeamData.score || '0',
      venue: competition.venue?.fullName,
      broadcast: competition.broadcasts?.[0]?.names?.[0],
    }
  })
}

// Fetch NFL scoreboard
export async function getNFLScoreboard(): Promise<Game[]> {
  const res = await fetch(`${ESPN_BASE_URL}/football/nfl/scoreboard`, {
    next: { revalidate: 60 }
  })
  const data = await res.json()

  if (!data.events) return []

  return data.events.map((event: any) => {
    const competition = event.competitions[0]
    const homeTeamData = competition.competitors.find((c: any) => c.homeAway === 'home')
    const awayTeamData = competition.competitors.find((c: any) => c.homeAway === 'away')

    return {
      id: event.id,
      date: event.date,
      status: event.status,
      homeTeam: {
        id: homeTeamData.team.id,
        displayName: homeTeamData.team.displayName,
        abbreviation: homeTeamData.team.abbreviation,
        color: homeTeamData.team.color || '333333',
        alternateColor: homeTeamData.team.alternateColor || 'ffffff',
        logo: homeTeamData.team.logo,
        record: homeTeamData.records?.[0]?.summary,
      },
      awayTeam: {
        id: awayTeamData.team.id,
        displayName: awayTeamData.team.displayName,
        abbreviation: awayTeamData.team.abbreviation,
        color: awayTeamData.team.color || '333333',
        alternateColor: awayTeamData.team.alternateColor || 'ffffff',
        logo: awayTeamData.team.logo,
        record: awayTeamData.records?.[0]?.summary,
      },
      homeScore: homeTeamData.score || '0',
      awayScore: awayTeamData.score || '0',
      venue: competition.venue?.fullName,
      broadcast: competition.broadcasts?.[0]?.names?.[0],
    }
  })
}

// Fetch NBA teams
export async function getNBATeams(): Promise<Team[]> {
  const res = await fetch(`${ESPN_BASE_URL}/basketball/nba/teams`, {
    next: { revalidate: 3600 }
  })
  const data = await res.json()

  if (!data.sports?.[0]?.leagues?.[0]?.teams) return []

  return data.sports[0].leagues[0].teams.map((t: any) => ({
    id: t.team.id,
    displayName: t.team.displayName,
    abbreviation: t.team.abbreviation,
    color: t.team.color || '333333',
    alternateColor: t.team.alternateColor || 'ffffff',
    logo: t.team.logos?.[0]?.href || '',
  }))
}

// Fetch NFL teams
export async function getNFLTeams(): Promise<Team[]> {
  const res = await fetch(`${ESPN_BASE_URL}/football/nfl/teams`, {
    next: { revalidate: 3600 }
  })
  const data = await res.json()

  if (!data.sports?.[0]?.leagues?.[0]?.teams) return []

  return data.sports[0].leagues[0].teams.map((t: any) => ({
    id: t.team.id,
    displayName: t.team.displayName,
    abbreviation: t.team.abbreviation,
    color: t.team.color || '333333',
    alternateColor: t.team.alternateColor || 'ffffff',
    logo: t.team.logos?.[0]?.href || '',
  }))
}

// Fetch team details with roster
export async function getTeamDetails(sport: 'nba' | 'nfl', teamId: string) {
  const sportPath = sport === 'nba' ? 'basketball/nba' : 'football/nfl'
  const res = await fetch(`${ESPN_BASE_URL}/${sportPath}/teams/${teamId}`, {
    next: { revalidate: 3600 }
  })
  return res.json()
}

// Fetch team roster
export async function getTeamRoster(sport: 'nba' | 'nfl', teamId: string): Promise<ESPNPlayer[]> {
  const sportPath = sport === 'nba' ? 'basketball/nba' : 'football/nfl'
  const res = await fetch(`${ESPN_BASE_URL}/${sportPath}/teams/${teamId}/roster`, {
    next: { revalidate: 3600 }
  })
  const data = await res.json()

  if (!data.athletes) return []

  return data.athletes.map((athlete: any) => ({
    id: athlete.id,
    fullName: athlete.fullName,
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    displayName: athlete.displayName,
    position: athlete.position?.displayName || '',
    positionAbbr: athlete.position?.abbreviation || '',
    jersey: athlete.jersey || '',
    height: athlete.displayHeight || '',
    weight: athlete.displayWeight || '',
    age: athlete.age || 0,
    dateOfBirth: athlete.dateOfBirth || '',
    birthPlace: athlete.birthPlace ? `${athlete.birthPlace.city}, ${athlete.birthPlace.state || athlete.birthPlace.country}` : '',
    college: athlete.college?.name || '',
    experience: athlete.experience?.years || 0,
    salary: athlete.contract?.salary || 0,
    headshot: athlete.headshot?.href || '',
    status: athlete.status?.type || 'Active'
  }))
}

// Fetch news for a sport
export async function getNews(sport: 'nba' | 'nfl', limit: number = 10): Promise<ESPNNews[]> {
  const sportPath = sport === 'nba' ? 'basketball/nba' : 'football/nfl'
  const res = await fetch(`${ESPN_BASE_URL}/${sportPath}/news?limit=${limit}`, {
    next: { revalidate: 300 }
  })
  const data = await res.json()

  if (!data.articles) return []

  return data.articles.map((article: any) => ({
    id: article.id,
    headline: article.headline,
    description: article.description || '',
    published: article.published,
    images: article.images || [],
    links: article.links || [],
    categories: article.categories || []
  }))
}

// Get detailed team info
export async function getTeamDetailedInfo(sport: 'nba' | 'nfl', teamId: string) {
  const sportPath = sport === 'nba' ? 'basketball/nba' : 'football/nfl'
  const res = await fetch(`${ESPN_BASE_URL}/${sportPath}/teams/${teamId}`, {
    next: { revalidate: 3600 }
  })
  const data = await res.json()

  if (!data.team) return null

  const team = data.team
  return {
    id: team.id,
    displayName: team.displayName,
    abbreviation: team.abbreviation,
    location: team.location,
    name: team.name,
    color: team.color || '333333',
    alternateColor: team.alternateColor || 'ffffff',
    logo: team.logos?.[0]?.href || '',
    venue: team.franchise?.venue?.fullName || '',
    venueCapacity: team.franchise?.venue?.capacity || 0,
    record: team.record?.items?.[0]?.summary || '',
    standing: team.standingSummary || '',
    nextEvent: team.nextEvent?.[0] || null,
    links: team.links || []
  }
}

// Get game summary/box score
export async function getGameSummary(sport: 'nba' | 'nfl', gameId: string) {
  const sportPath = sport === 'nba' ? 'basketball/nba' : 'football/nfl'
  const res = await fetch(`${ESPN_BASE_URL}/${sportPath}/summary?event=${gameId}`, {
    next: { revalidate: 60 }
  })
  return res.json()
}

// Get team schedule
export async function getTeamSchedule(sport: 'nba' | 'nfl', teamId: string) {
  const sportPath = sport === 'nba' ? 'basketball/nba' : 'football/nfl'
  const res = await fetch(`${ESPN_BASE_URL}/${sportPath}/teams/${teamId}/schedule`, {
    next: { revalidate: 3600 }
  })
  return res.json()
}

// Format player salary
export function formatSalary(salary: number): string {
  if (salary >= 1000000) {
    return `$${(salary / 1000000).toFixed(1)}M`
  } else if (salary >= 1000) {
    return `$${(salary / 1000).toFixed(0)}K`
  }
  return `$${salary}`
}

// Get list of all team IDs - CORRECT ESPN API IDs
export const NBA_TEAM_IDS = {
  hawks: '1', celtics: '2', nets: '17', hornets: '30', bulls: '4',
  cavaliers: '5', mavericks: '6', nuggets: '7', pistons: '8', warriors: '9',
  rockets: '10', pacers: '11', clippers: '12', lakers: '13', grizzlies: '29',
  heat: '14', bucks: '15', timberwolves: '16', pelicans: '3', knicks: '18',
  thunder: '25', magic: '19', sixers: '20', suns: '21', blazers: '22',
  kings: '23', spurs: '24', raptors: '28', jazz: '26', wizards: '27'
} as const

export const NFL_TEAM_IDS = {
  cardinals: '22', falcons: '1', ravens: '33', bills: '2', panthers: '29',
  bears: '3', bengals: '4', browns: '5', cowboys: '6', broncos: '7',
  lions: '8', packers: '9', texans: '34', colts: '11', jaguars: '30',
  chiefs: '12', raiders: '13', chargers: '24', rams: '14', dolphins: '15',
  vikings: '16', patriots: '17', saints: '18', giants: '19', jets: '20',
  eagles: '21', steelers: '23', fortyniners: '25', seahawks: '26', buccaneers: '27',
  titans: '10', commanders: '28'
} as const

// Injury interfaces
export interface Injury {
  playerId: string
  playerName: string
  position: string
  status: 'Out' | 'Doubtful' | 'Questionable' | 'Probable' | 'Day-To-Day' | 'Unknown'
  description?: string
  isStarter?: boolean
}

export interface TeamInjuries {
  teamId: string
  teamName: string
  injuries: Injury[]
}

// Fetch team injuries using ESPN Core API
export async function getTeamInjuries(sport: 'nba' | 'nfl', teamId: string): Promise<Injury[]> {
  const league = sport === 'nba' ? 'nba' : 'nfl'
  const sportPath = sport === 'nba' ? 'basketball' : 'football'

  try {
    // Use the ESPN Core API which actually returns injury data
    const coreApiUrl = `https://sports.core.api.espn.com/v2/sports/${sportPath}/leagues/${league}/teams/${teamId}/injuries`
    const res = await fetch(coreApiUrl, {
      next: { revalidate: 900 } // 15 minutes
    })

    if (!res.ok) return []

    const data = await res.json()

    // The core API returns items with $ref links, we need to fetch each one
    if (!data.items || data.items.length === 0) return []

    // Fetch injury details in parallel (limit to first 10 to avoid too many requests)
    const injuryPromises = data.items.slice(0, 10).map(async (item: any) => {
      try {
        // Fetch the injury detail
        const injuryRes = await fetch(item.$ref, { next: { revalidate: 900 } })
        if (!injuryRes.ok) return null
        const injuryData = await injuryRes.json()

        // Fetch the athlete detail to get name and position
        let playerName = 'Unknown'
        let position = ''

        if (injuryData.athlete?.$ref) {
          try {
            const athleteRes = await fetch(injuryData.athlete.$ref, { next: { revalidate: 3600 } })
            if (athleteRes.ok) {
              const athleteData = await athleteRes.json()
              playerName = athleteData.displayName || athleteData.fullName || 'Unknown'
              position = athleteData.position?.abbreviation || athleteData.position?.name || ''
            }
          } catch {
            // If we can't get athlete, use what we have
          }
        }

        return {
          playerId: injuryData.athlete?.$ref?.split('/athletes/')?.[1]?.split('/')?.[0] || '',
          playerName,
          position,
          status: normalizeInjuryStatus(injuryData.status || injuryData.type?.description || ''),
          description: injuryData.details?.detail
            ? `${injuryData.details.side || ''} ${injuryData.details.type || ''} ${injuryData.details.detail || ''}`.trim()
            : injuryData.shortComment || '',
          isStarter: false
        }
      } catch {
        return null
      }
    })

    const injuries = await Promise.all(injuryPromises)
    return injuries.filter((i): i is Injury => i !== null)
  } catch (error) {
    console.error(`Error fetching injuries for team ${teamId}:`, error)
    return []
  }
}

// Normalize injury status strings
function normalizeInjuryStatus(status: string): Injury['status'] {
  const s = status?.toLowerCase() || ''
  if (s.includes('out')) return 'Out'
  if (s.includes('doubtful')) return 'Doubtful'
  if (s.includes('questionable')) return 'Questionable'
  if (s.includes('probable')) return 'Probable'
  if (s.includes('day-to-day') || s.includes('day to day')) return 'Day-To-Day'
  return 'Unknown'
}

// Get team stats for betting context
export interface TeamBettingStats {
  teamId: string
  teamName: string
  abbreviation: string
  logo: string
  record: string
  homeRecord: string
  awayRecord: string
  conferenceRecord: string
  streak: string
  last10: string
  pointsPerGame: number
  pointsAllowedPerGame: number
  pointDifferential: number
  rank: number
  conferenceRank: number
}

// Parse record string like "25-15" into components
function parseRecord(record: string): { wins: number; losses: number } {
  const parts = record?.split('-') || ['0', '0']
  return {
    wins: parseInt(parts[0]) || 0,
    losses: parseInt(parts[1]) || 0
  }
}

// Fetch comprehensive team stats for betting
export async function getTeamBettingStats(sport: 'nba' | 'nfl', teamId: string): Promise<TeamBettingStats | null> {
  const sportPath = sport === 'nba' ? 'basketball/nba' : 'football/nfl'
  try {
    const res = await fetch(`${ESPN_BASE_URL}/${sportPath}/teams/${teamId}`, {
      next: { revalidate: 1800 } // 30 minutes
    })

    if (!res.ok) return null

    const data = await res.json()
    const team = data.team

    if (!team) return null

    // Extract stats from different record types
    const records = team.record?.items || []
    const overallRecord = records.find((r: any) => r.type === 'total') || records[0]
    const homeRecord = records.find((r: any) => r.type === 'home')
    const awayRecord = records.find((r: any) => r.type === 'road' || r.type === 'away')
    const confRecord = records.find((r: any) => r.type === 'conference')

    // Get stats from the stats array
    const stats = overallRecord?.stats || []
    const getStatValue = (name: string) => {
      const stat = stats.find((s: any) => s.name === name || s.abbreviation === name)
      return stat?.value || 0
    }

    return {
      teamId: team.id,
      teamName: team.displayName,
      abbreviation: team.abbreviation,
      logo: team.logos?.[0]?.href || '',
      record: overallRecord?.summary || '0-0',
      homeRecord: homeRecord?.summary || '-',
      awayRecord: awayRecord?.summary || '-',
      conferenceRecord: confRecord?.summary || '-',
      streak: getStatValue('streak') || '-',
      last10: '-', // ESPN doesn't directly provide this in team endpoint
      pointsPerGame: getStatValue('avgPointsFor') || getStatValue('pointsFor') / Math.max(parseRecord(overallRecord?.summary).wins + parseRecord(overallRecord?.summary).losses, 1),
      pointsAllowedPerGame: getStatValue('avgPointsAgainst') || getStatValue('pointsAgainst') / Math.max(parseRecord(overallRecord?.summary).wins + parseRecord(overallRecord?.summary).losses, 1),
      pointDifferential: getStatValue('pointDifferential') || (getStatValue('pointsFor') - getStatValue('pointsAgainst')),
      rank: team.rank || 0,
      conferenceRank: team.conferenceRank || 0
    }
  } catch (error) {
    console.error(`Error fetching betting stats for team ${teamId}:`, error)
    return null
  }
}

// Get recent games for form calculation
export interface RecentGame {
  date: string
  opponent: string
  opponentId: string
  isHome: boolean
  teamScore: number
  opponentScore: number
  result: 'W' | 'L'
}

export async function getTeamRecentGames(sport: 'nba' | 'nfl', teamId: string, limit: number = 10): Promise<RecentGame[]> {
  const sportPath = sport === 'nba' ? 'basketball/nba' : 'football/nfl'
  try {
    const res = await fetch(`${ESPN_BASE_URL}/${sportPath}/teams/${teamId}/schedule`, {
      next: { revalidate: 1800 }
    })

    if (!res.ok) return []

    const data = await res.json()
    const events = data.events || []

    // Filter completed games and get most recent
    const completedGames = events
      .filter((event: any) => event.competitions?.[0]?.status?.type?.completed)
      .slice(-limit)
      .reverse()

    return completedGames.map((event: any) => {
      const competition = event.competitions[0]
      const competitors = competition.competitors || []
      // ESPN API returns team.id as a number, but teamId is a string - need to compare as strings
      const team = competitors.find((c: any) => String(c.team?.id) === String(teamId))
      const opponent = competitors.find((c: any) => String(c.team?.id) !== String(teamId))

      // ESPN API returns score as an object with value/displayValue, or sometimes just a string
      const teamScore = parseInt(team?.score?.displayValue || team?.score) || 0
      const opponentScore = parseInt(opponent?.score?.displayValue || opponent?.score) || 0

      return {
        date: event.date,
        opponent: opponent?.team?.displayName || 'Unknown',
        opponentId: opponent?.team?.id || '',
        isHome: team?.homeAway === 'home',
        teamScore,
        opponentScore,
        result: teamScore > opponentScore ? 'W' : 'L'
      }
    })
  } catch (error) {
    console.error(`Error fetching recent games for team ${teamId}:`, error)
    return []
  }
}

// Calculate form from recent games (last N games)
export function calculateForm(recentGames: RecentGame[], n: number = 5): { record: string; results: ('W' | 'L')[] } {
  const games = recentGames.slice(0, n)
  const wins = games.filter(g => g.result === 'W').length
  const losses = games.filter(g => g.result === 'L').length
  return {
    record: `${wins}-${losses}`,
    results: games.map(g => g.result)
  }
}

// Get head-to-head record between two teams
export async function getHeadToHead(sport: 'nba' | 'nfl', team1Id: string, team2Id: string, seasons: number = 3): Promise<{
  team1Wins: number
  team2Wins: number
  avgMargin: number
  recentGames: { date: string; team1Score: number; team2Score: number; winner: string }[]
}> {
  try {
    // Get recent games for team1 and filter for matchups against team2
    const recentGames = await getTeamRecentGames(sport, team1Id, 50)
    const h2hGames = recentGames.filter(g => g.opponentId === team2Id)

    const team1Wins = h2hGames.filter(g => g.result === 'W').length
    const team2Wins = h2hGames.filter(g => g.result === 'L').length

    const margins = h2hGames.map(g => g.teamScore - g.opponentScore)
    const avgMargin = margins.length > 0
      ? margins.reduce((a, b) => a + b, 0) / margins.length
      : 0

    return {
      team1Wins,
      team2Wins,
      avgMargin,
      recentGames: h2hGames.slice(0, 5).map(g => ({
        date: g.date,
        team1Score: g.teamScore,
        team2Score: g.opponentScore,
        winner: g.result === 'W' ? 'team1' : 'team2'
      }))
    }
  } catch (error) {
    console.error('Error fetching head-to-head:', error)
    return { team1Wins: 0, team2Wins: 0, avgMargin: 0, recentGames: [] }
  }
}

// Team name to ID mapping helper - CORRECT ESPN API IDs
export function findTeamIdByName(sport: 'nba' | 'nfl', teamName: string): string | null {
  const normalizedName = teamName.toLowerCase().trim()

  if (sport === 'nba') {
    // Correct ESPN NBA team IDs (verified from ESPN API)
    const nbaMapping: Record<string, string> = {
      'atlanta hawks': '1', 'hawks': '1',
      'boston celtics': '2', 'celtics': '2',
      'brooklyn nets': '17', 'nets': '17',
      'charlotte hornets': '30', 'hornets': '30',
      'chicago bulls': '4', 'bulls': '4',
      'cleveland cavaliers': '5', 'cavaliers': '5', 'cavs': '5',
      'dallas mavericks': '6', 'mavericks': '6', 'mavs': '6',
      'denver nuggets': '7', 'nuggets': '7',
      'detroit pistons': '8', 'pistons': '8',
      'golden state warriors': '9', 'warriors': '9',
      'houston rockets': '10', 'rockets': '10',
      'indiana pacers': '11', 'pacers': '11',
      'la clippers': '12', 'los angeles clippers': '12', 'clippers': '12',
      'los angeles lakers': '13', 'la lakers': '13', 'lakers': '13',
      'memphis grizzlies': '29', 'grizzlies': '29',
      'miami heat': '14', 'heat': '14',
      'milwaukee bucks': '15', 'bucks': '15',
      'minnesota timberwolves': '16', 'timberwolves': '16', 'wolves': '16',
      'new orleans pelicans': '3', 'pelicans': '3',
      'new york knicks': '18', 'knicks': '18',
      'oklahoma city thunder': '25', 'thunder': '25', 'okc thunder': '25',
      'orlando magic': '19', 'magic': '19',
      'philadelphia 76ers': '20', '76ers': '20', 'sixers': '20',
      'phoenix suns': '21', 'suns': '21',
      'portland trail blazers': '22', 'trail blazers': '22', 'blazers': '22',
      'sacramento kings': '23', 'kings': '23',
      'san antonio spurs': '24', 'spurs': '24',
      'toronto raptors': '28', 'raptors': '28',
      'utah jazz': '26', 'jazz': '26',
      'washington wizards': '27', 'wizards': '27'
    }

    return nbaMapping[normalizedName] || null
  }

  if (sport === 'nfl') {
    // Correct ESPN NFL team IDs (verified from ESPN API)
    const nflMapping: Record<string, string> = {
      'arizona cardinals': '22', 'cardinals': '22',
      'atlanta falcons': '1', 'falcons': '1',
      'baltimore ravens': '33', 'ravens': '33',
      'buffalo bills': '2', 'bills': '2',
      'carolina panthers': '29', 'panthers': '29',
      'chicago bears': '3', 'bears': '3',
      'cincinnati bengals': '4', 'bengals': '4',
      'cleveland browns': '5', 'browns': '5',
      'dallas cowboys': '6', 'cowboys': '6',
      'denver broncos': '7', 'broncos': '7',
      'detroit lions': '8', 'lions': '8',
      'green bay packers': '9', 'packers': '9',
      'houston texans': '34', 'texans': '34',
      'indianapolis colts': '11', 'colts': '11',
      'jacksonville jaguars': '30', 'jaguars': '30',
      'kansas city chiefs': '12', 'chiefs': '12',
      'las vegas raiders': '13', 'raiders': '13',
      'los angeles chargers': '24', 'la chargers': '24', 'chargers': '24',
      'los angeles rams': '14', 'la rams': '14', 'rams': '14',
      'miami dolphins': '15', 'dolphins': '15',
      'minnesota vikings': '16', 'vikings': '16',
      'new england patriots': '17', 'patriots': '17',
      'new orleans saints': '18', 'saints': '18',
      'new york giants': '19', 'giants': '19', 'ny giants': '19',
      'new york jets': '20', 'jets': '20', 'ny jets': '20',
      'philadelphia eagles': '21', 'eagles': '21',
      'pittsburgh steelers': '23', 'steelers': '23',
      'san francisco 49ers': '25', '49ers': '25', 'niners': '25',
      'seattle seahawks': '26', 'seahawks': '26',
      'tampa bay buccaneers': '27', 'buccaneers': '27', 'bucs': '27',
      'tennessee titans': '10', 'titans': '10',
      'washington commanders': '28', 'commanders': '28'
    }

    return nflMapping[normalizedName] || null
  }

  return null
}
