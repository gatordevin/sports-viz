import Link from 'next/link'
import { getPlayer, getSeasonAverages, getPlayerStats, bdlToEspnTeamId, getTeamAbbr, BDLPlayer, BDLSeasonAverage, BDLPlayerStats } from '@/lib/balldontlie'
import { getPlayerHeadshotURL } from '@/lib/playerHeadshots'
import PlayerHeadshot from '@/components/PlayerHeadshot'

export const revalidate = 1800 // Revalidate every 30 minutes

// Format stat with one decimal place
function formatStat(value: number | undefined): string {
  if (value === undefined || value === null) return '-'
  return value.toFixed(1)
}

// Get percentage color
function getPercentageColor(pct: number): string {
  if (pct >= 0.5) return 'text-green-400'
  if (pct >= 0.4) return 'text-yellow-400'
  return 'text-red-400'
}

// Stat card component
function StatCard({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-4 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
    </div>
  )
}

// Game log row component
function GameLogRow({ stat }: { stat: BDLPlayerStats }) {
  const gameDate = new Date(stat.game.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })

  // Determine opponent using team IDs (stats API uses home_team_id/visitor_team_id)
  const isHome = stat.game.home_team_id === stat.team.id
  const opponentId = isHome ? stat.game.visitor_team_id : stat.game.home_team_id
  const opponentAbbr = getTeamAbbr(opponentId)

  const teamScore = isHome ? stat.game.home_team_score : stat.game.visitor_team_score
  const oppScore = isHome ? stat.game.visitor_team_score : stat.game.home_team_score
  const won = teamScore > oppScore

  return (
    <tr className="border-b border-white/5 hover:bg-white/5">
      <td className="py-3 px-2 text-sm text-gray-400">{gameDate}</td>
      <td className="py-3 px-2 text-sm">
        <span className="text-gray-500">{isHome ? 'vs' : '@'}</span>{' '}
        <span className="text-white">{opponentAbbr}</span>
      </td>
      <td className="py-3 px-2 text-sm">
        <span className={won ? 'text-green-400' : 'text-red-400'}>
          {won ? 'W' : 'L'} {teamScore}-{oppScore}
        </span>
      </td>
      <td className="py-3 px-2 text-sm text-gray-300">{stat.min}</td>
      <td className="py-3 px-2 text-sm font-semibold text-white">{stat.pts}</td>
      <td className="py-3 px-2 text-sm text-gray-300">{stat.reb}</td>
      <td className="py-3 px-2 text-sm text-gray-300">{stat.ast}</td>
      <td className="py-3 px-2 text-sm text-gray-300">{stat.stl}</td>
      <td className="py-3 px-2 text-sm text-gray-300">{stat.blk}</td>
      <td className="py-3 px-2 text-sm text-gray-300">
        {stat.fgm}/{stat.fga}
      </td>
      <td className="py-3 px-2 text-sm text-gray-300">
        {stat.fg3m}/{stat.fg3a}
      </td>
    </tr>
  )
}

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const playerId = parseInt(resolvedParams.id)

  if (isNaN(playerId)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Invalid Player ID</h2>
          <p className="text-gray-400">Please provide a valid player ID.</p>
          <Link href="/players" className="mt-4 inline-block text-primary hover:underline">
            Search for Players
          </Link>
        </div>
      </div>
    )
  }

  // Fetch player data and stats with error handling
  const currentSeason = 2024 // NBA season
  let player: BDLPlayer | null = null
  let seasonAverages: BDLSeasonAverage[] = []
  let recentStats: BDLPlayerStats[] = []
  let headshotUrl: string | null = null

  try {
    // Fetch all data in parallel, but handle errors gracefully
    const [playerResult, seasonResult, statsResult] = await Promise.allSettled([
      getPlayer(playerId),
      getSeasonAverages(currentSeason, [playerId]),
      getPlayerStats(undefined, [playerId], undefined, 10, currentSeason) // Last 10 games of current season
    ])

    if (playerResult.status === 'fulfilled') {
      player = playerResult.value
    }
    if (seasonResult.status === 'fulfilled') {
      seasonAverages = seasonResult.value
    }
    if (statsResult.status === 'fulfilled') {
      recentStats = statsResult.value
    }

    // Fetch headshot URL if we have the player
    if (player) {
      headshotUrl = await getPlayerHeadshotURL(playerId, player.first_name, player.last_name)
    }
  } catch (error) {
    console.error('Error fetching player data:', error)
  }

  if (!player) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Player Not Found</h2>
          <p className="text-gray-400">Unable to load player information.</p>
          <Link href="/players" className="mt-4 inline-block text-primary hover:underline">
            Search for Players
          </Link>
        </div>
      </div>
    )
  }

  const seasonAvg = seasonAverages[0] as BDLSeasonAverage | undefined
  const sortedRecentStats = [...recentStats].sort((a, b) =>
    new Date(b.game.date).getTime() - new Date(a.game.date).getTime()
  )

  // Get ESPN team ID for team roster link
  const espnTeamId = bdlToEspnTeamId(player.team.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Player Header */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-8 animate-fade-in">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Player Photo */}
          <PlayerHeadshot
            src={headshotUrl}
            firstName={player.first_name}
            lastName={player.last_name}
            size="large"
          />

          {/* Player Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2 sm:gap-4 mb-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                {player.first_name} {player.last_name}
              </h1>
              {player.jersey_number && (
                <span className="text-2xl font-bold text-primary">#{player.jersey_number}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
              <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
                {player.position || 'N/A'}
              </span>
              <Link
                href={`/nba/team/${espnTeamId || player.team.id}`}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {player.team.full_name}
              </Link>
            </div>

            {/* Physical Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Height</p>
                <p className="text-lg font-bold text-white">{player.height || 'N/A'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Weight</p>
                <p className="text-lg font-bold text-white">{player.weight ? `${player.weight} lbs` : 'N/A'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Draft</p>
                <p className="text-lg font-bold text-white">
                  {player.draft_year ? `${player.draft_year} R${player.draft_round}` : 'N/A'}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Country</p>
                <p className="text-lg font-bold text-white truncate">{player.country || 'N/A'}</p>
              </div>
            </div>

            {player.college && (
              <p className="text-sm text-gray-400 mt-4">
                College: <span className="text-gray-300">{player.college}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Season Averages */}
      {seasonAvg && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>2024-25 Season Averages</span>
            {seasonAvg.games_played && (
              <span className="text-sm font-normal text-gray-400">({seasonAvg.games_played} games)</span>
            )}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
            <StatCard label="PPG" value={formatStat(seasonAvg.pts)} />
            <StatCard label="RPG" value={formatStat(seasonAvg.reb)} />
            <StatCard label="APG" value={formatStat(seasonAvg.ast)} />
            <StatCard label="SPG" value={formatStat(seasonAvg.stl)} />
            <StatCard label="BPG" value={formatStat(seasonAvg.blk)} />
            <StatCard
              label="FG%"
              value={formatStat(seasonAvg.fg_pct * 100) + '%'}
              subValue={`${formatStat(seasonAvg.fgm)}-${formatStat(seasonAvg.fga)}`}
            />
            <StatCard
              label="3P%"
              value={formatStat(seasonAvg.fg3_pct * 100) + '%'}
              subValue={`${formatStat(seasonAvg.fg3m)}-${formatStat(seasonAvg.fg3a)}`}
            />
            <StatCard
              label="FT%"
              value={formatStat(seasonAvg.ft_pct * 100) + '%'}
              subValue={`${formatStat(seasonAvg.ftm)}-${formatStat(seasonAvg.fta)}`}
            />
            <StatCard label="MPG" value={seasonAvg.min || '-'} />
            <StatCard label="TOV" value={formatStat(seasonAvg.turnover)} />
          </div>
        </section>
      )}

      {/* No stats message */}
      {!seasonAvg && (
        <div className="glass rounded-xl p-6 mb-8 text-center">
          <p className="text-gray-400">No season statistics available for 2024-25 season.</p>
        </div>
      )}

      {/* Recent Games */}
      {sortedRecentStats.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Recent Games</span>
          </h2>

          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-white/5 text-left text-xs text-gray-400 uppercase">
                    <th className="py-3 px-2 font-medium">Date</th>
                    <th className="py-3 px-2 font-medium">Opp</th>
                    <th className="py-3 px-2 font-medium">Result</th>
                    <th className="py-3 px-2 font-medium">MIN</th>
                    <th className="py-3 px-2 font-medium">PTS</th>
                    <th className="py-3 px-2 font-medium">REB</th>
                    <th className="py-3 px-2 font-medium">AST</th>
                    <th className="py-3 px-2 font-medium">STL</th>
                    <th className="py-3 px-2 font-medium">BLK</th>
                    <th className="py-3 px-2 font-medium">FG</th>
                    <th className="py-3 px-2 font-medium">3PT</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecentStats.map((stat) => (
                    <GameLogRow key={stat.id} stat={stat} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Back Links */}
      <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-4">
        <Link
          href="/players"
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search Players</span>
        </Link>
        <Link
          href={`/nba/team/${espnTeamId || player.team.id}`}
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{player.team.full_name} Roster</span>
        </Link>
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

      {/* Data Source */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>Player data provided by BallDontLie API</p>
      </div>
    </div>
  )
}
