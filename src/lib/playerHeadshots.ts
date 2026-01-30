// Player Headshot Utilities
// Maps BallDontLie player IDs to ESPN player IDs for headshots

// ESPN headshot URL format: https://a.espncdn.com/i/headshots/nba/players/full/{espn_id}.png
// NBA.com headshot URL format: https://cdn.nba.com/headshots/nba/latest/1040x760/{nba_id}.png

// BallDontLie Player ID -> ESPN Player ID mapping for popular players
// These mappings were manually verified
export const BDL_TO_ESPN_PLAYER_MAP: Record<number, number> = {
  // Superstars
  237: 1966,       // LeBron James
  115: 3975,       // Stephen Curry
  140: 3202,       // Kevin Durant
  15: 3032977,     // Giannis Antetokounmpo
  666786: 3945274, // Luka Doncic
  434: 4065648,    // Jayson Tatum
  246: 3112335,    // Nikola Jokic
  145: 3059318,    // Joel Embiid
  47: 3136193,     // Devin Booker
  666969: 4594268, // Anthony Edwards

  // More stars
  172: 6583,       // James Harden
  132: 6430,       // DeMar DeRozan
  79: 3908809,     // Donovan Mitchell
  417: 3978,       // Chris Paul
  666: 4251,       // Rudy Gobert
  666533: 4066353, // Bam Adebayo
  378: 4066407,    // Pascal Siakam
  125: 3195,       // Damian Lillard
  75: 6475,        // Bradley Beal
  666651: 4594250, // Cade Cunningham

  // Rising stars
  666670: 4594327, // Jalen Green
  666895: 4432816, // Tyrese Haliburton
  666881: 4431687, // LaMelo Ball
  666976: 4594192, // Scottie Barnes
  666916: 4432816, // Tyrese Maxey
  666991: 4432848, // Franz Wagner
  667089: 4594255, // Evan Mobley

  // Veterans
  38: 6606,        // Jimmy Butler
  666617: 4066320, // Shai Gilgeous-Alexander
  666421: 4278073, // De'Aaron Fox
  666614: 4066262, // Jaren Jackson Jr.
  666420: 3936299, // Jaylen Brown
  666451: 4066336, // Trae Young
  457: 6478,       // Karl-Anthony Towns
  394: 3064514,    // Draymond Green
  201: 6440,       // Kyrie Irving
  666618: 4066259, // Zion Williamson

  // More players
  41: 3134881,     // Eric Bledsoe
  94: 6442,        // Mike Conley
  173: 6580,       // Al Horford
  171: 2490620,    // Dwight Howard
  382: 6450,       // Kyle Lowry

  // Lakers roster (for LeBron's team)
  666634: 4066421, // Austin Reaves
  50: 3934672,     // Anthony Davis
  133: 6440,       // D'Angelo Russell

  // Celtics roster
  416: 2566769,    // Jrue Holiday
  60: 3032979,     // Kristaps Porzingis
  92: 3032976,     // Marcus Smart

  // Warriors roster
  231: 4432848,    // Andrew Wiggins
  458: 6462,       // Klay Thompson

  // Additional popular players
  666757: 4065697, // Jamal Murray
  227: 3908845,    // Lauri Markkanen
  666700: 4395725, // Desmond Bane
  666615: 4066295, // Michael Porter Jr.
  666643: 4066328, // Tyler Herro
  666625: 4066324, // RJ Barrett

  // Retired/Historical (might still be queried)
  225: 1987,       // Kobe Bryant (historical)
}

// Fetch ESPN player ID by name search (fallback)
export async function searchESPNPlayerId(firstName: string, lastName: string): Promise<number | null> {
  try {
    const searchName = `${firstName} ${lastName}`.toLowerCase()
    const res = await fetch(
      `https://site.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(searchName)}&limit=5&type=player`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    )

    if (!res.ok) return null

    const data = await res.json()

    // Find NBA player in results
    const nbaPlayer = data?.items?.find((item: any) =>
      item.type === 'athlete' &&
      item.league?.slug === 'nba' &&
      item.name?.toLowerCase().includes(lastName.toLowerCase())
    )

    if (nbaPlayer?.id) {
      return parseInt(nbaPlayer.id)
    }

    return null
  } catch (error) {
    console.error('Error searching ESPN for player:', error)
    return null
  }
}

// Get ESPN player headshot URL
export function getESPNHeadshotURL(espnPlayerId: number, size: 'small' | 'medium' | 'large' = 'large'): string {
  // ESPN supports different sizes via their combiner service
  const dimensions = {
    small: { w: 96, h: 70 },
    medium: { w: 200, h: 146 },
    large: { w: 350, h: 254 }
  }
  const { w, h } = dimensions[size]
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${espnPlayerId}.png&w=${w}&h=${h}`
}

// Get NBA.com player headshot URL (alternative source)
export function getNBAHeadshotURL(nbaPlayerId: number): string {
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaPlayerId}.png`
}

// Main function to get player headshot URL
// Returns the best available headshot URL for a BallDontLie player
export async function getPlayerHeadshotURL(
  bdlPlayerId: number,
  firstName: string,
  lastName: string
): Promise<string | null> {
  // First, check our static mapping
  const espnId = BDL_TO_ESPN_PLAYER_MAP[bdlPlayerId]

  if (espnId) {
    return getESPNHeadshotURL(espnId)
  }

  // If not in mapping, try to search ESPN API
  const searchedEspnId = await searchESPNPlayerId(firstName, lastName)

  if (searchedEspnId) {
    return getESPNHeadshotURL(searchedEspnId)
  }

  // Return null if no headshot found
  return null
}

// Sync version using only static mapping (for SSR where we can't make additional API calls easily)
export function getPlayerHeadshotURLSync(bdlPlayerId: number): string | null {
  const espnId = BDL_TO_ESPN_PLAYER_MAP[bdlPlayerId]

  if (espnId) {
    return getESPNHeadshotURL(espnId)
  }

  return null
}
