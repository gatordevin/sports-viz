'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

/**
 * Analytics Provider Component
 *
 * Includes:
 * - Vercel Analytics for page views and custom events
 * - Vercel Speed Insights for performance monitoring
 *
 * This component should be included in the root layout.
 */
export function AnalyticsProvider() {
  return (
    <>
      <Analytics
        mode="production"
        debug={process.env.NODE_ENV === 'development'}
      />
      <SpeedInsights />
    </>
  )
}
