import { getNFLScoreboard, getNFLTeams, getNews } from '@/lib/espn'
import GameCard from '@/components/GameCard'
import TeamCard from '@/components/TeamCard'
import { NewsList } from '@/components/NewsCard'

export const revalidate = 60

export default async function NFLPage() {
  const [games, teams, news] = await Promise.all([
    getNFLScoreboard(),
    getNFLTeams(),
    getNews('nfl', 5)
  ])

  const liveGames = games.filter(g => g.status.type.state === 'in')
  const upcomingGames = games.filter(g => g.status.type.state === 'pre')
  const completedGames = games.filter(g => g.status.type.completed)

  // Sort teams alphabetically
  const sortedTeams = [...teams].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  )

  // Group teams by conference
  const afcTeams = sortedTeams.filter(t =>
    ['BAL', 'BUF', 'CIN', 'CLE', 'DEN', 'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'MIA', 'NE', 'NYJ', 'PIT', 'TEN'].includes(t.abbreviation)
  )
  const nfcTeams = sortedTeams.filter(t =>
    ['ARI', 'ATL', 'CAR', 'CHI', 'DAL', 'DET', 'GB', 'LAR', 'MIN', 'NO', 'NYG', 'PHI', 'SF', 'SEA', 'TB', 'WSH'].includes(t.abbreviation)
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8 sm:mb-12 animate-fade-in">
        <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-green-400 font-bold text-sm sm:text-lg">NFL</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white truncate">NFL Football</h1>
            <p className="text-gray-400 text-sm sm:text-base">National Football League</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Content - Games */}
        <div className="lg:col-span-2">
          {/* Live Games Section */}
          {liveGames.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <span className="w-3 h-3 bg-red-500 rounded-full live-pulse" />
                <h2 className="text-lg sm:text-xl font-bold text-white">Live Now</h2>
                <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                  {liveGames.length} Games
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {liveGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </section>
          )}

          {/* This Week's Games */}
          {games.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">This Week&apos;s Games</h2>

              {upcomingGames.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-3 sm:mb-4">Upcoming</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {upcomingGames.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                </div>
              )}

              {completedGames.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-3 sm:mb-4">Completed</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {completedGames.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {games.length === 0 && (
            <div className="glass rounded-xl p-8 sm:p-12 text-center mb-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">No Games Scheduled</h3>
              <p className="text-gray-400 text-sm sm:text-base">Check back on game day for NFL action</p>
            </div>
          )}
        </div>

        {/* Sidebar - News */}
        <div className="lg:col-span-1">
          {news.length > 0 && (
            <NewsList articles={news} title="Latest News" />
          )}
        </div>
      </div>

      {/* Teams Section */}
      <section>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">All Teams</h2>

        <div className="mb-6 sm:mb-8">
          <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-3 sm:mb-4 flex items-center space-x-2">
            <span className="w-2 h-2 bg-red-400 rounded-full" />
            <span>AFC ({afcTeams.length} teams)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {afcTeams.map((team) => (
              <TeamCard key={team.id} team={team} sport="nfl" />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-3 sm:mb-4 flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full" />
            <span>NFC ({nfcTeams.length} teams)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {nfcTeams.map((team) => (
              <TeamCard key={team.id} team={team} sport="nfl" />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
