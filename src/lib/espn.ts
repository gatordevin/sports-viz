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

// Get list of all team IDs
export const NBA_TEAM_IDS = {
  hawks: '1', celtics: '2', nets: '3', hornets: '4', bulls: '5',
  cavaliers: '6', mavericks: '7', nuggets: '8', pistons: '9', warriors: '10',
  rockets: '11', pacers: '12', clippers: '13', lakers: '14', grizzlies: '15',
  heat: '16', bucks: '17', timberwolves: '18', pelicans: '19', knicks: '20',
  thunder: '21', magic: '22', sixers: '23', suns: '24', blazers: '25',
  kings: '26', spurs: '27', raptors: '28', jazz: '29', wizards: '30'
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
