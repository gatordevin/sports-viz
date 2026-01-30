import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  Alert,
  AlertPreferences,
  DEFAULT_PREFERENCES,
  generateAlerts,
  GameWithPrediction
} from '@/lib/alerts'
import { predictGame, findValueBets, MarketOdds, TeamPredictionData, ValueBet } from '@/lib/predictor'
import {
  getNBAScoreboard,
  getNFLScoreboard,
  Game,
  getTeamBettingStats,
  getTeamInjuries,
  getTeamSchedule,
  getTeamRecentGames
} from '@/lib/espn'
import { getOdds, OddsEvent, getBestOdds } from '@/lib/odds'
import { calculateRestInfo } from '@/lib/bettingStats'

// In-memory storage for demo (in production, use a database)
const alertPreferencesStore: Map<string, AlertPreferences> = new Map()
const readAlertsStore: Map<string, Set<string>> = new Map()

// GET /api/alerts - Get user's alerts
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    const effectiveUserId = userId || 'anonymous'

    // Get user preferences
    const preferences: AlertPreferences = alertPreferencesStore.get(effectiveUserId) || {
      ...DEFAULT_PREFERENCES,
      userId: effectiveUserId
    }

    // Fetch current games and generate alerts
    const [nbaGames, nflGames] = await Promise.all([
      preferences.sports.includes('nba') ? getNBAScoreboard() : [],
      preferences.sports.includes('nfl') ? getNFLScoreboard() : []
    ])

    // Get odds for games
    const [nbaOdds, nflOdds] = await Promise.all([
      preferences.sports.includes('nba') ? getOdds('nba') : [],
      preferences.sports.includes('nfl') ? getOdds('nfl') : []
    ])

    // Build game predictions
    const gamesWithPredictions: GameWithPrediction[] = []

    // Process NBA games
    for (const game of nbaGames.slice(0, 10)) {
      const prediction = await buildGamePrediction(game, 'nba', nbaOdds)
      if (prediction) {
        gamesWithPredictions.push(prediction)
      }
    }

    // Process NFL games
    for (const game of nflGames.slice(0, 10)) {
      const prediction = await buildGamePrediction(game, 'nfl', nflOdds)
      if (prediction) {
        gamesWithPredictions.push(prediction)
      }
    }

    // Generate alerts
    const alerts = generateAlerts(gamesWithPredictions, preferences)

    // Mark alerts that have been read
    const readAlerts = readAlertsStore.get(effectiveUserId) || new Set()
    const alertsWithReadStatus = alerts.map(alert => ({
      ...alert,
      read: readAlerts.has(alert.id)
    }))

    return NextResponse.json({
      alerts: alertsWithReadStatus,
      preferences,
      unreadCount: alertsWithReadStatus.filter(a => !a.read).length
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

// POST /api/alerts/preferences - Save preferences
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    const effectiveUserId = userId || 'anonymous'

    const body = await request.json()
    const { action, ...data } = body

    if (action === 'save_preferences') {
      const preferences: AlertPreferences = {
        ...DEFAULT_PREFERENCES,
        ...data,
        userId: effectiveUserId
      }
      alertPreferencesStore.set(effectiveUserId, preferences)

      return NextResponse.json({ success: true, preferences })
    }

    if (action === 'mark_read') {
      const { alertId } = data
      if (!readAlertsStore.has(effectiveUserId)) {
        readAlertsStore.set(effectiveUserId, new Set())
      }
      readAlertsStore.get(effectiveUserId)!.add(alertId)

      return NextResponse.json({ success: true })
    }

    if (action === 'mark_all_read') {
      const { alertIds } = data
      if (!readAlertsStore.has(effectiveUserId)) {
        readAlertsStore.set(effectiveUserId, new Set())
      }
      const readAlerts = readAlertsStore.get(effectiveUserId)!
      alertIds.forEach((id: string) => readAlerts.add(id))

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error handling alerts action:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// Helper function to build game prediction
async function buildGamePrediction(
  game: Game,
  sport: 'nba' | 'nfl',
  odds: OddsEvent[]
): Promise<GameWithPrediction | null> {
  try {
    // Get team stats and recent games
    const [homeStats, awayStats, homeRecentGames, awayRecentGames] = await Promise.all([
      getTeamBettingStats(sport, game.homeTeam.id),
      getTeamBettingStats(sport, game.awayTeam.id),
      getTeamRecentGames(sport, game.homeTeam.id, 10).catch(() => []),
      getTeamRecentGames(sport, game.awayTeam.id, 10).catch(() => [])
    ])

    if (!homeStats || !awayStats) return null

    // Get injuries
    const [homeInjuries, awayInjuries] = await Promise.all([
      getTeamInjuries(sport, game.homeTeam.id).catch(() => []),
      getTeamInjuries(sport, game.awayTeam.id).catch(() => [])
    ])

    // Get schedule for rest calculation
    const [homeSchedule, awaySchedule] = await Promise.all([
      getTeamSchedule(sport, game.homeTeam.id).catch(() => []),
      getTeamSchedule(sport, game.awayTeam.id).catch(() => [])
    ])

    const gameDate = new Date(game.date)

    // Build team prediction data
    const homeTeamData: TeamPredictionData = {
      id: game.homeTeam.id,
      name: game.homeTeam.displayName,
      ppg: homeStats.pointsPerGame,
      oppg: homeStats.pointsAllowedPerGame,
      pointDiff: homeStats.pointDifferential,
      recentGames: homeRecentGames,
      injuries: homeInjuries.map(i => ({
        status: i.status,
        playerName: i.playerName || 'Unknown',
        position: i.position || ''
      })),
      isHome: true,
      restInfo: homeSchedule.length > 0 ? calculateRestInfo(homeSchedule, gameDate) : undefined
    }

    const awayTeamData: TeamPredictionData = {
      id: game.awayTeam.id,
      name: game.awayTeam.displayName,
      ppg: awayStats.pointsPerGame,
      oppg: awayStats.pointsAllowedPerGame,
      pointDiff: awayStats.pointDifferential,
      recentGames: awayRecentGames,
      injuries: awayInjuries.map(i => ({
        status: i.status,
        playerName: i.playerName || 'Unknown',
        position: i.position || ''
      })),
      isHome: false,
      restInfo: awaySchedule.length > 0 ? calculateRestInfo(awaySchedule, gameDate) : undefined
    }

    // Get prediction
    const prediction = predictGame(homeTeamData, awayTeamData, sport)

    // Find matching odds
    const gameOdds = odds.find(o =>
      o.home_team.toLowerCase().includes(game.homeTeam.abbreviation?.toLowerCase() || '') ||
      game.homeTeam.displayName.toLowerCase().includes(o.home_team.toLowerCase())
    )

    let valueBets: ValueBet[] = []

    if (gameOdds && gameOdds.bookmakers.length > 0) {
      // Get best odds from bookmakers
      const bestML = getBestOdds(gameOdds, 'h2h')
      const spreadMarket = gameOdds.bookmakers[0]?.markets.find(m => m.key === 'spreads')
      const totalsMarket = gameOdds.bookmakers[0]?.markets.find(m => m.key === 'totals')

      const homeSpread = spreadMarket?.outcomes.find(o => o.name === gameOdds.home_team)
      const totalOver = totalsMarket?.outcomes.find(o => o.name === 'Over')

      const marketOdds: MarketOdds = {
        spread: homeSpread?.point || 0,
        total: totalOver?.point || (sport === 'nba' ? 220 : 45),
        homeMoneyline: bestML.home?.price || -110,
        awayMoneyline: bestML.away?.price || -110
      }

      valueBets = findValueBets(prediction, marketOdds, game.id)
    }

    return {
      gameId: game.id,
      homeTeam: game.homeTeam.displayName,
      awayTeam: game.awayTeam.displayName,
      gameTime: game.date,
      sport,
      prediction,
      valueBets,
      injuries: {
        home: homeInjuries.map(i => ({
          playerName: i.playerName || 'Unknown',
          status: i.status
        })),
        away: awayInjuries.map(i => ({
          playerName: i.playerName || 'Unknown',
          status: i.status
        }))
      }
    }
  } catch (error) {
    console.error('Error building game prediction:', error)
    return null
  }
}
