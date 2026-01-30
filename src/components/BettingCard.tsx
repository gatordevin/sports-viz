'use client'

import Image from 'next/image'
import Link from 'next/link'
import { OddsEvent, formatOdds, oddsToPercentage, getProbabilityColor, getProbabilityBarColor } from '@/lib/odds'
import { Injury, TeamBettingStats, RecentGame, calculateForm } from '@/lib/espn'

interface TeamData {
  id: string
  name: string
  abbreviation: string
  logo: string
  record: string
  homeRecord: string
  awayRecord: string
  conferenceRank?: number
  ppg: number
  oppg: number
  pointDiff: number
  recentGames: RecentGame[]
  injuries: Injury[]
}

interface BettingCardProps {
  event: OddsEvent
  homeTeamData?: TeamData | null
  awayTeamData?: TeamData | null
  h2h?: {
    team1Wins: number
    team2Wins: number
    avgMargin: number
  }
  sport: 'nba' | 'nfl'
}

// Form indicator component - shows W/L for recent games
function FormIndicator({ results }: { results: ('W' | 'L')[] }) {
  return (
    <div className="flex gap-1">
      {results.map((result, i) => (
        <span
          key={i}
          className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${
            result === 'W'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {result}
        </span>
      ))}
    </div>
  )
}

// Calculate streak from form
function getStreak(results: ('W' | 'L')[]): { type: 'W' | 'L'; count: number } {
  if (results.length === 0) return { type: 'W', count: 0 }
  const firstResult = results[0]
  let count = 0
  for (const result of results) {
    if (result === firstResult) count++
    else break
  }
  return { type: firstResult, count }
}

// Streak badge component
function StreakBadge({ results }: { results: ('W' | 'L')[] }) {
  const streak = getStreak(results)
  if (streak.count < 2) return null

  const isHot = streak.type === 'W' && streak.count >= 3
  const isCold = streak.type === 'L' && streak.count >= 3

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
      isHot ? 'bg-green-500/20 text-green-400' :
      isCold ? 'bg-red-500/20 text-red-400' :
      streak.type === 'W' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
    }`}>
      {isHot && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
        </svg>
      )}
      {isCold && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
        </svg>
      )}
      {streak.count}{streak.type}
    </span>
  )
}

// Value bet indicator - underdog with good recent form
function ValueBetBadge({ percentage, formWins }: { percentage: number; formWins: number }) {
  // Value bet: underdog (30-45%) with good form (3+ wins in last 5)
  const isValue = percentage < 45 && percentage >= 20 && formWins >= 3
  if (!isValue) return null

  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 flex items-center gap-1">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      VALUE
    </span>
  )
}

// Injury status badge
function InjuryBadge({ status }: { status: Injury['status'] }) {
  const colors: Record<Injury['status'], string> = {
    'Out': 'bg-red-500/20 text-red-400',
    'Doubtful': 'bg-orange-500/20 text-orange-400',
    'Questionable': 'bg-yellow-500/20 text-yellow-400',
    'Probable': 'bg-green-500/20 text-green-400',
    'Day-To-Day': 'bg-yellow-500/20 text-yellow-400',
    'Unknown': 'bg-gray-500/20 text-gray-400'
  }

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[status]}`}>
      {status}
    </span>
  )
}

// Compact injury list showing top injuries
function InjuryList({ injuries, limit = 3 }: { injuries: Injury[]; limit?: number }) {
  // Sort by severity (Out first, then Doubtful, etc.)
  const severityOrder = ['Out', 'Doubtful', 'Questionable', 'Day-To-Day', 'Probable', 'Unknown']
  const sorted = [...injuries].sort((a, b) =>
    severityOrder.indexOf(a.status) - severityOrder.indexOf(b.status)
  )

  const visible = sorted.slice(0, limit)
  const remaining = injuries.length - limit

  if (injuries.length === 0) {
    return <span className="text-gray-500 text-xs">No reported injuries</span>
  }

  return (
    <div className="space-y-1">
      {visible.map((injury, i) => (
        <div key={i} className="flex items-center justify-between text-xs">
          <span className="text-gray-300 truncate mr-2">
            {injury.playerName}
            {injury.position && <span className="text-gray-500 ml-1">({injury.position})</span>}
          </span>
          <InjuryBadge status={injury.status} />
        </div>
      ))}
      {remaining > 0 && (
        <span className="text-gray-500 text-[10px]">+{remaining} more</span>
      )}
    </div>
  )
}

