'use client'

import Link from 'next/link'
import { BDLPlayer } from '@/lib/balldontlie'
import { getPlayerHeadshotURLSync } from '@/lib/playerHeadshots'
import PlayerHeadshot from './PlayerHeadshot'

interface BDLPlayerCardProps {
  player: BDLPlayer
  compact?: boolean
  stats?: {
    ppg?: number
    rpg?: number
    apg?: number
  }
}

export default function BDLPlayerCard({ player, compact = false, stats }: BDLPlayerCardProps) {
  // Since we're using BDL data, we can directly link to /players/[id] with the BDL ID
  const playerLink = `/players/${player.id}`

  // Get headshot URL using sync version (client component)
  const headshotUrl = getPlayerHeadshotURLSync(player.id)

  const cardContent = (
    <>
      {/* Player Header */}
      <div className="flex items-start space-x-4">
        <PlayerHeadshot
          src={headshotUrl}
          firstName={player.first_name}
          lastName={player.last_name}
          size="medium"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-lg truncate text-white group-hover:text-primary transition-colors">
              {player.first_name} {player.last_name}
            </h3>
            {player.jersey_number && (
              <span className="px-2 py-0.5 bg-white/10 rounded text-sm text-gray-300">#{player.jersey_number}</span>
            )}
          </div>
          <p className="text-sm text-gray-400">{player.position || 'N/A'}</p>
        </div>
      </div>

      {/* Stats Display */}
      {stats && (stats.ppg !== undefined || stats.rpg !== undefined || stats.apg !== undefined) ? (
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
      ) : (
        /* Default physical stats */
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Height</p>
            <p className="text-sm font-semibold text-white">{player.height || 'N/A'}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Weight</p>
            <p className="text-sm font-semibold text-white">{player.weight ? `${player.weight} lbs` : 'N/A'}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Country</p>
            <p className="text-sm font-semibold text-white truncate">{player.country || 'N/A'}</p>
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
        {player.draft_year && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Draft</span>
            <span className="text-gray-300">
              {player.draft_year} R{player.draft_round} Pick {player.draft_number}
            </span>
          </div>
        )}
      </div>

      {/* View Stats Link Indicator */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        <span>View Full Stats</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </>
  )

  // Compact version for list views
  if (compact) {
    const compactContent = (
      <div className="flex items-center justify-between py-3 px-4">
        <div className="flex items-center space-x-3">
          <PlayerHeadshot
            src={headshotUrl}
            firstName={player.first_name}
            lastName={player.last_name}
            size="small"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm text-white group-hover:text-primary transition-colors">
                {player.first_name} {player.last_name}
              </span>
              {player.jersey_number && (
                <span className="text-gray-500 text-xs">#{player.jersey_number}</span>
              )}
            </div>
            <p className="text-xs text-gray-400">{player.position || 'N/A'}</p>
          </div>
        </div>
        <div className="text-right">
          {stats && stats.ppg !== undefined ? (
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-primary font-semibold">{stats.ppg.toFixed(1)} PPG</span>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400">{player.height}</p>
              <p className="text-xs text-gray-500">{player.weight ? `${player.weight} lbs` : ''}</p>
            </>
          )}
        </div>
      </div>
    )

    return (
      <Link
        href={playerLink}
        className="glass rounded-lg hover:bg-white/5 transition-colors block group"
      >
        {compactContent}
      </Link>
    )
  }

  // Full card version
  return (
    <Link
      href={playerLink}
      className="glass rounded-xl p-4 sm:p-5 hover:bg-white/[0.08] transition-all duration-300 animate-fade-in block group cursor-pointer"
    >
      {cardContent}
    </Link>
  )
}
