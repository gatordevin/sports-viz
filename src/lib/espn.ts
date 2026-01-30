const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports'

export interface Team {
  id: string
  displayName: string
  abbreviation: string
  color: string
  alternateColor: string
  logo: string
  record?: string
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
export async function getTeamRoster(sport: 'nba' | 'nfl', teamId: string) {
  const sportPath = sport === 'nba' ? 'basketball/nba' : 'football/nfl'
  const res = await fetch(`${ESPN_BASE_URL}/${sportPath}/teams/${teamId}/roster`, {
    next: { revalidate: 3600 }
  })
  return res.json()
}
