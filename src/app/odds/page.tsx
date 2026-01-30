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
import BettingCard from '@/components/BettingCard'
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
}

// Fetch enriched data for a team
async function getEnrichedTeamData(
  sport: 'nba' | 'nfl',
  teamName: string
): Promise<EnrichedTeamData | null> {
  const teamId = findTeamIdByName(sport, teamName)
  if (!teamId) return null

  try {
    const [stats, injuries, recentGames] = await Promise.all([
      getTeamBettingStats(sport, teamId),
      getTeamInjuries(sport, teamId),
      getTeamRecentGames(sport, teamId, 10)
    ])

    if (!stats) return null

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
      injuries
    }
  } catch (error) {
    console.error(`Error enriching team data for ${teamName}:`, error)
    return null
  }
}

// Enrich events with team data
async function enrichEvents(events: OddsEvent[], sport: 'nba' | 'nfl'): Promise<EnrichedEvent[]> {
  const enrichedEvents = await Promise.all(
    events.map(async (event) => {
      const [homeTeamData, awayTeamData] = await Promise.all([
        getEnrichedTeamData(sport, event.home_team),
        getEnrichedTeamData(sport, event.away_team)
      ])

      let h2h = null
      if (homeTeamData && awayTeamData) {
        h2h = await getHeadToHead(sport, awayTeamData.id, homeTeamData.id)
      }

      return {
        event,
        homeTeamData,
        awayTeamData,
        h2h,
        sport
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

      {/* Injury indicator */}
      {((awayTeamData?.injuries.length || 0) > 0 || (homeTeamData?.injuries.length || 0) > 0) && (
        <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] text-gray-500">
          <svg className="w-3 h-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {(awayTeamData?.injuries.length || 0) + (homeTeamData?.injuries.length || 0)} injuries reported
        </div>
      )}
    </div>
  )
}

// Sport filter tabs component
function SportTabs({ active, onChange }: { active: 'all' | 'nba' | 'nfl'; onChange: (sport: 'all' | 'nba' | 'nfl') => void }) {
  return (
    <div className="flex gap-2">
      {(['all', 'nba', 'nfl'] as const).map((sport) => (
        <button
          key={sport}
          onClick={() => onChange(sport)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            active === sport
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {sport === 'all' ? 'All Sports' : sport.toUpperCase()}
        </button>
      ))}
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

// Quick stats summary
function QuickStats({ nbaCount, nflCount, totalInjuries }: { nbaCount: number; nflCount: number; totalInjuries: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
    </div>
  )
}

export default async function BettingDashboard() {
  // Fetch odds for both sports
  const [nbaOdds, nflOdds] = await Promise.all([
    getNBAOdds(),
    getNFLOdds()
  ])

  // Enrich with team data (injuries, stats, form)
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
            Complete betting analysis with odds, injuries, form, and key stats
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
              />
            </div>

            {/* Legend */}
            <div className="mb-6">
              <ProbabilityLegend />
            </div>

            {/* Today's Games - Full Cards */}
            {todayEvents.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-xl font-bold text-white">Today&apos;s Games</h2>
                  <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
                    {todayEvents.length} games
                  </span>
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
          <p className="mt-1">Always gamble responsibly. Must be 21+ in most states.</p>
        </div>
      </div>
    </div>
  )
}
