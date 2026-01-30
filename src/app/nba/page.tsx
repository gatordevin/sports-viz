import { getNBAScoreboard, getNBATeams } from '@/lib/espn'
import GameCard from '@/components/GameCard'
import TeamCard from '@/components/TeamCard'

export const revalidate = 60

export default async function NBAPage() {
  const [games, teams] = await Promise.all([
    getNBAScoreboard(),
    getNBATeams(),
  ])

  const liveGames = games.filter(g => g.status.type.state === 'in')
  const upcomingGames = games.filter(g => g.status.type.state === 'pre')
  const completedGames = games.filter(g => g.status.type.completed)

  // Sort teams alphabetically
  const sortedTeams = [...teams].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  )

  // Group teams by division/conference (simplified - Eastern vs Western)
  const easternTeams = sortedTeams.filter(t =>
    ['ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DET', 'IND', 'MIA', 'MIL', 'NYK', 'ORL', 'PHI', 'TOR', 'WAS'].includes(t.abbreviation)
  )
  const westernTeams = sortedTeams.filter(t =>
    !['ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DET', 'IND', 'MIA', 'MIL', 'NYK', 'ORL', 'PHI', 'TOR', 'WAS'].includes(t.abbreviation)
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-12 animate-fade-in">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <span className="text-orange-400 font-bold text-lg">NBA</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">NBA Basketball</h1>
            <p className="text-gray-400">National Basketball Association</p>
          </div>
        </div>
      </div>

      {/* Live Games Section */}
      {liveGames.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <span className="w-3 h-3 bg-red-500 rounded-full live-pulse" />
            <h2 className="text-xl font-bold text-white">Live Now</h2>
            <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
              {liveGames.length} Games
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Today's Games */}
      {games.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Today&apos;s Schedule</h2>

          {upcomingGames.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Upcoming</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}

          {completedGames.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">Completed</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {games.length === 0 && (
        <div className="glass rounded-xl p-12 text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Games Today</h3>
          <p className="text-gray-400">Check back tomorrow for NBA action</p>
        </div>
      )}

      {/* Teams Section */}
      <section>
        <h2 className="text-xl font-bold text-white mb-6">All Teams</h2>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full" />
            <span>Eastern Conference</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {easternTeams.map((team) => (
              <TeamCard key={team.id} team={team} sport="nba" />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center space-x-2">
            <span className="w-2 h-2 bg-red-400 rounded-full" />
            <span>Western Conference</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {westernTeams.map((team) => (
              <TeamCard key={team.id} team={team} sport="nba" />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
