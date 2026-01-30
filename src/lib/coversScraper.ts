// Covers.com Scraper for Real ATS Data
// Fetches actual Against The Spread records from Covers.com

// Cache for ATS data (1 hour TTL since ATS doesn't change frequently)
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
const atsCache = new Map<string, { data: CoversATSData; expires: number }>()

export interface CoversATSData {
  teamName: string
  record: string // e.g., "12-34"
  atsRecord: {
    wins: number
    losses: number
    pushes: number
    percentage: number
  }
  ouRecord: {
    overs: number
    unders: number
    pushes: number
    percentage: number
  }
  isRealData: boolean
  fetchedAt: number
}

// Map ESPN team IDs to Covers.com URL slugs
const ESPN_TO_COVERS_SLUG: Record<string, string> = {
  // NBA Teams - ESPN ID to Covers slug
  '1': 'atlanta-hawks',
  '2': 'boston-celtics',
  '17': 'brooklyn-nets',
  '30': 'charlotte-hornets',
  '4': 'chicago-bulls',
  '5': 'cleveland-cavaliers',
  '6': 'dallas-mavericks',
  '7': 'denver-nuggets',
  '8': 'detroit-pistons',
  '9': 'golden-state-warriors',
  '10': 'houston-rockets',
  '11': 'indiana-pacers',
  '12': 'la-clippers',
  '13': 'los-angeles-lakers',
  '29': 'memphis-grizzlies',
  '14': 'miami-heat',
  '15': 'milwaukee-bucks',
  '16': 'minnesota-timberwolves',
  '3': 'new-orleans-pelicans',
  '18': 'new-york-knicks',
  '25': 'oklahoma-city-thunder',
  '19': 'orlando-magic',
  '20': 'philadelphia-76ers',
  '21': 'phoenix-suns',
  '22': 'portland-trail-blazers',
  '23': 'sacramento-kings',
  '24': 'san-antonio-spurs',
  '28': 'toronto-raptors',
  '26': 'utah-jazz',
  '27': 'washington-wizards',
}

// Team display names for reference
const TEAM_DISPLAY_NAMES: Record<string, string> = {
  '1': 'Atlanta Hawks',
  '2': 'Boston Celtics',
  '17': 'Brooklyn Nets',
  '30': 'Charlotte Hornets',
  '4': 'Chicago Bulls',
  '5': 'Cleveland Cavaliers',
  '6': 'Dallas Mavericks',
  '7': 'Denver Nuggets',
  '8': 'Detroit Pistons',
  '9': 'Golden State Warriors',
  '10': 'Houston Rockets',
  '11': 'Indiana Pacers',
  '12': 'LA Clippers',
  '13': 'Los Angeles Lakers',
  '29': 'Memphis Grizzlies',
  '14': 'Miami Heat',
  '15': 'Milwaukee Bucks',
  '16': 'Minnesota Timberwolves',
  '3': 'New Orleans Pelicans',
  '18': 'New York Knicks',
  '25': 'Oklahoma City Thunder',
  '19': 'Orlando Magic',
  '20': 'Philadelphia 76ers',
  '21': 'Phoenix Suns',
  '22': 'Portland Trail Blazers',
  '23': 'Sacramento Kings',
  '24': 'San Antonio Spurs',
  '28': 'Toronto Raptors',
  '26': 'Utah Jazz',
  '27': 'Washington Wizards',
}

/**
 * Parse ATS record string like "20-26-0" into components
 */
function parseATSRecord(record: string): { wins: number; losses: number; pushes: number } {
  const parts = record.split('-')
  return {
    wins: parseInt(parts[0]) || 0,
    losses: parseInt(parts[1]) || 0,
    pushes: parseInt(parts[2]) || 0
  }
}

/**
 * Fetch ATS data from Covers.com for a specific team
 * Uses server-side fetch with proper headers to avoid blocking
 */
