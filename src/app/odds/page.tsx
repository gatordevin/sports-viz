import { getNBAOdds, getNFLOdds, OddsEvent, formatOdds, oddsToPercentage, getProbabilityColor, getProbabilityBarColor } from '@/lib/odds'
import {
  findTeamIdByName,
  getTeamInjuries,
  getTeamRecentGames,
  getTeamBettingStats,
  getHeadToHead,
  Injury,
  RecentGame,
  TeamBettingStats
} from '@/lib/espn'
import {
  calculateATSRecord,
  calculateOURecord,
  calculateRestInfo,
  detectLineMovement,
  ATSRecord,
  OURecord,
  RestInfo,
  LineMovement
} from '@/lib/bettingStats'
import {
  calculateRealATSRecord,
  calculateRealOURecord,
  RealATSRecord,
  RealOURecord
} from '@/lib/realBettingStats'
import {
  predictGame,
  findValueBets,
  GamePrediction,
  ValueBet,
  TeamPredictionData,
  MarketOdds
} from '@/lib/predictor'
import BettingCard from '@/components/BettingCard'
import { PredictionsSummary } from '@/components/PredictionBadge'
import Image from 'next/image'

export const revalidate = 300 // Revalidate every 5 minutes

interface EnrichedTeamData {
  id: string
  name: string
  abbreviation: string
  logo: string
  record: string
  homeRecord: string
  awayRecord: string
  conferenceRank?: number
  ppg: number
  oppg: number
  pointDiff: number
  recentGames: RecentGame[]
  injuries: Injury[]
  // Betting stats - can be real (from BallDontLie) or simulated
  atsRecord?: ATSRecord | RealATSRecord
  ouRecord?: OURecord | RealOURecord
  restInfo?: RestInfo
  isRealBettingData?: boolean // Flag to indicate if this is real data from BallDontLie
}

interface EnrichedEvent {
  event: OddsEvent
  homeTeamData: EnrichedTeamData | null
  awayTeamData: EnrichedTeamData | null
  h2h: {
    team1Wins: number
    team2Wins: number
    avgMargin: number
  } | null
  sport: 'nba' | 'nfl'
  homeLineMovement: LineMovement | null
  awayLineMovement: LineMovement | null
  // Prediction data
  prediction: GamePrediction | null
  valueBets: ValueBet[]
}

// Fetch enriched data for a team
async function getEnrichedTeamData(
  sport: 'nba' | 'nfl',
  teamName: string,
  gameDate: Date
): Promise<EnrichedTeamData | null> {
  const teamId = findTeamIdByName(sport, teamName)
  if (!teamId) return null

  try {
    const [stats, injuries, recentGames] = await Promise.all([
      getTeamBettingStats(sport, teamId),
      getTeamInjuries(sport, teamId),
      getTeamRecentGames(sport, teamId, 15) // Get more games for better ATS/OU calculation
    ])

    if (!stats) return null

    // Calculate rest info (this works for both NBA and NFL)
    // Returns null if no recent games available
    const restInfo = calculateRestInfo(recentGames, gameDate)

    // For NBA: Use REAL betting stats from BallDontLie API (which has actual historical spreads)
    // For NFL: Fall back to simulated stats (BallDontLie doesn't have NFL betting data)
    let atsRecord: ATSRecord | RealATSRecord | null | undefined = undefined
    let ouRecord: OURecord | RealOURecord | null | undefined = undefined
    let isRealBettingData = false

    if (sport === 'nba') {
      // Fetch real ATS/O/U records from BallDontLie (uses actual historical spreads)
      const [realATS, realOU] = await Promise.all([
        calculateRealATSRecord(teamId, 15),
        calculateRealOURecord(teamId, 15)
      ])

      // Only use real data if we actually got meaningful results
      if (realATS.isRealData && realATS.wins + realATS.losses > 0) {
        atsRecord = realATS
        isRealBettingData = true
      } else {
        // Fall back to simulated if real data unavailable (may return null)
        atsRecord = calculateATSRecord(recentGames) || undefined
      }

      if (realOU.isRealData && realOU.overs + realOU.unders > 0) {
        ouRecord = realOU
        isRealBettingData = true
      } else {
        // Fall back to simulated if real data unavailable (may return null)
        ouRecord = calculateOURecord(recentGames, sport) || undefined
      }
    } else {
      // NFL: Use simulated stats (no real betting data available)
      // These may return null if no recent games
      atsRecord = calculateATSRecord(recentGames) || undefined
      ouRecord = calculateOURecord(recentGames, sport) || undefined
    }

    return {
      id: teamId,
      name: stats.teamName,
      abbreviation: stats.abbreviation,
      logo: stats.logo,
      record: stats.record,
      homeRecord: stats.homeRecord,
      awayRecord: stats.awayRecord,
      conferenceRank: stats.conferenceRank,
      ppg: stats.pointsPerGame,
      oppg: stats.pointsAllowedPerGame,
      pointDiff: stats.pointDifferential,
      recentGames,
      injuries,
      atsRecord,
      ouRecord,
      restInfo: restInfo ?? undefined,
      isRealBettingData
    }
  } catch (error) {
    console.error(`Error enriching team data for ${teamName}:`, error)
    return null
  }
}

