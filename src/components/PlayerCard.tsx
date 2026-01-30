'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ESPNPlayer } from '@/lib/espn'

interface PlayerCardProps {
  player: ESPNPlayer
  teamId?: string
  sport?: 'nba' | 'nfl'
  compact?: boolean
  bdlPlayerId?: number // BallDontLie player ID for linking
  stats?: {
    ppg?: number
    rpg?: number
    apg?: number
    // NFL stats
    passingYards?: number
    passingTDs?: number
    rushingYards?: number
    rushingTDs?: number
    receptions?: number
    receivingYards?: number
    receivingTDs?: number
    tackles?: number
    sacks?: number
    interceptions?: number
  }
}

// Helper to create search URL for a player
function getPlayerSearchUrl(espnPlayer: ESPNPlayer): string {
  // Link to player search with the player's name pre-filled
  const searchName = encodeURIComponent(espnPlayer.displayName)
  return `/players?search=${searchName}`
}

export default function PlayerCard({ player, teamId, sport = 'nba', compact = false, bdlPlayerId, stats }: PlayerCardProps) {
  // Determine if we can link to player detail page
  // If we have a BDL ID, link directly. Otherwise, link to search with player name
  const directLink = bdlPlayerId ? `/players/${bdlPlayerId}` : null
  const searchLink = getPlayerSearchUrl(player)
  const playerLink = directLink || searchLink
  // NBA players can always link (to search or direct), NFL players go to search
  const canLink = sport === 'nba'

  const cardContent = (
    <>
      {/* Player Header */}
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex-shrink-0 rounded-full overflow-hidden bg-gray-800">
          {player.headshot ? (
            <Image
              src={player.headshot}
              alt={player.displayName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className={`font-bold text-lg truncate ${canLink ? 'text-white group-hover:text-primary transition-colors' : 'text-white'}`}>
              {player.displayName}
            </h3>
            {player.jersey && (
              <span className="px-2 py-0.5 bg-white/10 rounded text-sm text-gray-300">#{player.jersey}</span>
            )}
          </div>
          <p className="text-sm text-gray-400">{player.position}</p>
          {player.status && player.status !== 'Active' && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
              {player.status}
            </span>
          )}
        </div>
      </div>

      {/* Stats Display - Different for NBA vs NFL */}
      {sport === 'nba' && stats && (stats.ppg !== undefined || stats.rpg !== undefined || stats.apg !== undefined) ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">PPG</p>
            <p className="text-lg font-bold text-primary">{stats.ppg?.toFixed(1) ?? '-'}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">RPG</p>
            <p className="text-lg font-bold text-white">{stats.rpg?.toFixed(1) ?? '-'}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">APG</p>
            <p className="text-lg font-bold text-white">{stats.apg?.toFixed(1) ?? '-'}</p>
          </div>
        </div>
      ) : sport === 'nfl' && stats ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {/* Show relevant NFL stats based on position */}
          {(stats.passingYards !== undefined || stats.passingTDs !== undefined) && (
            <>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Pass YDS</p>
                <p className="text-lg font-bold text-primary">{stats.passingYards ?? '-'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Pass TD</p>
                <p className="text-lg font-bold text-white">{stats.passingTDs ?? '-'}</p>
              </div>
            </>
          )}
          {(stats.rushingYards !== undefined || stats.rushingTDs !== undefined) && (
            <>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Rush YDS</p>
                <p className="text-lg font-bold text-primary">{stats.rushingYards ?? '-'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Rush TD</p>
                <p className="text-lg font-bold text-white">{stats.rushingTDs ?? '-'}</p>
              </div>
            </>
          )}
          {(stats.receivingYards !== undefined || stats.receptions !== undefined) && (
            <>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">REC</p>
                <p className="text-lg font-bold text-white">{stats.receptions ?? '-'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">REC YDS</p>
                <p className="text-lg font-bold text-primary">{stats.receivingYards ?? '-'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">REC TD</p>
                <p className="text-lg font-bold text-white">{stats.receivingTDs ?? '-'}</p>
              </div>
            </>
          )}
          {(stats.tackles !== undefined || stats.sacks !== undefined || stats.interceptions !== undefined) && (
            <>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">TKL</p>
                <p className="text-lg font-bold text-white">{stats.tackles ?? '-'}</p>
              </div>
              {stats.sacks !== undefined && (
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">SACK</p>
                  <p className="text-lg font-bold text-primary">{stats.sacks ?? '-'}</p>
                </div>
              )}
              {stats.interceptions !== undefined && (
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">INT</p>
                  <p className="text-lg font-bold text-primary">{stats.interceptions ?? '-'}</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Default physical stats */
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Height</p>
            <p className="text-sm font-semibold text-white">{player.height || 'N/A'}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Weight</p>
            <p className="text-sm font-semibold text-white">{player.weight || 'N/A'}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Age</p>
            <p className="text-sm font-semibold text-white">{player.age || 'N/A'}</p>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
        {player.college && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">College</span>
            <span className="text-gray-300">{player.college}</span>
          </div>
        )}
        {player.experience !== undefined && player.experience > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Experience</span>
            <span className="text-gray-300">{player.experience} {player.experience === 1 ? 'year' : 'years'}</span>
          </div>
        )}
        {player.birthPlace && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">From</span>
            <span className="text-gray-300 truncate ml-2">{player.birthPlace}</span>
          </div>
        )}
      </div>

      {/* View Stats Link Indicator */}
      {canLink && (
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span>View Full Stats</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </>
  )

  // Compact version for list views
  if (compact) {
    const compactContent = (
      <div className="flex items-center justify-between py-3 px-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 relative flex-shrink-0 rounded-full overflow-hidden bg-gray-800">
            {player.headshot ? (
              <Image
                src={player.headshot}
                alt={player.displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`font-medium text-sm ${canLink ? 'text-white group-hover:text-primary transition-colors' : 'text-white'}`}>
                {player.displayName}
              </span>
              {player.jersey && (
                <span className="text-gray-500 text-xs">#{player.jersey}</span>
              )}
            </div>
            <p className="text-xs text-gray-400">{player.positionAbbr || player.position}</p>
          </div>
        </div>
        <div className="text-right">
          {stats && sport === 'nba' && stats.ppg !== undefined ? (
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-primary font-semibold">{stats.ppg.toFixed(1)} PPG</span>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400">{player.height}</p>
              <p className="text-xs text-gray-500">{player.weight}</p>
            </>
          )}
        </div>
      </div>
    )

    if (canLink) {
      return (
        <Link
          href={playerLink}
          className="glass rounded-lg hover:bg-white/5 transition-colors block group"
        >
          {compactContent}
        </Link>
      )
    }

    return (
      <div className="glass rounded-lg hover:bg-white/5 transition-colors">
        {compactContent}
      </div>
    )
  }

  // Full card version
  if (canLink) {
    return (
      <Link
        href={playerLink}
        className="glass rounded-xl p-4 sm:p-5 hover:bg-white/[0.08] transition-all duration-300 animate-fade-in block group cursor-pointer"
      >
        {cardContent}
      </Link>
    )
  }

  return (
    <div className="glass rounded-xl p-4 sm:p-5 hover:bg-white/[0.08] transition-all duration-300 animate-fade-in">
      {cardContent}
    </div>
  )
}
