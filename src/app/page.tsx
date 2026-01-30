import { getNBAScoreboard, getNFLScoreboard } from '@/lib/espn'
import GameCard from '@/components/GameCard'
import StatsCard from '@/components/StatsCard'
import Link from 'next/link'

export const revalidate = 60

export default async function Dashboard() {
  const [nbaGames, nflGames] = await Promise.all([
    getNBAScoreboard(),
    getNFLScoreboard(),
  ])

  const liveNBAGames = nbaGames.filter(g => g.status.type.state === 'in')
  const liveNFLGames = nflGames.filter(g => g.status.type.state === 'in')
  const totalLiveGames = liveNBAGames.length + liveNFLGames.length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Real-Time Sports Analytics
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Professional-grade sports data and visualizations for fantasy leagues and informed decisions
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <StatsCard
          title="Live Games"
          value={totalLiveGames}
          change={totalLiveGames > 0 ? 'Games in progress' : 'No live games'}
          changeType={totalLiveGames > 0 ? 'positive' : 'neutral'}
          icon={
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatsCard
          title="NBA Games Today"
          value={nbaGames.length}
          change="Basketball"
          changeType="neutral"
          icon={
            <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="NFL Games"
          value={nflGames.length}
          change="Football"
          changeType="neutral"
          icon={
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Data Source"
          value="ESPN"
          change="Real-time updates"
          changeType="positive"
          icon={
            <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* NBA Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <span className="text-orange-400 font-bold">NBA</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Basketball</h2>
            {liveNBAGames.length > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                {liveNBAGames.length} Live
              </span>
            )}
          </div>
          <Link
            href="/nba"
            className="text-sm text-gray-400 hover:text-primary transition-colors flex items-center space-x-1"
          >
            <span>View All</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {nbaGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nbaGames.slice(0, 6).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-gray-400">No NBA games scheduled today</p>
          </div>
        )}
      </section>

      {/* NFL Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400 font-bold">NFL</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Football</h2>
            {liveNFLGames.length > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                {liveNFLGames.length} Live
              </span>
            )}
          </div>
          <Link
            href="/nfl"
            className="text-sm text-gray-400 hover:text-primary transition-colors flex items-center space-x-1"
          >
            <span>View All</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {nflGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nflGames.slice(0, 6).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-gray-400">No NFL games scheduled today</p>
          </div>
        )}
      </section>

      {/* Premium CTA */}
      <section className="relative overflow-hidden rounded-2xl p-8 md:p-12 gradient-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Unlock Premium Analytics
            </h3>
            <p className="text-gray-400 max-w-md">
              Get access to live odds, AI-powered projections, custom alerts, and API access for your applications.
            </p>
          </div>
          <button className="px-8 py-4 bg-gradient-to-r from-primary to-secondary rounded-xl font-semibold hover:opacity-90 transition-opacity whitespace-nowrap">
            Coming Soon
          </button>
        </div>
      </section>
    </div>
  )
}
