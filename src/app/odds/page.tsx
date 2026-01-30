import { getNBAOdds, getNFLOdds, formatOdds, formatSpread, OddsEvent, POPULAR_BOOKMAKERS } from '@/lib/odds'

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

  return (
    <div className="glass-card rounded-xl p-4 hover:bg-white/5 transition-all duration-300">
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

      {/* Teams */}
      <div className="space-y-3">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-white">{event.away_team}</span>
          <div className="flex items-center space-x-4 text-sm">
            {awaySpread && (
              <span className={`font-mono ${awaySpread.price > 0 ? 'text-green-400' : 'text-white'}`}>
                {formatSpread(awaySpread.point, awaySpread.price)}
              </span>
            )}
            {awayH2h && (
              <span className={`font-mono w-16 text-right ${awayH2h.price > 0 ? 'text-green-400' : 'text-white'}`}>
                {formatOdds(awayH2h.price)}
              </span>
            )}
          </div>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-white">{event.home_team}</span>
          <div className="flex items-center space-x-4 text-sm">
            {homeSpread && (
              <span className={`font-mono ${homeSpread.price > 0 ? 'text-green-400' : 'text-white'}`}>
                {formatSpread(homeSpread.point, homeSpread.price)}
              </span>
            )}
            {homeH2h && (
              <span className={`font-mono w-16 text-right ${homeH2h.price > 0 ? 'text-green-400' : 'text-white'}`}>
                {formatOdds(homeH2h.price)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Total */}
      {over && under && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Total</span>
            <div className="flex items-center space-x-4 font-mono">
              <span className="text-white">
                O {over.point} <span className="text-gray-400">({formatOdds(over.price)})</span>
              </span>
              <span className="text-white">
                U {under.point} <span className="text-gray-400">({formatOdds(under.price)})</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BookmakerComparison({ events }: { events: OddsEvent[] }) {
  if (events.length === 0) return null

  const event = events[0]
  const bookmakers = event.bookmakers.slice(0, 5)

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Line Comparison: {event.away_team} @ {event.home_team}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 px-3 text-left text-gray-400 font-medium">Book</th>
              <th className="py-2 px-3 text-center text-gray-400 font-medium">{event.away_team}</th>
              <th className="py-2 px-3 text-center text-gray-400 font-medium">{event.home_team}</th>
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

              return (
                <tr key={bm.key} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-3 text-white font-medium">{bm.title}</td>
                  <td className="py-3 px-3 text-center font-mono">
                    {awayML && (
                      <span className={awayML.price > 0 ? 'text-green-400' : 'text-white'}>
                        {formatOdds(awayML.price)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    {homeML && (
                      <span className={homeML.price > 0 ? 'text-green-400' : 'text-white'}>
                        {formatOdds(homeML.price)}
                      </span>
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
          <h1 className="text-3xl font-bold text-white mb-2">Betting Odds</h1>
          <p className="text-gray-400">
            Live odds from top sportsbooks including DraftKings, FanDuel, BetMGM, and more
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
                    <h2 className="text-xl font-bold text-white">NBA Odds</h2>
                    <p className="text-sm text-gray-400">{nbaOdds.length} games available</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <h2 className="text-xl font-bold text-white">NFL Odds</h2>
                    <p className="text-sm text-gray-400">{nflOdds.length} games available</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nflOdds.map((event) => (
                    <OddsCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Footer info */}
        <div className="mt-10 text-center text-sm text-gray-500">
          <p>Odds provided by The Odds API. Lines update every 5 minutes.</p>
          <p className="mt-1">Always gamble responsibly. Must be 21+ in most states.</p>
        </div>
      </div>
    </div>
  )
}
