// Unified Betting Data Service
// Provides a multi-source fallback chain for betting statistics
// Sources: BallDontLie API (primary) -> The Odds API (secondary) -> null (never fake data)

import { ATSRecord, OURecord, RestInfo, calculateATSRecord, calculateOURecord, calculateRestInfo } from './bettingStats'
import { calculateRealATSRecord, calculateRealOURecord, RealATSRecord, RealOURecord } from './realBettingStats'
import { RecentGame } from './espn'

// Data source tracking for transparency
export type DataSource = 'balldontlie' | 'odds-api' | 'simulated' | 'unavailable'

export interface BettingDataResult<T> {
  data: T | null
  source: DataSource
  isReal: boolean
  timestamp: number
  error?: string
}

export interface TeamBettingData {
  atsRecord: BettingDataResult<ATSRecord | RealATSRecord>
  ouRecord: BettingDataResult<OURecord | RealOURecord>
  restInfo: BettingDataResult<RestInfo>
}

// In-memory cache with TTL (5 minutes for betting data)
const CACHE_TTL = 5 * 60 * 1000
const dataCache = new Map<string, { data: TeamBettingData; expires: number }>()

/**
 * Log data fetch attempts for debugging/monitoring
 */
function logDataFetch(source: DataSource, teamId: string, success: boolean, error?: string) {
  const status = success ? 'SUCCESS' : 'FAILED'
  const errorMsg = error ? ` - ${error}` : ''
  console.log(`[BettingDataService] ${source} for team ${teamId}: ${status}${errorMsg}`)
}

/**
 * Check if cached data is still valid
 */
function getCachedData(cacheKey: string): TeamBettingData | null {
  const cached = dataCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    console.log(`[BettingDataService] Cache HIT for ${cacheKey}`)
    return cached.data
  }
  return null
}

/**
 * Store data in cache
 */
function cacheData(cacheKey: string, data: TeamBettingData) {
  dataCache.set(cacheKey, {
    data,
    expires: Date.now() + CACHE_TTL
  })
}

/**
 * Get betting data for a team with multi-source fallback
 *
 * Priority:
 * 1. BallDontLie API (real historical spreads) - NBA only
 * 2. Simulated from game results (if recent games available)
 * 3. Return null with 'unavailable' source (NEVER fake data)
 */
export async function getTeamBettingData(
  sport: 'nba' | 'nfl',
  espnTeamId: string,
  recentGames: RecentGame[],
  nextGameDate: Date
): Promise<TeamBettingData> {
  const cacheKey = `${sport}-${espnTeamId}`

  // Check cache first
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached
  }

  const now = Date.now()
  const result: TeamBettingData = {
    atsRecord: { data: null, source: 'unavailable', isReal: false, timestamp: now },
    ouRecord: { data: null, source: 'unavailable', isReal: false, timestamp: now },
    restInfo: { data: null, source: 'unavailable', isReal: false, timestamp: now }
  }

  // === ATS RECORD ===
  // Try BallDontLie first (NBA only - they have real betting data)
  if (sport === 'nba') {
    try {
      const realATS = await calculateRealATSRecord(espnTeamId, 15)
      if (realATS.isRealData && (realATS.wins + realATS.losses) > 0) {
        result.atsRecord = {
          data: realATS,
          source: 'balldontlie',
          isReal: true,
          timestamp: now
        }
        logDataFetch('balldontlie', espnTeamId, true)
      } else {
        logDataFetch('balldontlie', espnTeamId, false, 'No data returned')
      }
    } catch (error) {
      logDataFetch('balldontlie', espnTeamId, false, String(error))
    }
  }

  // Fallback to simulated ATS if BallDontLie didn't work
  if (!result.atsRecord.data && recentGames.length >= 3) {
    const simulatedATS = calculateATSRecord(recentGames)
    if (simulatedATS) {
      result.atsRecord = {
        data: simulatedATS,
        source: 'simulated',
        isReal: false,
        timestamp: now
      }
      logDataFetch('simulated', espnTeamId, true)
    }
  }

  // === O/U RECORD ===
  // Try BallDontLie first (NBA only)
  if (sport === 'nba') {
    try {
      const realOU = await calculateRealOURecord(espnTeamId, 15)
      if (realOU.isRealData && (realOU.overs + realOU.unders) > 0) {
        result.ouRecord = {
          data: realOU,
          source: 'balldontlie',
          isReal: true,
          timestamp: now
        }
        logDataFetch('balldontlie', espnTeamId, true)
      } else {
        logDataFetch('balldontlie', espnTeamId, false, 'No O/U data returned')
      }
    } catch (error) {
      logDataFetch('balldontlie', espnTeamId, false, String(error))
    }
  }

  // Fallback to simulated O/U
  if (!result.ouRecord.data && recentGames.length >= 3) {
    const simulatedOU = calculateOURecord(recentGames, sport)
    if (simulatedOU) {
      result.ouRecord = {
        data: simulatedOU,
        source: 'simulated',
        isReal: false,
        timestamp: now
      }
      logDataFetch('simulated', espnTeamId, true)
    }
  }

  // === REST INFO ===
  // This is always calculated from game schedule (no external API needed)
  if (recentGames.length > 0) {
    const restData = calculateRestInfo(recentGames, nextGameDate)
    if (restData) {
      result.restInfo = {
        data: restData,
        source: 'simulated', // Calculated from known game dates
        isReal: true, // Schedule data is real
        timestamp: now
      }
    }
  }

  // Cache the result
  cacheData(cacheKey, result)

  return result
}

/**
 * Batch fetch betting data for multiple teams
 * More efficient for loading multiple games at once
 */
export async function batchGetBettingData(
  sport: 'nba' | 'nfl',
  teams: Array<{ espnTeamId: string; recentGames: RecentGame[]; nextGameDate: Date }>
): Promise<Map<string, TeamBettingData>> {
  const results = new Map<string, TeamBettingData>()

  // Process in batches to avoid rate limits
  const batchSize = 4

  for (let i = 0; i < teams.length; i += batchSize) {
    const batch = teams.slice(i, i + batchSize)

    const promises = batch.map(async ({ espnTeamId, recentGames, nextGameDate }) => {
      const data = await getTeamBettingData(sport, espnTeamId, recentGames, nextGameDate)
      return { espnTeamId, data }
    })

    const batchResults = await Promise.all(promises)

    for (const { espnTeamId, data } of batchResults) {
      results.set(espnTeamId, data)
    }

    // Small delay between batches to be respectful to APIs
    if (i + batchSize < teams.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return results
}

/**
 * Get a summary of data source availability
 * Useful for debugging and status displays
 */
export function getDataSourceSummary(bettingData: TeamBettingData): {
  atsSource: DataSource
  ouSource: DataSource
  restSource: DataSource
  hasRealData: boolean
} {
  return {
    atsSource: bettingData.atsRecord.source,
    ouSource: bettingData.ouRecord.source,
    restSource: bettingData.restInfo.source,
    hasRealData: bettingData.atsRecord.isReal || bettingData.ouRecord.isReal
  }
}

/**
 * Clear the cache (useful for testing or forcing refresh)
 */
export function clearBettingDataCache() {
  dataCache.clear()
  console.log('[BettingDataService] Cache cleared')
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: dataCache.size,
    keys: Array.from(dataCache.keys())
  }
}