// Stat comparison bar
function StatBar({ leftValue, rightValue, leftLabel, rightLabel }: {
  leftValue: number
  rightValue: number
  leftLabel: string
  rightLabel: string
}) {
  const total = leftValue + rightValue || 1
  const leftPct = (leftValue / total) * 100
  const rightPct = (rightValue / total) * 100

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{leftLabel}</span>
        <span className="text-gray-400">{rightLabel}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
        <div
          className="bg-blue-500/60 transition-all"
          style={{ width: `${leftPct}%` }}
        />
        <div
          className="bg-orange-500/60 transition-all"
          style={{ width: `${rightPct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs font-mono">
        <span className="text-white">{leftValue.toFixed(1)}</span>
        <span className="text-white">{rightValue.toFixed(1)}</span>
      </div>
    </div>
  )
}

export default function BettingCard({ event, homeTeamData, awayTeamData, h2h, sport }: BettingCardProps) {
  const gameTime = new Date(event.commence_time)
  const isLive = gameTime <= new Date()

  // Get DraftKings odds first, fall back to first available
  const bookmaker = event.bookmakers.find(b => b.key === 'draftkings') || event.bookmakers[0]

  if (!bookmaker) {
    return null
  }

  const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h')
  const spreadMarket = bookmaker.markets.find(m => m.key === 'spreads')
  const totalMarket = bookmaker.markets.find(m => m.key === 'totals')

  const homeH2h = h2hMarket?.outcomes.find(o => o.name === event.home_team)
  const awayH2h = h2hMarket?.outcomes.find(o => o.name === event.away_team)

  const homeSpread = spreadMarket?.outcomes.find(o => o.name === event.home_team)
  const awaySpread = spreadMarket?.outcomes.find(o => o.name === event.away_team)

  const over = totalMarket?.outcomes.find(o => o.name === 'Over')
  const under = totalMarket?.outcomes.find(o => o.name === 'Under')

  // Calculate win probabilities
  const awayPercentage = awayH2h ? oddsToPercentage(awayH2h.price) : 50
  const homePercentage = homeH2h ? oddsToPercentage(homeH2h.price) : 50

  // Calculate form for both teams
  const awayForm = awayTeamData ? calculateForm(awayTeamData.recentGames, 5) : null
  const homeForm = homeTeamData ? calculateForm(homeTeamData.recentGames, 5) : null

  // Format time display
  const formatGameTime = () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const isToday = gameTime.toDateString() === today.toDateString()
    const isTomorrow = gameTime.toDateString() === tomorrow.toDateString()

    const timeStr = gameTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })

    if (isToday) return `Today ${timeStr}`
    if (isTomorrow) return `Tomorrow ${timeStr}`
    return `${gameTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ${timeStr}`
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden hover:bg-white/[0.03] transition-all duration-300">
      {/* Header */}
      <div className="px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${sport === 'nba' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
              {sport.toUpperCase()}
            </span>
            {isLive ? (
              <span className="px-2 py-1 text-xs font-semibold bg-red-500/20 text-red-400 rounded animate-pulse">
                LIVE
              </span>
            ) : (
              <span className="text-sm text-gray-400">
                {formatGameTime()}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">{bookmaker.title}</span>
        </div>
      </div>

      {/* Main Matchup */}
      <div className="p-4">
        <div className="flex items-stretch gap-4">
          {/* Away Team Column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              {awayTeamData?.logo && (
                <Link href={`/${sport}/team/${awayTeamData.id}`} className="w-12 h-12 relative flex-shrink-0 hover:scale-110 transition-transform">
                  <Image
                    src={awayTeamData.logo}
                    alt={event.away_team}
                    fill
                    className="object-contain"
                  />
                </Link>
              )}
              <div className="min-w-0">
                <Link
                  href={awayTeamData ? `/${sport}/team/${awayTeamData.id}` : '#'}
                  className="font-bold text-white truncate block hover:text-primary transition-colors"
                >
                  {event.away_team}
                </Link>
                <p className="text-xs text-gray-500">
                  {awayTeamData?.record || '-'}
                  {awayTeamData?.awayRecord && ` (${awayTeamData.awayRecord} Away)`}
                </p>
              </div>
            </div>

            {/* Away Win % */}
            <div className="mb-3">
              <div className={`text-2xl font-bold ${getProbabilityColor(awayPercentage)}`}>
                {awayPercentage}%
              </div>
              {awayH2h && (
                <div className="text-sm text-gray-500">{formatOdds(awayH2h.price)}</div>
              )}
            </div>

            {/* Away Spread */}
            {awaySpread && (
              <div className="px-3 py-2 bg-white/5 rounded-lg mb-3">
                <div className="text-xs text-gray-400">Spread</div>
                <div className="text-lg font-mono text-white">
                  {awaySpread.point! > 0 ? '+' : ''}{awaySpread.point}
                </div>
              </div>
            )}

            {/* Away Form */}
            {awayForm && (
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1 flex items-center gap-2">
                  Last 5: {awayForm.record}
                  <StreakBadge results={awayForm.results} />
                  <ValueBetBadge percentage={awayPercentage} formWins={awayForm.results.filter(r => r === 'W').length} />
                </div>
                <FormIndicator results={awayForm.results} />
              </div>
            )}

            {/* Away Injuries */}
            {awayTeamData && (
              <div>
                <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Injuries
                </div>
                <InjuryList injuries={awayTeamData.injuries} />
              </div>
            )}
          </div>

          {/* Center - VS and Total */}
          <div className="flex flex-col items-center justify-center w-20 flex-shrink-0">
            <div className="text-gray-500 font-bold mb-2">@</div>

            {/* Total */}
            {over && under && (
              <div className="text-center px-2 py-2 bg-white/5 rounded-lg">
                <div className="text-[10px] text-gray-400 mb-1">O/U</div>
                <div className="text-lg font-mono text-white font-bold">{over.point}</div>
              </div>
            )}

            {/* H2H if available */}
            {h2h && (h2h.team1Wins > 0 || h2h.team2Wins > 0) && (
              <div className="mt-3 text-center">
                <div className="text-[10px] text-gray-400">H2H</div>
                <div className="text-xs text-white font-mono">
                  {h2h.team2Wins}-{h2h.team1Wins}
                </div>
                {h2h.avgMargin !== 0 && (
                  <div className="text-[10px] text-gray-500">
                    Avg: {h2h.avgMargin > 0 ? '+' : ''}{h2h.avgMargin.toFixed(1)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Home Team Column */}
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center justify-end gap-3 mb-3">
              <div className="min-w-0">
                <Link
                  href={homeTeamData ? `/${sport}/team/${homeTeamData.id}` : '#'}
                  className="font-bold text-white truncate block hover:text-primary transition-colors"
                >
                  {event.home_team}
                </Link>
                <p className="text-xs text-gray-500">
                  {homeTeamData?.record || '-'}
                  {homeTeamData?.homeRecord && ` (${homeTeamData.homeRecord} Home)`}
                </p>
              </div>
              {homeTeamData?.logo && (
                <Link href={`/${sport}/team/${homeTeamData.id}`} className="w-12 h-12 relative flex-shrink-0 hover:scale-110 transition-transform">
                  <Image
                    src={homeTeamData.logo}
                    alt={event.home_team}
                    fill
                    className="object-contain"
                  />
                </Link>
              )}
            </div>

            {/* Home Win % */}
            <div className="mb-3">
              <div className={`text-2xl font-bold ${getProbabilityColor(homePercentage)}`}>
                {homePercentage}%
              </div>
              {homeH2h && (
                <div className="text-sm text-gray-500">{formatOdds(homeH2h.price)}</div>
              )}
            </div>

            {/* Home Spread */}
            {homeSpread && (
              <div className="px-3 py-2 bg-white/5 rounded-lg mb-3">
                <div className="text-xs text-gray-400">Spread</div>
                <div className="text-lg font-mono text-white">
                  {homeSpread.point! > 0 ? '+' : ''}{homeSpread.point}
                </div>
              </div>
            )}

            {/* Home Form */}
            {homeForm && (
              <div className="mb-3 flex flex-col items-end">
                <div className="text-xs text-gray-400 mb-1 flex items-center gap-2 justify-end">
                  <ValueBetBadge percentage={homePercentage} formWins={homeForm.results.filter(r => r === 'W').length} />
                  <StreakBadge results={homeForm.results} />
                  Last 5: {homeForm.record}
                </div>
                <FormIndicator results={homeForm.results} />
              </div>
            )}

            {/* Home Injuries */}
            {homeTeamData && (
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1 flex items-center justify-end gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Injuries
                </div>
                <InjuryList injuries={homeTeamData.injuries} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Comparison Bar */}
      {awayTeamData && homeTeamData && (awayTeamData.ppg > 0 || homeTeamData.ppg > 0) && (
        <div className="px-4 py-3 border-t border-white/10 space-y-3">
          <StatBar
            leftValue={awayTeamData.ppg}
            rightValue={homeTeamData.ppg}
            leftLabel="PPG"
            rightLabel="PPG"
          />
          <StatBar
            leftValue={awayTeamData.oppg}
            rightValue={homeTeamData.oppg}
            leftLabel="Opp PPG"
            rightLabel="Opp PPG"
          />
          {/* Point Differential */}
          <div className="flex justify-between items-center text-xs pt-1">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Diff:</span>
              <span className={`font-mono font-bold ${awayTeamData.pointDiff > 0 ? 'text-green-400' : awayTeamData.pointDiff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {awayTeamData.pointDiff > 0 ? '+' : ''}{awayTeamData.pointDiff.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`font-mono font-bold ${homeTeamData.pointDiff > 0 ? 'text-green-400' : homeTeamData.pointDiff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {homeTeamData.pointDiff > 0 ? '+' : ''}{homeTeamData.pointDiff.toFixed(1)}
              </span>
              <span className="text-gray-500">:Diff</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Betting Summary */}
      <div className="px-4 py-3 bg-white/5 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            {awaySpread && (
              <span className="text-gray-400">
                <span className="text-white font-medium">{event.away_team.split(' ').pop()}</span>
                {' '}{awaySpread.point! > 0 ? '+' : ''}{awaySpread.point}
              </span>
            )}
            {over && (
              <span className="text-gray-400">
                O/U <span className="text-white font-medium">{over.point}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${getProbabilityColor(awayPercentage)}`}>
              {awayPercentage}%
            </span>
            <span className="text-gray-500">-</span>
            <span className={`font-bold ${getProbabilityColor(homePercentage)}`}>
              {homePercentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
