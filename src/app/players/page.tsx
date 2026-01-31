'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BDLPlayer, BDLSeasonAverage } from '@/lib/balldontlie'
import { trackSearch, trackPlayerViewed } from '@/lib/analytics'

interface PlayerWithStats extends BDLPlayer {
  seasonAvg?: BDLSeasonAverage
}

function PlayerSearchCard({ player, seasonAvg }: { player: BDLPlayer; seasonAvg?: BDLSeasonAverage }) {
  const handlePlayerClick = () => {
    trackPlayerViewed(player.id.toString(), `${player.first_name} ${player.last_name}`)
  }

  return (
    <Link
      href={`/players/${player.id}`}
      onClick={handlePlayerClick}
      className="glass rounded-xl p-4 sm:p-5 hover:bg-white/[0.08] transition-all duration-300 block group cursor-pointer"
    >
      <div className="flex items-start space-x-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 relative flex-shrink-0 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-600">
            {player.first_name[0]}{player.last_name[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">
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

      {/* Season Stats - Show if available */}
      {seasonAvg ? (
        <div className="mt-4 grid grid-cols-5 gap-2">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">PPG</p>
            <p className="text-lg font-bold text-primary">{seasonAvg.pts.toFixed(1)}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">RPG</p>
            <p className="text-sm font-semibold text-white">{seasonAvg.reb.toFixed(1)}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">APG</p>
            <p className="text-sm font-semibold text-white">{seasonAvg.ast.toFixed(1)}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">FG%</p>
            <p className="text-sm font-semibold text-white">{(seasonAvg.fg_pct * 100).toFixed(1)}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">GP</p>
            <p className="text-sm font-semibold text-white">{seasonAvg.games_played}</p>
          </div>
        </div>
      ) : (
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
      )}

      {player.college && (
        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-white/10">
          College: {player.college}
        </p>
      )}

      {/* View More Indicator */}
      <div className="mt-3 flex items-center justify-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        <span>View Full Stats</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

function PlayersPageContent() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [players, setPlayers] = useState<BDLPlayer[]>([])
  const [seasonAverages, setSeasonAverages] = useState<Record<number, BDLSeasonAverage>>({})
  const [loading, setLoading] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialSearchDone, setInitialSearchDone] = useState(false)

  const searchPlayers = async (query: string) => {
    if (query.length < 2) {
      setPlayers([])
      setSeasonAverages({})
      return
    }

    setLoading(true)
    setError(null)

    try {
      // BallDontLie API works better with single words (first or last name)
      // If a full name is provided (contains space), try first name first, then last name
      const trimmedQuery = query.trim()
      const nameParts = trimmedQuery.split(/\s+/)

      let data: any = null

      // Try the full query first
      const res = await fetch(`https://api.balldontlie.io/v1/players?search=${encodeURIComponent(trimmedQuery)}&per_page=25`, {
        headers: {
          'Authorization': process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY || ''
        }
      })

      if (!res.ok) throw new Error('Failed to search players')
      data = await res.json()

      // If no results and query has multiple words, try searching by first name first (often more unique)
      if (data.data.length === 0 && nameParts.length > 1) {
        const firstName = nameParts[0]
        const lastName = nameParts[nameParts.length - 1].toLowerCase()

        // Try first name search first
        const firstNameRes = await fetch(`https://api.balldontlie.io/v1/players?search=${encodeURIComponent(firstName)}&per_page=25`, {
          headers: {
            'Authorization': process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY || ''
          }
        })

        if (firstNameRes.ok) {
          const firstNameData = await firstNameRes.json()
          // Filter results to match the last name too
          const filtered = firstNameData.data.filter((p: BDLPlayer) =>
            p.last_name.toLowerCase().includes(lastName) ||
            lastName.includes(p.last_name.toLowerCase())
          )

          if (filtered.length > 0) {
            data.data = filtered
          } else if (firstNameData.data.length > 0) {
            // Show first name results if no exact match
            data = firstNameData
          }
        }

        // If still no results, try last name search
        if (data.data.length === 0) {
          const lastNameRes = await fetch(`https://api.balldontlie.io/v1/players?search=${encodeURIComponent(nameParts[nameParts.length - 1])}&per_page=25`, {
            headers: {
              'Authorization': process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY || ''
            }
          })
          if (lastNameRes.ok) {
            const lastNameData = await lastNameRes.json()
            const firstNameLower = firstName.toLowerCase()
            const filtered = lastNameData.data.filter((p: BDLPlayer) =>
              p.first_name.toLowerCase().includes(firstNameLower) ||
              firstNameLower.includes(p.first_name.toLowerCase())
            )
            if (filtered.length > 0) {
              data.data = filtered
            } else {
              data = lastNameData
            }
          }
        }
      }

      setPlayers(data.data)

      // Track search with result count
      trackSearch(trimmedQuery, data.data.length)

      // Fetch season averages for found players
      if (data.data.length > 0) {
        fetchSeasonAverages(data.data.map((p: BDLPlayer) => p.id))
      }
    } catch (err) {
      setError('Failed to search players. Please try again.')
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSeasonAverages = async (playerIds: number[]) => {
    if (playerIds.length === 0) return

    setLoadingStats(true)

    try {
      // Fetch each player's season averages in parallel (API requires single player_id)
      const fetchPromises = playerIds.map(async (playerId) => {
        try {
          const res = await fetch(`https://api.balldontlie.io/v1/season_averages?season=2024&player_id=${playerId}`, {
            headers: {
              'Authorization': process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY || ''
            }
          })
          if (!res.ok) return null
          const data = await res.json()
          return data.data?.[0] || null
        } catch {
          return null
        }
      })

      const results = await Promise.all(fetchPromises)
      const avgMap: Record<number, BDLSeasonAverage> = {}
      results.forEach((avg: BDLSeasonAverage | null) => {
        if (avg) {
          avgMap[avg.player_id] = avg
        }
      })
      setSeasonAverages(avgMap)
    } catch (err) {
      console.error('Failed to fetch season averages:', err)
    } finally {
      setLoadingStats(false)
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
          {(loading || loadingStats) && (
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
            {loadingStats && <span className="text-primary ml-2">Loading stats...</span>}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player) => (
              <PlayerSearchCard
                key={player.id}
                player={player}
                seasonAvg={seasonAverages[player.id]}
              />
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

// Loading fallback for Suspense
function PlayersPageLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-8 animate-pulse">
        <div className="h-10 bg-white/10 rounded w-48 mb-4"></div>
        <div className="h-4 bg-white/5 rounded w-64"></div>
      </div>
      <div className="h-12 bg-white/5 rounded-xl mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass rounded-xl p-5 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/10 rounded-full"></div>
              <div className="flex-1">
                <div className="h-5 bg-white/10 rounded w-32 mb-2"></div>
                <div className="h-4 bg-white/5 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Default export wraps content in Suspense for useSearchParams
export default function PlayersPage() {
  return (
    <Suspense fallback={<PlayersPageLoading />}>
      <PlayersPageContent />
    </Suspense>
  )
}
