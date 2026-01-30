'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Team } from '@/lib/espn'

interface TeamCardProps {
  team: Team
  sport: 'nba' | 'nfl'
}

export default function TeamCard({ team, sport }: TeamCardProps) {
  return (
    <Link href={`/${sport}/team/${team.id}`} className="block">
      <div
        className="glass rounded-xl p-4 sm:p-5 hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 cursor-pointer group animate-fade-in min-h-[88px] active:scale-[0.98]"
        style={{
          background: `linear-gradient(135deg, #${team.color}15, transparent)`
        }}
      >
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 relative flex-shrink-0">
            {team.logo && (
              <Image
                src={team.logo}
                alt={team.displayName}
                fill
                className="object-contain group-hover:scale-110 transition-transform duration-300"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-primary transition-colors truncate">
              {team.displayName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs sm:text-sm text-gray-400">{team.abbreviation}</span>
              {team.record && (
                <>
                  <span className="text-gray-600">|</span>
                  <span className="text-xs sm:text-sm text-gray-500">{team.record}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