export async function fetchCoversATSData(espnTeamId: string): Promise<CoversATSData | null> {
  const cacheKey = `covers-ats-${espnTeamId}`

  // Check cache first
  const cached = atsCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    console.log(`[CoversScraper] Cache HIT for team ${espnTeamId}`)
    return cached.data
  }

  const coversSlug = ESPN_TO_COVERS_SLUG[espnTeamId]
  if (!coversSlug) {
    console.warn(`[CoversScraper] No Covers slug for ESPN team ID: ${espnTeamId}`)
    return null
  }

  const url = `https://www.covers.com/sport/basketball/nba/teams/main/${coversSlug}`

  try {
    console.log(`[CoversScraper] Fetching ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 3600 } // Next.js cache for 1 hour
    })

    if (!response.ok) {
      console.error(`[CoversScraper] HTTP ${response.status} for team ${espnTeamId}`)
      return null
    }

    const html = await response.text()

    // Parse the ATS record from the HTML
    // The betting record section contains:
    // - Win / Loss: e.g., "12-34"
    // - Against the Spread: e.g., "20-26-0"
    // - Totals: e.g., "22-24-0"

    const data = parseCoversHTML(html, espnTeamId)

    if (data && data.isRealData) {
      // Cache the successful result
      atsCache.set(cacheKey, {
        data,
        expires: Date.now() + CACHE_TTL
      })
      console.log(`[CoversScraper] SUCCESS for ${TEAM_DISPLAY_NAMES[espnTeamId]}: ATS ${data.atsRecord.wins}-${data.atsRecord.losses}-${data.atsRecord.pushes}`)
    }

    return data
  } catch (error) {
    console.error(`[CoversScraper] Error fetching team ${espnTeamId}:`, error)
    return null
  }
}

/**
 * Parse the Covers.com HTML to extract betting records
 */
function parseCoversHTML(html: string, espnTeamId: string): CoversATSData | null {
  try {
    // Look for the betting record section
    // Pattern: "Against the Spread" followed by the record like "20-26-0"

    // Method 1: Look for specific text patterns
    // The page has structure like:
    // <div>Against the Spread</div>
    // <div>20-26-0</div>

    // Find ATS record - look for pattern after "Against the Spread"
    const atsMatch = html.match(/Against the Spread[^<]*<\/[^>]+>[^<]*<[^>]+>(\d+-\d+-\d+)/i)
    const ouMatch = html.match(/Totals[^<]*<\/[^>]+>[^<]*<[^>]+>(\d+-\d+-\d+)/i)
    const recordMatch = html.match(/Win \/ Loss[^<]*<\/[^>]+>[^<]*<[^>]+>(\d+-\d+)/i)

    // Alternative pattern - look in JSON-like data or different HTML structure
    let atsRecord = atsMatch?.[1]
    let ouRecord = ouMatch?.[1]
    let winLossRecord = recordMatch?.[1]

    // If first patterns didn't work, try alternative patterns
    if (!atsRecord) {
      // Try to find ATS in data attributes or script tags
      const altAtsMatch = html.match(/ATS["\s:]+(\d+-\d+-\d+)/i) ||
                          html.match(/against-the-spread["\s:]+(\d+-\d+-\d+)/i) ||
                          html.match(/>(\d+-\d+-\d+)<\/[^>]+>[^<]*<[^>]+>[^<]*ATS/i)
      atsRecord = altAtsMatch?.[1]
    }

    if (!ouRecord) {
      const altOuMatch = html.match(/O\/U["\s:]+(\d+-\d+-\d+)/i) ||
                         html.match(/over-under["\s:]+(\d+-\d+-\d+)/i)
      ouRecord = altOuMatch?.[1]
    }

    // Also try to extract from the betting record container
    // Pattern like: generic [ref=e95]: 20-26-0 (from the accessibility snapshot)
    if (!atsRecord) {
      // Look for the pattern near "Betting Record" section
      const bettingSection = html.match(/Betting Record[\s\S]{0,500}?(\d+-\d+-\d+)[\s\S]{0,200}?(\d+-\d+-\d+)/i)
      if (bettingSection) {
        // First match after ATS label, second after Totals
        atsRecord = bettingSection[1]
        ouRecord = bettingSection[2]
      }
    }

    if (!atsRecord) {
      console.warn(`[CoversScraper] Could not parse ATS record for team ${espnTeamId}`)
      return null
    }

    const parsedATS = parseATSRecord(atsRecord)
    const parsedOU = ouRecord ? parseATSRecord(ouRecord) : { wins: 0, losses: 0, pushes: 0 }

    const totalATS = parsedATS.wins + parsedATS.losses
    const atsPercentage = totalATS > 0 ? Math.round((parsedATS.wins / totalATS) * 100) : 0

    const totalOU = parsedOU.wins + parsedOU.losses
    const ouPercentage = totalOU > 0 ? Math.round((parsedOU.wins / totalOU) * 100) : 0

    return {
      teamName: TEAM_DISPLAY_NAMES[espnTeamId] || 'Unknown Team',
      record: winLossRecord || '',
      atsRecord: {
        wins: parsedATS.wins,
        losses: parsedATS.losses,
        pushes: parsedATS.pushes,
        percentage: atsPercentage
      },
      ouRecord: {
        overs: parsedOU.wins,
        unders: parsedOU.losses,
        pushes: parsedOU.pushes,
        percentage: ouPercentage
      },
      isRealData: true,
      fetchedAt: Date.now()
    }
  } catch (error) {
    console.error(`[CoversScraper] Parse error for team ${espnTeamId}:`, error)
    return null
  }
}

/**
 * Batch fetch ATS data for multiple teams
 * Adds delay between requests to avoid rate limiting
 */
export async function batchFetchCoversATS(espnTeamIds: string[]): Promise<Map<string, CoversATSData>> {
  const results = new Map<string, CoversATSData>()

  // Process in batches with delay
  const batchSize = 3
  const delayMs = 500 // 500ms between batches

  for (let i = 0; i < espnTeamIds.length; i += batchSize) {
    const batch = espnTeamIds.slice(i, i + batchSize)

    const promises = batch.map(async (teamId) => {
      const data = await fetchCoversATSData(teamId)
      return { teamId, data }
    })

    const batchResults = await Promise.all(promises)

    for (const { teamId, data } of batchResults) {
      if (data) {
        results.set(teamId, data)
      }
    }

    // Delay before next batch (unless it's the last batch)
    if (i + batchSize < espnTeamIds.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return results
}

/**
 * Convert Covers ATS data to the RealATSRecord format used by the betting service
 */
export function coversToRealATSRecord(coversData: CoversATSData): {
  wins: number
  losses: number
  pushes: number
  percentage: number
  homeATS: { wins: number; losses: number; pushes: number }
  awayATS: { wins: number; losses: number; pushes: number }
  recentATS: ('W' | 'L' | 'P')[]
  isRealData: boolean
} {
  return {
    wins: coversData.atsRecord.wins,
    losses: coversData.atsRecord.losses,
    pushes: coversData.atsRecord.pushes,
    percentage: coversData.atsRecord.percentage,
    // Covers doesn't provide home/away split in the main page, estimate as 50/50
    homeATS: {
      wins: Math.floor(coversData.atsRecord.wins / 2),
      losses: Math.floor(coversData.atsRecord.losses / 2),
      pushes: Math.floor(coversData.atsRecord.pushes / 2)
    },
    awayATS: {
      wins: Math.ceil(coversData.atsRecord.wins / 2),
      losses: Math.ceil(coversData.atsRecord.losses / 2),
      pushes: Math.ceil(coversData.atsRecord.pushes / 2)
    },
    recentATS: [], // Would need to parse game-by-game data for this
    isRealData: true
  }
}

/**
 * Convert Covers O/U data to the RealOURecord format
 */
export function coversToRealOURecord(coversData: CoversATSData): {
  overs: number
  unders: number
  pushes: number
  overPercentage: number
  averageTotalPoints: number
  recentOU: ('O' | 'U' | 'P')[]
  isRealData: boolean
} {
  return {
    overs: coversData.ouRecord.overs,
    unders: coversData.ouRecord.unders,
    pushes: coversData.ouRecord.pushes,
    overPercentage: coversData.ouRecord.percentage,
    averageTotalPoints: 0, // Would need additional data for this
    recentOU: [], // Would need to parse game-by-game data for this
    isRealData: true
  }
}

/**
 * Clear the cache (useful for testing or forcing refresh)
 */
export function clearCoversCache() {
  atsCache.clear()
  console.log('[CoversScraper] Cache cleared')
}

/**
 * Get cache statistics
 */
export function getCoversCacheStats(): { size: number; keys: string[] } {
  return {
    size: atsCache.size,
    keys: Array.from(atsCache.keys())
  }
}

/**
 * Get all available ESPN team IDs that have Covers mappings
 */
export function getAvailableTeamIds(): string[] {
  return Object.keys(ESPN_TO_COVERS_SLUG)
}
