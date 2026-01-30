import { getNBAOdds, getNFLOdds, formatOdds, formatSpread, OddsEvent, oddsToPercentage, getProbabilityColor, getProbabilityBarColor, POPULAR_BOOKMAKERS } from '@/lib/odds'

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

function OddsCard({ event }: { event: OddsEvent }) {
  const gameTime = new Date(event.commence_time)
  const isLive = gameTime <= new Date()

  // Get DraftKings odds first, fall back to first available bookmaker
  const bookmaker = event.bookmakers.find(b => b.key === 'draftkings') || event.bookmakers[0]

  if (!bookmaker) {
    return null
  }

  const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h')
  const spreadMarket = bookmaker.markets.find(m => m.key === 'spreads')
  const totalMarket = bookmaker.markets.find(m => m.key === 'totals')

  const homeH2h = h2hMarket?.outcomes.find(o => o.name === event.home_team)
  const awayH2h = h2hMarket?.outcomes.find(o => o.name === event.away_team)

  const homeSpread = spreadMarket?.outcomes.find(o => o.name === event.home_team)
  const awaySpread = spreadMarket?.outcomes.find(o => o.name === event.away_team)

  const over = totalMarket?.outcomes.find(o => o.name === 'Over')
  const under = totalMarket?.outcomes.find(o => o.name === 'Under')

  // Calculate win probabilities
  const awayPercentage = awayH2h ? oddsToPercentage(awayH2h.price) : 0
  const homePercentage = homeH2h ? oddsToPercentage(homeH2h.price) : 0

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 hover:bg-white/5 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {isLive ? (
            <span className="px-2 py-1 text-xs font-semibold bg-red-500/20 text-red-400 rounded-full animate-pulse">
              LIVE
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-semibold bg-blue-500/20 text-blue-400 rounded-full">
              {gameTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          )}
          <span className="text-xs text-gray-500">
            {gameTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
        <span className="text-xs text-gray-500">{bookmaker.title}</span>
      </div>

      {/* Main Matchup Display with Percentages */}
      <div className="mb-4">
        {/* Away Team */}
        <div className="flex items-center justify-between py-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm sm:text-base truncate">{event.away_team}</p>
            {awayH2h && (
              <p className="text-xs text-gray-500 mt-0.5">{formatOdds(awayH2h.price)}</p>
            )}
          </div>
          <div className="flex items-center space-x-3 ml-4">
            {awayH2h && (
              <span className={`text-xl sm:text-2xl font-bold ${getProbabilityColor(awayPercentage)}`}>
                {awayPercentage}%
              </span>
            )}
          </div>
        </div>

        {/* VS Probability Bar */}
        <div className="flex items-center gap-2 py-2">
          <div className="flex-1">
            <ProbabilityBar percentage={awayPercentage} reverse />
          </div>
          <span className="text-xs text-gray-500 font-medium px-2">VS</span>
          <div className="flex-1">
            <ProbabilityBar percentage={homePercentage} />
          </div>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between py-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm sm:text-base truncate">{event.home_team}</p>
            {homeH2h && (
              <p className="text-xs text-gray-500 mt-0.5">{formatOdds(homeH2h.price)}</p>
            )}
          </div>
          <div className="flex items-center space-x-3 ml-4">
            {homeH2h && (
              <span className={`text-xl sm:text-2xl font-bold ${getProbabilityColor(homePercentage)}`}>
                {homePercentage}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Spread and Total */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
        {/* Spread */}
        {awaySpread && homeSpread && (
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1.5">Spread</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-400 truncate">{event.away_team.split(' ').pop()}</span>
                <span className="font-mono text-white ml-2">{awaySpread.point! > 0 ? '+' : ''}{awaySpread.point}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-400 truncate">{event.home_team.split(' ').pop()}</span>
                <span className="font-mono text-white ml-2">{homeSpread.point! > 0 ? '+' : ''}{homeSpread.point}</span>
              </div>
            </div>
          </div>
        )}

        {/* Total */}
        {over && under && (
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1.5">Total</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-400">Over</span>
                <span className="font-mono text-white">{over.point}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-400">Under</span>
                <span className="font-mono text-white">{under.point}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BookmakerComparison({ events }: { events: OddsEvent[] }) {
  if (events.length === 0) return null

  const event = events[0]
  const bookmakers = event.bookmakers.slice(0, 5)

  return (
    <div className="glass-card rounded-xl p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Line Comparison: {event.away_team} @ {event.home_team}
      </h3>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[600px] px-4 sm:px-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 px-3 text-left text-gray-400 font-medium">Book</th>
                <th className="py-2 px-3 text-center text-gray-400 font-medium">
                  <span className="hidden sm:inline">{event.away_team}</span>
                  <span className="sm:hidden">{event.away_team.split(' ').pop()}</span>
                </th>
                <th className="py-2 px-3 text-center text-gray-400 font-medium">
                  <span className="hidden sm:inline">{event.home_team}</span>
                  <span className="sm:hidden">{event.home_team.split(' ').pop()}</span>
                </th>
                <th className="py-2 px-3 text-center text-gray-400 font-medium">Spread</th>
                <th className="py-2 px-3 text-center text-gray-400 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {bookmakers.map((bm) => {
                const h2h = bm.markets.find(m => m.key === 'h2h')
                const spread = bm.markets.find(m => m.key === 'spreads')
                const total = bm.markets.find(m => m.key === 'totals')

                const awayML = h2h?.outcomes.find(o => o.name === event.away_team)
                const homeML = h2h?.outcomes.find(o => o.name === event.home_team)
                const awaySpread = spread?.outcomes.find(o => o.name === event.away_team)
                const over = total?.outcomes.find(o => o.name === 'Over')

                const awayPct = awayML ? oddsToPercentage(awayML.price) : 0
                const homePct = homeML ? oddsToPercentage(homeML.price) : 0

                return (
                  <tr key={bm.key} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-3 text-white font-medium">{bm.title}</td>
                    <td className="py-3 px-3 text-center">
                      {awayML && (
                        <div>
                          <span className={`font-bold ${getProbabilityColor(awayPct)}`}>{awayPct}%</span>
                          <span className="text-gray-500 text-xs ml-1">({formatOdds(awayML.price)})</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {homeML && (
                        <div>
                          <span className={`font-bold ${getProbabilityColor(homePct)}`}>{homePct}%</span>
                          <span className="text-gray-500 text-xs ml-1">({formatOdds(homeML.price)})</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-white">
                      {awaySpread && `${awaySpread.point! > 0 ? '+' : ''}${awaySpread.point}`}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-white">
                      {over && over.point}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default async function OddsPage() {
  const [nbaOdds, nflOdds] = await Promise.all([
    getNBAOdds(),
    getNFLOdds()
  ])

  const hasOdds = nbaOdds.length > 0 || nflOdds.length > 0

  return (
    <div className="min-h-screen bg-dark-950 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Betting Odds</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Live odds with win probabilities from top sportsbooks
          </p>
        </div>

        {/* Legend */}
        {hasOdds && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-400 mb-3">Win Probability Key:</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-300">70%+ (Strong Favorite)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-gray-300">55-69% (Favorite)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-gray-300">45-54% (Toss-up)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs text-gray-300">30-44% (Underdog)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-300">&lt;30% (Long Shot)</span>
              </div>
            </div>
          </div>
        )}

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
            {/* Line Comparison for first game */}
            {nbaOdds.length > 0 && (
              <div className="mb-8">
                <BookmakerComparison events={nbaOdds} />
              </div>
            )}

            {/* NBA Section */}
            {nbaOdds.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <span className="text-orange-400 font-bold text-sm">NBA</span>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">NBA Odds</h2>
                    <p className="text-xs sm:text-sm text-gray-400">{nbaOdds.length} games available</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {nbaOdds.map((event) => (
                    <OddsCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* NFL Section */}
            {nflOdds.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 font-bold text-sm">NFL</span>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">NFL Odds</h2>
                    <p className="text-xs sm:text-sm text-gray-400">{nflOdds.length} games available</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {nflOdds.map((event) => (
                    <OddsCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Footer info */}
        <div className="mt-10 text-center text-xs sm:text-sm text-gray-500">
          <p>Odds provided by The Odds API. Lines update every 5 minutes.</p>
          <p className="mt-1">Always gamble responsibly. Must be 21+ in most states.</p>
        </div>
      </div>
    </div>
  )
}