// Convert EnrichedTeamData to TeamPredictionData for predictor
function toTeamPredictionData(team: EnrichedTeamData, isHome: boolean): TeamPredictionData {
  return {
    id: team.id,
    name: team.name,
    ppg: team.ppg,
    oppg: team.oppg,
    pointDiff: team.pointDiff,
    recentGames: team.recentGames,
    atsRecord: team.atsRecord,
    ouRecord: team.ouRecord,
    restInfo: team.restInfo,
    injuries: team.injuries.map(i => ({
      status: i.status,
      playerName: i.playerName,
      position: i.position
    })),
    isHome
  }
}

// Extract market odds from event
function extractMarketOdds(event: OddsEvent): MarketOdds | null {
  const bookmaker = event.bookmakers.find(b => b.key === 'draftkings') || event.bookmakers[0]
  if (!bookmaker) return null

  const spreadMarket = bookmaker.markets.find(m => m.key === 'spreads')
  const totalMarket = bookmaker.markets.find(m => m.key === 'totals')
  const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h')

  const homeSpread = spreadMarket?.outcomes.find(o => o.name === event.home_team)
  const over = totalMarket?.outcomes.find(o => o.name === 'Over')
  const homeML = h2hMarket?.outcomes.find(o => o.name === event.home_team)
  const awayML = h2hMarket?.outcomes.find(o => o.name === event.away_team)

  if (!homeSpread?.point || !over?.point) return null

  return {
    spread: homeSpread.point,
    total: over.point,
    homeMoneyline: homeML?.price || -110,
    awayMoneyline: awayML?.price || -110
  }
}

// Enrich events with team data
async function enrichEvents(events: OddsEvent[], sport: 'nba' | 'nfl'): Promise<EnrichedEvent[]> {
  const enrichedEvents = await Promise.all(
    events.map(async (event) => {
      const gameDate = new Date(event.commence_time)

      const [homeTeamData, awayTeamData] = await Promise.all([
        getEnrichedTeamData(sport, event.home_team, gameDate),
        getEnrichedTeamData(sport, event.away_team, gameDate)
      ])

      let h2h = null
      if (homeTeamData && awayTeamData) {
        h2h = await getHeadToHead(sport, awayTeamData.id, homeTeamData.id)
      }

      // Detect line movement
      const homeLineMovement = detectLineMovement(event, 'home')
      const awayLineMovement = detectLineMovement(event, 'away')

      // Calculate prediction if we have team data
      let prediction: GamePrediction | null = null
      let valueBets: ValueBet[] = []

      if (homeTeamData && awayTeamData) {
        const homePredData = toTeamPredictionData(homeTeamData, true)
        const awayPredData = toTeamPredictionData(awayTeamData, false)

        prediction = predictGame(homePredData, awayPredData, sport, h2h || undefined)

        // Find value bets
        const marketOdds = extractMarketOdds(event)
        if (marketOdds && prediction) {
          valueBets = findValueBets(prediction, marketOdds, event.id)
        }
      }

      return {
        event,
        homeTeamData,
        awayTeamData,
        h2h,
        sport,
        homeLineMovement,
        awayLineMovement,
        prediction,
        valueBets
      }
    })
  )

  return enrichedEvents
}

