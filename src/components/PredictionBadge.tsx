'use client'

import {
  GamePrediction,
  ValueBet,
  getConfidenceColor,
  getConfidenceBgColor,
  getEdgeColor,
  formatSpread
} from '@/lib/predictor'

// ============================================
// PREDICTION BADGE - Shows predicted winner
// ============================================

interface PredictionBadgeProps {
  prediction: GamePrediction
  compact?: boolean
}

export function PredictionBadge({ prediction, compact = false }: PredictionBadgeProps) {
  const isHomeFavored = prediction.predictedSpread < 0

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getConfidenceBgColor(prediction.confidence)} ${getConfidenceColor(prediction.confidence)}`}>
          {prediction.confidence.toUpperCase()}
        </span>
        <span className="text-xs text-white font-medium">
          {prediction.predictedWinner.split(' ').pop()}
        </span>
        <span className="text-xs text-gray-400">
          {prediction.winProbability}%
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded text-xs font-bold ${getConfidenceBgColor(prediction.confidence)} ${getConfidenceColor(prediction.confidence)}`}>
          {prediction.confidence.toUpperCase()} CONFIDENCE
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-white font-semibold">
          Pick: {prediction.predictedWinner}
        </span>
        <span className={`text-sm font-mono ${prediction.winProbability >= 60 ? 'text-green-400' : prediction.winProbability >= 50 ? 'text-yellow-400' : 'text-orange-400'}`}>
          ({prediction.winProbability}%)
        </span>
      </div>
    </div>
  )
}

// ============================================
// PREDICTED LINES DISPLAY
// ============================================

interface PredictedLinesProps {
  prediction: GamePrediction
  marketSpread?: number
  marketTotal?: number
}

export function PredictedLines({ prediction, marketSpread, marketTotal }: PredictedLinesProps) {
  const spreadDiff = marketSpread !== undefined ? Math.abs(marketSpread - prediction.predictedSpread) : 0
  const totalDiff = marketTotal !== undefined ? Math.abs(marketTotal - prediction.predictedTotal) : 0

  const hasSpreadValue = spreadDiff >= 2
  const hasTotalValue = totalDiff >= 3

  return (
    <div className="space-y-2">
      {/* Predicted Spread */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Our Spread:</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-white">
            {formatSpread(prediction.predictedSpread)}
          </span>
          {marketSpread !== undefined && hasSpreadValue && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${spreadDiff >= 3 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {spreadDiff >= 3 ? 'VALUE' : 'EDGE'}
            </span>
          )}
        </div>
      </div>

      {/* Market Spread Comparison */}
      {marketSpread !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Market:</span>
          <span className="font-mono text-gray-400">
            {formatSpread(marketSpread)}
            {hasSpreadValue && (
              <span className={`ml-2 ${spreadDiff >= 3 ? 'text-green-400' : 'text-yellow-400'}`}>
                ({spreadDiff > 0 ? '+' : ''}{(marketSpread - prediction.predictedSpread).toFixed(1)} diff)
              </span>
            )}
          </span>
        </div>
      )}

      {/* Predicted Total */}
      <div className="flex items-center justify-between text-xs mt-2">
        <span className="text-gray-400">Our Total:</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-white">
            {prediction.predictedTotal}
          </span>
          {marketTotal !== undefined && hasTotalValue && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${totalDiff >= 5 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {prediction.predictedTotal > marketTotal ? 'OVER' : 'UNDER'}
            </span>
          )}
        </div>
      </div>

      {/* Market Total Comparison */}
      {marketTotal !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Market:</span>
          <span className="font-mono text-gray-400">
            {marketTotal}
            {hasTotalValue && (
              <span className={`ml-2 ${totalDiff >= 5 ? 'text-green-400' : 'text-yellow-400'}`}>
                ({prediction.predictedTotal - marketTotal > 0 ? '+' : ''}{prediction.predictedTotal - marketTotal} diff)
              </span>
            )}
          </span>
        </div>
      )}

      {/* Predicted Score */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
        <span className="text-gray-400">Predicted Score:</span>
        <span className="font-mono text-white">
          {prediction.predictedAwayScore} - {prediction.predictedHomeScore}
        </span>
      </div>
    </div>
  )
}

// ============================================
// VALUE BET ALERT
// ============================================

interface ValueBetAlertProps {
  valueBets: ValueBet[]
  compact?: boolean
}

