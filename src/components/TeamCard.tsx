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
    <Link href={`/${sport}/team/${team.id}`}>
      <div
        className="glass rounded-xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer group animate-fade-in"
        style={{
          background: `linear-gradient(135deg, #${team.color}15, transparent)`
        }}
      >
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 relative flex-shrink-0">
            {team.logo && (
              <Image
                src={team.logo}
                alt={team.displayName}
                fill
                className="object-contain group-hover:scale-110 transition-transform duration-300"
              />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">
              {team.displayName}
            </h3>
            <p className="text-sm text-gray-400">{team.abbreviation}</p>
            {team.record && (
              <p className="text-xs text-gray-500 mt-1">{team.record}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
