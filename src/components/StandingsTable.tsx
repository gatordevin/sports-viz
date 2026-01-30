'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Team } from '@/lib/espn'

interface StandingEntry {
  team: Team
  rank: number
  wins: number
  losses: number
  winPct: number
  gamesBehind: string
  streak: string
  last10: string
  homeRecord?: string
  awayRecord?: string
}

interface StandingsTableProps {
  standings: StandingEntry[]
  conference?: string
  sport: 'nba' | 'nfl'
  compact?: boolean
}

export default function StandingsTable({ standings, conference, sport, compact = false }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <p className="text-gray-400">No standings data available</p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="glass-card rounded-xl overflow-hidden">
        {conference && (
          <div className="px-4 py-3 bg-white/5 border-b border-white/10">
            <h3 className="font-semibold text-white flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${conference === 'East' ? 'bg-blue-400' : 'bg-red-400'}`} />
              <span>{conference}ern Conference</span>
            </h3>
          </div>
        )}
        <div className="divide-y divide-white/5">
          {standings.slice(0, 8).map((entry, idx) => (
            <Link
              key={entry.team.id}
              href={`/${sport}/team/${entry.team.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className={`w-5 text-center text-sm font-medium ${idx < 6 ? 'text-green-400' : idx < 10 ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {entry.rank}
                </span>
                <div className="w-8 h-8 relative">
                  {entry.team.logo && (
                    <Image
                      src={entry.team.logo}
                      alt={entry.team.displayName}
                      fill
                      className="object-contain"
                    />
                  )}
                </div>
                <span className="text-white text-sm font-medium">{entry.team.abbreviation}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-white font-mono">{entry.wins}-{entry.losses}</span>
                <span className="text-gray-500 w-12 text-right">{entry.gamesBehind}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {conference && (
        <div className="px-4 sm:px-6 py-4 bg-white/5 border-b border-white/10">
          <h3 className="font-bold text-lg text-white flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${conference === 'East' ? 'bg-blue-400' : 'bg-red-400'}`} />
            <span>{conference}ern Conference</span>
          </h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="px-4 py-3 text-left font-medium">#</th>
              <th className="px-4 py-3 text-left font-medium">Team</th>
              <th className="px-4 py-3 text-center font-medium">W</th>
              <th className="px-4 py-3 text-center font-medium">L</th>
              <th className="px-4 py-3 text-center font-medium">PCT</th>
              <th className="px-4 py-3 text-center font-medium">GB</th>
              <th className="px-4 py-3 text-center font-medium hidden sm:table-cell">STRK</th>
              <th className="px-4 py-3 text-center font-medium hidden md:table-cell">L10</th>
              <th className="px-4 py-3 text-center font-medium hidden lg:table-cell">HOME</th>
              <th className="px-4 py-3 text-center font-medium hidden lg:table-cell">AWAY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {standings.map((entry, idx) => {
              const isPlayoffSpot = idx < (sport === 'nba' ? 6 : 7)
              const isPlayIn = sport === 'nba' && idx >= 6 && idx < 10

              return (
                <tr
                  key={entry.team.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${isPlayoffSpot ? 'text-green-400' : isPlayIn ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/${sport}/team/${entry.team.id}`}
                      className="flex items-center space-x-3 group"
                    >
                      <div className="w-8 h-8 relative flex-shrink-0">
                        {entry.team.logo && (
                          <Image
                            src={entry.team.logo}
                            alt={entry.team.displayName}
                            fill
                            className="object-contain"
                          />
                        )}
                      </div>
                      <span className="text-white font-medium group-hover:text-primary transition-colors">
                        {entry.team.displayName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center text-white font-mono">{entry.wins}</td>
                  <td className="px-4 py-3 text-center text-gray-400 font-mono">{entry.losses}</td>
                  <td className="px-4 py-3 text-center text-white">{(entry.winPct * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-center text-gray-400">{entry.gamesBehind}</td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className={entry.streak.startsWith('W') ? 'text-green-400' : 'text-red-400'}>
                      {entry.streak}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 hidden md:table-cell">{entry.last10}</td>
                  <td className="px-4 py-3 text-center text-gray-400 hidden lg:table-cell">{entry.homeRecord || '-'}</td>
                  <td className="px-4 py-3 text-center text-gray-400 hidden lg:table-cell">{entry.awayRecord || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 sm:px-6 py-3 border-t border-white/10 flex items-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span>Playoff</span>
        </div>
        {sport === 'nba' && (
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span>Play-In</span>
          </div>
        )}
      </div>
    </div>
  )
}