export function ValueBetAlert({ valueBets, compact = false }: ValueBetAlertProps) {
  if (valueBets.length === 0) return null

  const topBet = valueBets[0]

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
        <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="text-[10px] font-bold text-amber-400">VALUE</span>
        <span className="text-[10px] text-white">{topBet.recommendation}</span>
        <span className={`text-[10px] font-mono ${getEdgeColor(topBet.edge)}`}>+{topBet.edge}pt</span>
      </div>
    )
  }

  return (
    <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="text-sm font-bold text-amber-400">VALUE BETS FOUND</span>
      </div>

      <div className="space-y-2">
        {valueBets.slice(0, 3).map((bet, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getConfidenceBgColor(bet.confidence)} ${getConfidenceColor(bet.confidence)}`}>
                {bet.confidence.toUpperCase()}
              </span>
              <span className="text-white font-medium">{bet.recommendation}</span>
            </div>
            <span className={`font-mono font-bold ${getEdgeColor(bet.edge)}`}>
              +{bet.edge}pt edge
            </span>
          </div>
        ))}
      </div>

      {valueBets.length > 0 && (
        <p className="text-[10px] text-gray-500 mt-2">
          {topBet.explanation}
        </p>
      )}
    </div>
  )
}

// ============================================
// POWER RATINGS DISPLAY
// ============================================

interface PowerRatingsProps {
  prediction: GamePrediction
}

export function PowerRatings({ prediction }: PowerRatingsProps) {
  const { powerRatings } = prediction

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Power Ratings:</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-center">
          <div className={`text-lg font-bold font-mono ${powerRatings.away >= 105 ? 'text-green-400' : powerRatings.away >= 95 ? 'text-yellow-400' : 'text-red-400'}`}>
            {powerRatings.away.toFixed(1)}
          </div>
          <div className="text-[10px] text-gray-500">Away</div>
        </div>
        <div className="text-center px-3">
          <div className={`text-sm font-mono ${powerRatings.differential > 0 ? 'text-green-400' : powerRatings.differential < 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {powerRatings.differential > 0 ? '+' : ''}{powerRatings.differential.toFixed(1)}
          </div>
          <div className="text-[10px] text-gray-500">Diff</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold font-mono ${powerRatings.home >= 105 ? 'text-green-400' : powerRatings.home >= 95 ? 'text-yellow-400' : 'text-red-400'}`}>
            {powerRatings.home.toFixed(1)}
          </div>
          <div className="text-[10px] text-gray-500">Home</div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// PREDICTION FACTORS LIST
// ============================================

interface PredictionFactorsProps {
  factors: GamePrediction['factors']
}

export function PredictionFactors({ factors }: PredictionFactorsProps) {
  const significantFactors = factors.filter(f => Math.abs(f.impact) >= 0.5 || f.name === 'Injuries')

  if (significantFactors.length === 0) return null

  return (
    <div className="space-y-1.5">
      <div className="text-xs text-gray-400">Key Factors:</div>
      <div className="space-y-1">
        {significantFactors.map((factor, i) => (
          <div key={i} className="flex items-center justify-between text-[10px]">
            <span className="text-gray-300">{factor.name}</span>
            <span className={`font-mono ${
              factor.favoredTeam === 'home' ? 'text-blue-400' :
              factor.favoredTeam === 'away' ? 'text-orange-400' :
              'text-gray-400'
            }`}>
              {factor.impact !== 0 && (factor.impact > 0 ? '+' : '')}{factor.impact.toFixed(1)}
              {factor.favoredTeam !== 'neutral' && ` ${factor.favoredTeam === 'home' ? 'H' : 'A'}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// PREDICTIONS SUMMARY CARD (for top of page)
// ============================================

interface PredictionsSummaryProps {
  predictions: Array<{
    prediction: GamePrediction
    valueBets: ValueBet[]
    gameId: string
    gameTime: string
  }>
  sport: 'nba' | 'nfl'
}

export function PredictionsSummary({ predictions, sport }: PredictionsSummaryProps) {
  // Filter to high confidence picks and value bets
  const highConfidence = predictions.filter(p => p.prediction.confidence === 'high')
  const allValueBets = predictions.flatMap(p => p.valueBets).sort((a, b) => b.edge - a.edge)
  const topValueBets = allValueBets.slice(0, 5)

  if (highConfidence.length === 0 && topValueBets.length === 0) {
    return null
  }

  return (
    <div className="glass-card rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <h3 className="text-lg font-bold text-white">{sport.toUpperCase()} Predictions Summary</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* High Confidence Picks */}
        {highConfidence.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              High Confidence Picks
            </h4>
            <div className="space-y-2">
              {highConfidence.slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded">
                  <span className="text-white font-medium">{p.prediction.predictedWinner}</span>
                  <span className="text-green-400 font-mono">{p.prediction.winProbability}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Value Bets */}
        {topValueBets.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Top Value Bets
            </h4>
            <div className="space-y-2">
              {topValueBets.map((bet, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded">
                  <span className="text-white font-medium">{bet.recommendation}</span>
                  <span className={`font-mono font-bold ${getEdgeColor(bet.edge)}`}>+{bet.edge}pt</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-500 mt-3">
        Predictions based on power ratings, recent form, injuries, rest, and historical performance.
        Always gamble responsibly.
      </p>
    </div>
  )
}
