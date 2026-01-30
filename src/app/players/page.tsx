'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { BDLPlayer, BDLTeam } from '@/lib/balldontlie'

function PlayerSearchCard({ player }: { player: BDLPlayer }) {
  return (
    <div className="glass rounded-xl p-4 sm:p-5 hover:bg-white/[0.08] transition-all duration-300">
      <div className="flex items-start space-x-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 relative flex-shrink-0 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-600">
            {player.first_name[0]}{player.last_name[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <h3 className="font-bold text-lg text-white">
              {player.first_name} {player.last_name}
            </h3>
            {player.jersey_number && (
              <span className="px-2 py-0.5 bg-white/10 rounded text-sm text-gray-300">
                #{player.jersey_number}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-gray-400">{player.position || 'N/A'}</span>
            <span className="text-gray-600">|</span>
            <span className="text-sm text-primary">{player.team.full_name}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Height</p>
          <p className="text-sm font-semibold text-white">{player.height || 'N/A'}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Weight</p>
          <p className="text-sm font-semibold text-white">{player.weight ? `${player.weight} lbs` : 'N/A'}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Draft</p>
          <p className="text-sm font-semibold text-white">
            {player.draft_year ? `${player.draft_year}` : 'N/A'}
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Country</p>
          <p className="text-sm font-semibold text-white truncate">{player.country || 'N/A'}</p>
        </div>
      </div>

      {player.college && (
        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-white/10">
          College: {player.college}
        </p>
      )}
    </div>
  )
}

export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [players, setPlayers] = useState<BDLPlayer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchPlayers = async (query: string) => {
    if (query.length < 2) {
      setPlayers([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`https://api.balldontlie.io/v1/players?search=${encodeURIComponent(query)}&per_page=25`, {
        headers: {
          'Authorization': 'REDACTED_BDL_KEY_OLD'
        }
      })

      if (!res.ok) throw new Error('Failed to search players')

      const data = await res.json()
      setPlayers(data.data)
    } catch (err) {
      setError('Failed to search players. Please try again.')
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlayers(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white truncate">NBA Players</h1>
            <p className="text-gray-400 text-sm sm:text-base">Search and explore NBA player stats</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a player (e.g., LeBron, Curry, Durant)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg className="animate-spin w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>
        {searchQuery.length > 0 && searchQuery.length < 2 && (
          <p className="text-sm text-gray-500 mt-2">Type at least 2 characters to search</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {players.length > 0 ? (
        <div>
          <p className="text-sm text-gray-400 mb-4">
            Found {players.length} player{players.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player) => (
              <PlayerSearchCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      ) : searchQuery.length >= 2 && !loading ? (
        <div className="glass rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Players Found</h3>
          <p className="text-gray-400">Try a different search term</p>
        </div>
      ) : !searchQuery && (
        <div className="glass rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Search for NBA Players</h3>
          <p className="text-gray-400 mb-6">Enter a player name to view their information and stats</p>

          <div className="flex flex-wrap justify-center gap-2">
            {['LeBron James', 'Stephen Curry', 'Kevin Durant', 'Giannis', 'Luka Doncic'].map((name) => (
              <button
                key={name}
                onClick={() => setSearchQuery(name.split(' ')[0])}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Data Source */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>Player data provided by BallDontLie API</p>
      </div>
    </div>
  )
}
