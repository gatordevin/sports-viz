// Unified Betting Data Service
// Provides a multi-source fallback chain for betting statistics
// Sources: Covers.com (primary) -> null (never fake data)

import { ATSRecord, OURecord, RestInfo, calculateRestInfo } from './bettingStats'
import { RealATSRecord, RealOURecord } from './realBettingStats'
import { fetchCoversATSData, coversToRealATSRecord, coversToRealOURecord } from './coversScraper'
import { RecentGame } from './espn'

// Data source tracking for transparency
export type DataSource = 'covers' | 'balldontlie' | 'odds-api' | 'simulated' | 'unavailable'

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
 * 1. Covers.com (real ATS data scraped from their website) - NBA only
 * 2. Return null with 'unavailable' source (NEVER fake data)
 *
 * We no longer use simulated data as it produces inaccurate results.
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

  // === ATS RECORD & O/U RECORD ===
  // Use Covers.com as the PRIMARY source (NBA only)
  if (sport === 'nba') {
    try {
      const coversData = await fetchCoversATSData(espnTeamId)
      if (coversData && coversData.isRealData) {
        // Convert Covers data to our format
        const realATS = coversToRealATSRecord(coversData)
        const realOU = coversToRealOURecord(coversData)

        if (realATS.wins + realATS.losses > 0) {
          result.atsRecord = {
            data: realATS,
            source: 'covers',
            isReal: true,
            timestamp: now
          }
          logDataFetch('covers', espnTeamId, true)
        }

        if (realOU.overs + realOU.unders > 0) {
          result.ouRecord = {
            data: realOU,
            source: 'covers',
            isReal: true,
            timestamp: now
          }
        }
      } else {
        logDataFetch('covers', espnTeamId, false, 'No data returned or failed to scrape')
      }
    } catch (error) {
      logDataFetch('covers', espnTeamId, false, String(error))
    }
  }

  // NOTE: We no longer fall back to simulated data as it produces wildly inaccurate results
  // (e.g., showing Wizards as 12-3 ATS when they're actually 20-26 ATS)
  // If Covers.com fails, we simply return null/unavailable

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
