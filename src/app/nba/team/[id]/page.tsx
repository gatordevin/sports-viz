import Image from 'next/image'
import Link from 'next/link'
import { getTeamDetailedInfo, getNBAScoreboard } from '@/lib/espn'
import { getActivePlayersByESPNTeam, BDLPlayer } from '@/lib/balldontlie'
import BDLPlayerCard from '@/components/BDLPlayerCard'
import GameCard from '@/components/GameCard'

export const revalidate = 3600

export default async function NBATeamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const teamId = resolvedParams.id

  const [teamInfo, roster, games] = await Promise.all([
    getTeamDetailedInfo('nba', teamId),
    getActivePlayersByESPNTeam(teamId),
    getNBAScoreboard()
  ])

  if (!teamInfo) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Team Not Found</h2>
          <p className="text-gray-400">Unable to load team information.</p>
          <Link href="/nba" className="mt-4 inline-block text-primary hover:underline">
            Back to NBA
          </Link>
        </div>
      </div>
    )
  }

  // Filter games for this team
  const teamGames = games.filter(
    g => g.homeTeam.id === teamId || g.awayTeam.id === teamId
  )

  // Helper function to check if position contains a value
  const hasPosition = (player: BDLPlayer, positions: string[]) => {
    const pos = player.position?.toUpperCase() || ''
    return positions.some(p => pos.includes(p))
  }

  // Group players by position (BDL positions: G, F, C, F-G, G-F, etc.)
  const guards = roster.filter(p => hasPosition(p, ['G']) && !hasPosition(p, ['F']))
  const forwards = roster.filter(p => hasPosition(p, ['F']) && !hasPosition(p, ['G']))
  const centers = roster.filter(p => hasPosition(p, ['C']) && !hasPosition(p, ['G', 'F']))
  const hybrid = roster.filter(p =>
    (hasPosition(p, ['G']) && hasPosition(p, ['F'])) ||
    (hasPosition(p, ['F']) && hasPosition(p, ['C']))
  )
  const other = roster.filter(p => !p.position)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Team Header */}
      <div
        className="glass rounded-2xl p-6 sm:p-8 mb-8 animate-fade-in"
        style={{
          background: `linear-gradient(135deg, #${teamInfo.color}30, transparent)`
        }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 relative flex-shrink-0">
            {teamInfo.logo && (
              <Image
                src={teamInfo.logo}
                alt={teamInfo.displayName}
                fill
                className="object-contain"
              />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">{teamInfo.displayName}</h1>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm font-medium rounded-full">
                NBA
              </span>
            </div>
            <p className="text-gray-400 mb-4">{teamInfo.standing}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Record</p>
                <p className="text-lg font-bold text-white">{teamInfo.record || 'N/A'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Venue</p>
                <p className="text-sm font-medium text-white truncate">{teamInfo.venue || 'N/A'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Capacity</p>
                <p className="text-lg font-bold text-white">
                  {teamInfo.venueCapacity ? teamInfo.venueCapacity.toLocaleString() : 'N/A'}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Players</p>
                <p className="text-lg font-bold text-white">{roster.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Game (if any) */}
      {teamGames.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Today&apos;s Game</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Roster Section */}
      <section>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Roster ({roster.length} Players)</span>
        </h2>

        {/* Guards */}
        {guards.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full" />
              <span>Guards ({guards.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {guards.map(player => (
                <BDLPlayerCard key={player.id} player={player} />
              ))}
            </div>
          </div>
        )}

        {/* Forwards */}
        {forwards.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Forwards ({forwards.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {forwards.map(player => (
                <BDLPlayerCard key={player.id} player={player} />
              ))}
            </div>
          </div>
        )}

        {/* Centers */}
        {centers.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-400 rounded-full" />
              <span>Centers ({centers.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {centers.map(player => (
                <BDLPlayerCard key={player.id} player={player} />
              ))}
            </div>
          </div>
        )}

        {/* Hybrid positions (G-F, F-C) */}
        {hybrid.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center space-x-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full" />
              <span>Wings/Versatile ({hybrid.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hybrid.map(player => (
                <BDLPlayerCard key={player.id} player={player} />
              ))}
            </div>
          </div>
        )}

        {/* Other positions */}
        {other.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center space-x-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full" />
              <span>Other ({other.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {other.map(player => (
                <BDLPlayerCard key={player.id} player={player} />
              ))}
            </div>
          </div>
        )}

        {roster.length === 0 && (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-gray-400">No roster information available</p>
          </div>
        )}
      </section>

      {/* Back Link */}
      <div className="mt-8 pt-8 border-t border-white/10">
        <Link
          href="/nba"
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to NBA</span>
        </Link>
      </div>
    </div>
  )
}