// Simple probability bar for compact view
function ProbabilityBar({ percentage, reverse = false }: { percentage: number; reverse?: boolean }) {
  const barColor = getProbabilityBarColor(percentage)
  return (
    <div className={`h-2 w-full bg-white/10 rounded-full overflow-hidden ${reverse ? 'rotate-180' : ''}`}>
      <div
        className={`h-full ${barColor} transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// Compact odds card for mobile/overview
function CompactOddsCard({ enrichedEvent }: { enrichedEvent: EnrichedEvent }) {
  const { event, homeTeamData, awayTeamData, sport } = enrichedEvent
  const gameTime = new Date(event.commence_time)
  const isLive = gameTime <= new Date()

  const bookmaker = event.bookmakers.find(b => b.key === 'draftkings') || event.bookmakers[0]
  if (!bookmaker) return null

  const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h')
  const spreadMarket = bookmaker.markets.find(m => m.key === 'spreads')

  const homeH2h = h2hMarket?.outcomes.find(o => o.name === event.home_team)
  const awayH2h = h2hMarket?.outcomes.find(o => o.name === event.away_team)
  const awaySpread = spreadMarket?.outcomes.find(o => o.name === event.away_team)

  const awayPercentage = awayH2h ? oddsToPercentage(awayH2h.price) : 50
  const homePercentage = homeH2h ? oddsToPercentage(homeH2h.price) : 50

  return (
    <div className="glass-card rounded-xl p-4 hover:bg-white/5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${sport === 'nba' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
            {sport.toUpperCase()}
          </span>
          {isLive ? (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-500/20 text-red-400 rounded animate-pulse">
              LIVE
            </span>
          ) : (
            <span className="text-xs text-gray-500">
              {gameTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </div>
        {awaySpread && (
          <span className="text-xs font-mono text-gray-400">
            {awaySpread.point! > 0 ? '+' : ''}{awaySpread.point}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-2">
        {/* Away */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {awayTeamData?.logo && (
              <div className="w-6 h-6 relative flex-shrink-0">
                <Image src={awayTeamData.logo} alt="" fill className="object-contain" />
              </div>
            )}
            <span className="text-sm text-white truncate">{event.away_team.split(' ').pop()}</span>
            <span className="text-xs text-gray-500">{awayTeamData?.record || ''}</span>
          </div>
          <span className={`text-lg font-bold ${getProbabilityColor(awayPercentage)}`}>
            {awayPercentage}%
          </span>
        </div>

        {/* Probability bars */}
        <div className="flex items-center gap-2">
          <div className="flex-1"><ProbabilityBar percentage={awayPercentage} reverse /></div>
          <span className="text-[10px] text-gray-500">@</span>
          <div className="flex-1"><ProbabilityBar percentage={homePercentage} /></div>
        </div>

        {/* Home */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {homeTeamData?.logo && (
              <div className="w-6 h-6 relative flex-shrink-0">
                <Image src={homeTeamData.logo} alt="" fill className="object-contain" />
              </div>
            )}
            <span className="text-sm text-white truncate">{event.home_team.split(' ').pop()}</span>
            <span className="text-xs text-gray-500">{homeTeamData?.record || ''}</span>
          </div>
          <span className={`text-lg font-bold ${getProbabilityColor(homePercentage)}`}>
            {homePercentage}%
          </span>
        </div>
      </div>

      {/* Quick Stats Indicators */}
      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
        {/* Rest indicators */}
        <div className="flex items-center gap-2">
          {awayTeamData?.restInfo?.isBackToBack && (
            <span className="text-red-400">Away B2B</span>
          )}
          {homeTeamData?.restInfo?.isBackToBack && (
            <span className="text-red-400">Home B2B</span>
          )}
          {!awayTeamData?.restInfo?.isBackToBack && !homeTeamData?.restInfo?.isBackToBack && (
            <span className="text-gray-500">
              Rest: {awayTeamData?.restInfo?.daysOfRest || '?'}d vs {homeTeamData?.restInfo?.daysOfRest || '?'}d
            </span>
          )}
        </div>

        {/* Injury indicator */}
        {((awayTeamData?.injuries.length || 0) > 0 || (homeTeamData?.injuries.length || 0) > 0) && (
          <div className="flex items-center gap-1 text-yellow-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {(awayTeamData?.injuries.length || 0) + (homeTeamData?.injuries.length || 0)}
          </div>
        )}
      </div>
    </div>
  )
}

// Legend component
function ProbabilityLegend() {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-sm text-gray-400 mb-3">Win Probability Guide:</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-300">70%+ Strong Favorite</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-xs text-gray-300">55-69% Favorite</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-xs text-gray-300">45-54% Toss-up</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-xs text-gray-300">30-44% Underdog</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs text-gray-300">&lt;30% Long Shot</span>
        </div>
      </div>
    </div>
  )
}

// Betting stats legend
function BettingStatsLegend() {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-sm text-gray-400 mb-3">Betting Stats Guide:</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        <div>
          <span className="text-white font-medium">ATS</span>
          <p className="text-gray-500">Against The Spread record</p>
        </div>
        <div>
          <span className="text-white font-medium">O/U</span>
          <p className="text-gray-500">Over/Under record</p>
        </div>
        <div>
          <span className="text-white font-medium">B2B</span>
          <p className="text-gray-500">Back-to-back game</p>
        </div>
        <div>
          <span className="text-white font-medium">+R/-R</span>
          <p className="text-gray-500">Rest advantage</p>
        </div>
        <div>
          <span className="text-white font-medium">Off/Def</span>
          <p className="text-gray-500">Efficiency ratings</p>
        </div>
      </div>
    </div>
  )
}

// Quick stats summary
function QuickStats({
  nbaCount,
  nflCount,
  totalInjuries,
  backToBackGames,
  avgATSWinRate
}: {
  nbaCount: number
  nflCount: number
  totalInjuries: number
  backToBackGames: number
  avgATSWinRate: number
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div className="glass-card rounded-xl p-4">
        <div className="text-2xl font-bold text-white">{nbaCount + nflCount}</div>
        <div className="text-xs text-gray-400">Total Games</div>
      </div>
      <div className="glass-card rounded-xl p-4">
        <div className="text-2xl font-bold text-orange-400">{nbaCount}</div>
        <div className="text-xs text-gray-400">NBA Games</div>
      </div>
      <div className="glass-card rounded-xl p-4">
        <div className="text-2xl font-bold text-green-400">{nflCount}</div>
        <div className="text-xs text-gray-400">NFL Games</div>
      </div>
      <div className="glass-card rounded-xl p-4">
        <div className="text-2xl font-bold text-yellow-400">{totalInjuries}</div>
        <div className="text-xs text-gray-400">Injuries Reported</div>
      </div>
      <div className="glass-card rounded-xl p-4">
        <div className="text-2xl font-bold text-red-400">{backToBackGames}</div>
        <div className="text-xs text-gray-400">Back-to-Backs</div>
      </div>
    </div>
  )
}

export default async function BettingDashboard() {
  // Fetch odds for both sports
  const [nbaOdds, nflOdds] = await Promise.all([
    getNBAOdds(),
    getNFLOdds()
  ])

  // Enrich with team data (injuries, stats, form, betting stats)
  const [enrichedNBA, enrichedNFL] = await Promise.all([
    enrichEvents(nbaOdds, 'nba'),
    enrichEvents(nflOdds, 'nfl')
  ])

  // Combine all events sorted by time
  const allEnrichedEvents = [...enrichedNBA, ...enrichedNFL].sort((a, b) =>
    new Date(a.event.commence_time).getTime() - new Date(b.event.commence_time).getTime()
  )

  const hasOdds = allEnrichedEvents.length > 0

  // Calculate total injuries
  const totalInjuries = allEnrichedEvents.reduce((sum, e) => {
    return sum + (e.homeTeamData?.injuries.length || 0) + (e.awayTeamData?.injuries.length || 0)
  }, 0)

  // Calculate back-to-back games
  const backToBackGames = allEnrichedEvents.filter(e =>
    e.homeTeamData?.restInfo?.isBackToBack || e.awayTeamData?.restInfo?.isBackToBack
  ).length

  // Calculate average ATS win rate across all teams
  const atsRecords = allEnrichedEvents.flatMap(e => [
    e.homeTeamData?.atsRecord,
    e.awayTeamData?.atsRecord
  ]).filter(Boolean) as ATSRecord[]

  const avgATSWinRate = atsRecords.length > 0
    ? Math.round(atsRecords.reduce((sum, r) => sum + r.percentage, 0) / atsRecords.length)
    : 50

  // Group events by date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfter = new Date(tomorrow)
  dayAfter.setDate(dayAfter.getDate() + 1)

  const todayEvents = allEnrichedEvents.filter(e => {
    const eventDate = new Date(e.event.commence_time)
    return eventDate >= today && eventDate < tomorrow
  })

  const tomorrowEvents = allEnrichedEvents.filter(e => {
    const eventDate = new Date(e.event.commence_time)
    return eventDate >= tomorrow && eventDate < dayAfter
  })

  const laterEvents = allEnrichedEvents.filter(e => {
    const eventDate = new Date(e.event.commence_time)
    return eventDate >= dayAfter
  })

  return (
    <div className="min-h-screen bg-dark-950 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Betting Dashboard</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Complete betting analysis with ATS records, O/U trends, rest indicators, and key stats
          </p>
        </div>

        {!hasOdds ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">API Key Required</h3>
            <p className="text-gray-400 mb-4">
              To view live betting odds, please configure your Odds API key in the environment variables.
            </p>
            <div className="bg-dark-900 rounded-lg p-4 text-left max-w-md mx-auto">
              <p className="text-xs text-gray-500 mb-2">Add to .env.local:</p>
              <code className="text-sm text-primary">ODDS_API_KEY=your_api_key_here</code>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Get your free API key at{' '}
              <a href="https://the-odds-api.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                the-odds-api.com
              </a>
            </p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="mb-6">
              <QuickStats
                nbaCount={enrichedNBA.length}
                nflCount={enrichedNFL.length}
                totalInjuries={totalInjuries}
                backToBackGames={backToBackGames}
                avgATSWinRate={avgATSWinRate}
              />
            </div>

            {/* Legends */}
            <div className="mb-6 space-y-3">
              <ProbabilityLegend />
              <BettingStatsLegend />
            </div>

            {/* Predictions Summary - NBA */}
            {enrichedNBA.length > 0 && (
              <PredictionsSummary
                predictions={enrichedNBA
                  .filter(e => e.prediction)
                  .map(e => ({
                    prediction: e.prediction!,
                    valueBets: e.valueBets,
                    gameId: e.event.id,
                    gameTime: e.event.commence_time
                  }))}
                sport="nba"
              />
            )}

            {/* Predictions Summary - NFL */}
            {enrichedNFL.length > 0 && (
              <PredictionsSummary
                predictions={enrichedNFL
                  .filter(e => e.prediction)
                  .map(e => ({
                    prediction: e.prediction!,
                    valueBets: e.valueBets,
                    gameId: e.event.id,
                    gameTime: e.event.commence_time
                  }))}
                sport="nfl"
              />
            )}

            {/* Today's Games - Full Cards */}
            {todayEvents.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-xl font-bold text-white">Today&apos;s Games</h2>
                  <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
                    {todayEvents.length} games
                  </span>
                  {todayEvents.some(e => e.homeTeamData?.restInfo?.isBackToBack || e.awayTeamData?.restInfo?.isBackToBack) && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                      B2B Alert
                    </span>
                  )}
                  {todayEvents.some(e => e.valueBets.length > 0) && (
                    <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                      Value Bets
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {todayEvents.map((enrichedEvent) => (
                    <BettingCard
                      key={enrichedEvent.event.id}
                      event={enrichedEvent.event}
                      homeTeamData={enrichedEvent.homeTeamData}
                      awayTeamData={enrichedEvent.awayTeamData}
                      h2h={enrichedEvent.h2h || undefined}
                      sport={enrichedEvent.sport}
                      homeLineMovement={enrichedEvent.homeLineMovement}
                      awayLineMovement={enrichedEvent.awayLineMovement}
                      prediction={enrichedEvent.prediction}
                      valueBets={enrichedEvent.valueBets}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Tomorrow's Games - Full Cards */}
            {tomorrowEvents.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-xl font-bold text-white">Tomorrow</h2>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-full">
                    {tomorrowEvents.length} games
                  </span>
                  {tomorrowEvents.some(e => e.valueBets.length > 0) && (
                    <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                      Value Bets
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {tomorrowEvents.map((enrichedEvent) => (
                    <BettingCard
                      key={enrichedEvent.event.id}
                      event={enrichedEvent.event}
                      homeTeamData={enrichedEvent.homeTeamData}
                      awayTeamData={enrichedEvent.awayTeamData}
                      h2h={enrichedEvent.h2h || undefined}
                      sport={enrichedEvent.sport}
                      homeLineMovement={enrichedEvent.homeLineMovement}
                      awayLineMovement={enrichedEvent.awayLineMovement}
                      prediction={enrichedEvent.prediction}
                      valueBets={enrichedEvent.valueBets}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Later Games - Compact Cards */}
            {laterEvents.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-xl font-bold text-white">Upcoming</h2>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-full">
                    {laterEvents.length} games
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {laterEvents.map((enrichedEvent) => (
                    <CompactOddsCard key={enrichedEvent.event.id} enrichedEvent={enrichedEvent} />
                  ))}
                </div>
              </section>
            )}

            {/* No games today/tomorrow fallback */}
            {todayEvents.length === 0 && tomorrowEvents.length === 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-xl font-bold text-white">All Upcoming Games</h2>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-full">
                    {allEnrichedEvents.length} games
                  </span>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {allEnrichedEvents.slice(0, 10).map((enrichedEvent) => (
                    <BettingCard
                      key={enrichedEvent.event.id}
                      event={enrichedEvent.event}
                      homeTeamData={enrichedEvent.homeTeamData}
                      awayTeamData={enrichedEvent.awayTeamData}
                      h2h={enrichedEvent.h2h || undefined}
                      sport={enrichedEvent.sport}
                      homeLineMovement={enrichedEvent.homeLineMovement}
                      awayLineMovement={enrichedEvent.awayLineMovement}
                      prediction={enrichedEvent.prediction}
                      valueBets={enrichedEvent.valueBets}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Footer info */}
        <div className="mt-10 text-center text-xs sm:text-sm text-gray-500">
          <p>Odds from DraftKings via The Odds API. Team data from ESPN. Lines update every 5 minutes.</p>
          <p className="mt-1">Predictions based on power ratings, efficiency, form, injuries, rest, and H2H history.</p>
          <p className="mt-1">Value bets shown when our model differs significantly from market lines.</p>
          <p className="mt-1">Always gamble responsibly. Must be 21+ in most states.</p>
        </div>
      </div>
    </div>
  )
}
