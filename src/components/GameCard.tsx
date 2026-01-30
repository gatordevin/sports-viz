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

  const awayWinning = !isScheduled && parseInt(game.awayScore) > parseInt(game.homeScore)
  const homeWinning = !isScheduled && parseInt(game.homeScore) > parseInt(game.awayScore)

  return (
    <div className="glass rounded-xl p-4 sm:p-5 hover:bg-white/[0.08] transition-all duration-300 animate-fade-in min-h-[180px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {isLive && (
            <span className="flex items-center space-x-1.5 px-2 py-1 bg-red-500/20 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full live-pulse" />
              <span className="text-xs font-semibold text-red-400">LIVE</span>
            </span>
          )}
          {game.broadcast && (
            <span className="text-xs text-gray-500 hidden sm:inline">{game.broadcast}</span>
          )}
        </div>
        <span className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-full ${
          isLive
            ? 'bg-red-500/10 text-red-400'
            : isFinished
            ? 'bg-gray-500/20 text-gray-400'
            : 'bg-blue-500/10 text-blue-400'
        }`}>
          {formatGameTime()}
        </span>
      </div>

      {/* Away Team */}
      <div className={`flex items-center justify-between py-2.5 sm:py-3 rounded-lg px-2 -mx-2 transition-colors ${
        awayWinning ? 'bg-green-500/5' : ''
      }`}>
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex-shrink-0">
            {game.awayTeam.logo && (
              <Image
                src={game.awayTeam.logo}
                alt={game.awayTeam.displayName}
                fill
                className="object-contain"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className={`font-semibold text-sm sm:text-base truncate ${awayWinning ? 'text-white' : 'text-gray-300'}`}>
              {game.awayTeam.abbreviation}
            </p>
            <p className="text-xs text-gray-500 truncate">{game.awayTeam.record}</p>
          </div>
        </div>
        <span className={`text-2xl sm:text-3xl font-bold ml-4 ${
          awayWinning ? 'text-white' : 'text-gray-500'
        }`}>
          {isScheduled ? '-' : game.awayScore}
        </span>
      </div>

      {/* Home Team */}
      <div className={`flex items-center justify-between py-2.5 sm:py-3 rounded-lg px-2 -mx-2 transition-colors ${
        homeWinning ? 'bg-green-500/5' : ''
      }`}>
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex-shrink-0">
            {game.homeTeam.logo && (
              <Image
                src={game.homeTeam.logo}
                alt={game.homeTeam.displayName}
                fill
                className="object-contain"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className={`font-semibold text-sm sm:text-base truncate ${homeWinning ? 'text-white' : 'text-gray-300'}`}>
              {game.homeTeam.abbreviation}
            </p>
            <p className="text-xs text-gray-500 truncate">{game.homeTeam.record}</p>
          </div>
        </div>
        <span className={`text-2xl sm:text-3xl font-bold ml-4 ${
          homeWinning ? 'text-white' : 'text-gray-500'
        }`}>
          {isScheduled ? '-' : game.homeScore}
        </span>
      </div>

      {/* Venue - hidden on very small screens */}
      {game.venue && (
        <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-white/5 truncate hidden sm:block">
          {game.venue}
        </p>
      )}
    </div>
  )
}
