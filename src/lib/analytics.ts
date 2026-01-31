/**
 * Analytics utility for tracking user interactions
 * Uses Vercel Analytics for event tracking
 */
import { track } from '@vercel/analytics'

// Event categories for organized tracking
export type EventCategory =
  | 'navigation'
  | 'betting'
  | 'sports'
  | 'user'
  | 'conversion'
  | 'engagement'

// Predefined events for consistent tracking
export const AnalyticsEvents = {
  // Navigation events
  PAGE_VIEW: 'page_view',
  NAV_CLICK: 'nav_click',
  CTA_CLICK: 'cta_click',

  // Sports interaction events
  SPORT_SELECTED: 'sport_selected',
  TEAM_VIEWED: 'team_viewed',
  PLAYER_VIEWED: 'player_viewed',
  GAME_VIEWED: 'game_viewed',

  // Betting events
  ODDS_VIEWED: 'odds_viewed',
  BET_TYPE_SELECTED: 'bet_type_selected',
  ODDS_COMPARISON_VIEWED: 'odds_comparison_viewed',
  ALERT_CREATED: 'alert_created',
  ALERT_TRIGGERED: 'alert_triggered',

  // Conversion events
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  PRICING_VIEWED: 'pricing_viewed',
  CHECKOUT_STARTED: 'checkout_started',
  SUBSCRIPTION_COMPLETED: 'subscription_completed',

  // Engagement events
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  NEWS_ARTICLE_CLICKED: 'news_article_clicked',
  EXTERNAL_LINK_CLICKED: 'external_link_clicked',
} as const

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents]

// Interface for event properties
interface EventProperties {
  category?: EventCategory
  label?: string
  value?: number
  sport?: 'NBA' | 'NFL' | 'MLB' | 'NHL'
  teamId?: string
  teamName?: string
  playerId?: string
  playerName?: string
  gameId?: string
  betType?: 'spread' | 'moneyline' | 'total' | 'prop'
  page?: string
  [key: string]: string | number | boolean | undefined
}

/**
 * Track a custom event with properties
 */
export function trackEvent(
  eventName: AnalyticsEvent | string,
  properties?: EventProperties
): void {
  try {
    track(eventName, properties as Record<string, string | number | boolean>)
  } catch (error) {
    // Silently fail in development or if analytics fails to load
    console.debug('[Analytics] Event tracking error:', error)
  }
}

/**
 * Track navigation click
 */
export function trackNavClick(destination: string, source?: string): void {
  trackEvent(AnalyticsEvents.NAV_CLICK, {
    category: 'navigation',
    label: destination,
    source,
  })
}

/**
 * Track sport selection
 */
export function trackSportSelected(sport: 'NBA' | 'NFL' | 'MLB' | 'NHL'): void {
  trackEvent(AnalyticsEvents.SPORT_SELECTED, {
    category: 'sports',
    sport,
  })
}

/**
 * Track team view
 */
export function trackTeamViewed(
  sport: 'NBA' | 'NFL',
  teamId: string,
  teamName: string
): void {
  trackEvent(AnalyticsEvents.TEAM_VIEWED, {
    category: 'sports',
    sport,
    teamId,
    teamName,
  })
}

/**
 * Track player view
 */
export function trackPlayerViewed(playerId: string, playerName: string): void {
  trackEvent(AnalyticsEvents.PLAYER_VIEWED, {
    category: 'sports',
    playerId,
    playerName,
  })
}

/**
 * Track game view
 */
export function trackGameViewed(
  sport: 'NBA' | 'NFL',
  gameId: string,
  homeTeam: string,
  awayTeam: string
): void {
  trackEvent(AnalyticsEvents.GAME_VIEWED, {
    category: 'sports',
    sport,
    gameId,
    label: `${awayTeam} @ ${homeTeam}`,
  })
}

/**
 * Track odds page view
 */
export function trackOddsViewed(sport?: 'NBA' | 'NFL'): void {
  trackEvent(AnalyticsEvents.ODDS_VIEWED, {
    category: 'betting',
    sport,
  })
}

/**
 * Track bet type selection
 */
export function trackBetTypeSelected(
  betType: 'spread' | 'moneyline' | 'total' | 'prop'
): void {
  trackEvent(AnalyticsEvents.BET_TYPE_SELECTED, {
    category: 'betting',
    betType,
  })
}

/**
 * Track alert creation
 */
export function trackAlertCreated(alertType: string): void {
  trackEvent(AnalyticsEvents.ALERT_CREATED, {
    category: 'betting',
    label: alertType,
  })
}

/**
 * Track pricing page view
 */
export function trackPricingViewed(): void {
  trackEvent(AnalyticsEvents.PRICING_VIEWED, {
    category: 'conversion',
  })
}

/**
 * Track checkout start
 */
export function trackCheckoutStarted(plan: string): void {
  trackEvent(AnalyticsEvents.CHECKOUT_STARTED, {
    category: 'conversion',
    label: plan,
  })
}

/**
 * Track search
 */
export function trackSearch(query: string, resultCount?: number): void {
  trackEvent(AnalyticsEvents.SEARCH_PERFORMED, {
    category: 'engagement',
    label: query,
    value: resultCount,
  })
}

/**
 * Track CTA click
 */
export function trackCTAClick(ctaName: string, page?: string): void {
  trackEvent(AnalyticsEvents.CTA_CLICK, {
    category: 'conversion',
    label: ctaName,
    page,
  })
}

/**
 * Track news article click
 */
export function trackNewsClick(articleTitle: string, source?: string): void {
  trackEvent(AnalyticsEvents.NEWS_ARTICLE_CLICKED, {
    category: 'engagement',
    label: articleTitle,
    source,
  })
}
