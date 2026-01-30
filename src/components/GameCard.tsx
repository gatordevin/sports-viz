'use client'

import Image from 'next/image'
import { Game } from '@/lib/espn'

interface GameCardProps {
  game: Game
}

export default function GameCard({ game }: GameCardProps) {
  const isLive = game.status.type.state === 'in'
  const isScheduled = game.status.type.state === 'pre'
  const isFinished = game.status.type.completed

  const formatGameTime = () => {
    if (isLive) {
      return `Q${game.status.period} ${game.status.displayClock}`
    }
    if (isFinished) {
      return 'Final'
    }
    const date = new Date(game.date)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="glass rounded-xl p-4 hover:bg-white/[0.08] transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isLive && (
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-red-500 rounded-full live-pulse" />
              <span className="text-xs font-medium text-red-500">LIVE</span>
            </span>
          )}
          {game.broadcast && (
            <span className="text-xs text-gray-500">{game.broadcast}</span>
          )}
        </div>
        <span className={`text-xs font-medium ${isLive ? 'text-red-400' : 'text-gray-400'}`}>
          {formatGameTime()}
        </span>
      </div>

      {/* Away Team */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 relative">
            {game.awayTeam.logo && (
              <Image
                src={game.awayTeam.logo}
                alt={game.awayTeam.displayName}
                fill
                className="object-contain"
              />
            )}
          </div>
          <div>
            <p className="font-semibold text-white">{game.awayTeam.abbreviation}</p>
            <p className="text-xs text-gray-500">{game.awayTeam.record}</p>
          </div>
        </div>
        <span className={`text-2xl font-bold ${
          !isScheduled && parseInt(game.awayScore) > parseInt(game.homeScore)
            ? 'text-white'
            : 'text-gray-500'
        }`}>
          {isScheduled ? '-' : game.awayScore}
        </span>
      </div>

      {/* Home Team */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 relative">
            {game.homeTeam.logo && (
              <Image
                src={game.homeTeam.logo}
                alt={game.homeTeam.displayName}
                fill
                className="object-contain"
              />
            )}
          </div>
          <div>
            <p className="font-semibold text-white">{game.homeTeam.abbreviation}</p>
            <p className="text-xs text-gray-500">{game.homeTeam.record}</p>
          </div>
        </div>
        <span className={`text-2xl font-bold ${
          !isScheduled && parseInt(game.homeScore) > parseInt(game.awayScore)
            ? 'text-white'
            : 'text-gray-500'
        }`}>
          {isScheduled ? '-' : game.homeScore}
        </span>
      </div>

      {game.venue && (
        <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-white/5">
          {game.venue}
        </p>
      )}
    </div>
  )
}
