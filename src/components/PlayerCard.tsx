'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ESPNPlayer } from '@/lib/espn'

interface PlayerCardProps {
  player: ESPNPlayer
  teamId?: string
  sport?: 'nba' | 'nfl'
  compact?: boolean
}

export default function PlayerCard({ player, teamId, sport = 'nba', compact = false }: PlayerCardProps) {
  if (compact) {
    return (
      <div className="flex items-center justify-between py-3 px-4 glass rounded-lg hover:bg-white/5 transition-colors">
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
              <span className="text-white font-medium text-sm">{player.displayName}</span>
              {player.jersey && (
                <span className="text-gray-500 text-xs">#{player.jersey}</span>
              )}
            </div>
            <p className="text-xs text-gray-400">{player.positionAbbr || player.position}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{player.height}</p>
          <p className="text-xs text-gray-500">{player.weight}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-4 sm:p-5 hover:bg-white/[0.08] transition-all duration-300 animate-fade-in">
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
            <h3 className="font-bold text-lg text-white truncate">{player.displayName}</h3>
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

      {/* Player Stats */}
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
    </div>
  )
}
