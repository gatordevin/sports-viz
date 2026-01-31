'use client'

import { useState, Suspense, useEffect } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { trackPricingViewed, trackCheckoutStarted, trackEvent, AnalyticsEvents } from '@/lib/analytics'

const features = {
  free: [
    'Live NBA & NFL scores',
    'Team standings & stats',
    'Basic player information',
    'Mobile responsive design',
  ],
  pro: [
    'Everything in Free',
    'Live betting odds from 10+ sportsbooks',
    'Line movement tracking',
    'Best odds finder',
    'Spread & totals analysis',
    'Historical odds data',
    'Custom alerts (coming soon)',
    'API access (coming soon)',
  ],
}

function CanceledBanner() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')

  if (!canceled) return null

  return (
    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
      <p className="text-yellow-400">
        Checkout was canceled. Feel free to try again when you&apos;re ready!
      </p>
    </div>
  )
}

export default function PricingPage() {
  const { isSignedIn, isLoaded } = useUser()
  const [loading, setLoading] = useState(false)

  // Track pricing page view on mount
  useEffect(() => {
    trackPricingViewed()
  }, [])

  const handleSubscribe = async () => {
    if (!isSignedIn) return

    // Track checkout started
    trackCheckoutStarted('pro_monthly')

    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get access to live betting odds and advanced analytics with StatFlow Pro
          </p>
          <Suspense fallback={null}>
            <CanceledBanner />
          </Suspense>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="glass-card rounded-2xl p-8 border border-white/10">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <p className="text-gray-400">Perfect for casual fans</p>
            </div>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$0</span>
              <span className="text-gray-400 ml-2">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {features.free.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className="w-full py-3 px-6 rounded-lg font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors"
              disabled
            >
              Current Plan
            </button>
          </div>

          {/* Pro Tier */}
          <div className="glass-card rounded-2xl p-8 border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
              POPULAR
            </div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <p className="text-gray-400">For serious bettors & analysts</p>
            </div>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$9.99</span>
              <span className="text-gray-400 ml-2">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {features.pro.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            {isLoaded && !isSignedIn ? (
              <SignInButton mode="modal">
                <button
                  onClick={() => trackEvent(AnalyticsEvents.SIGNUP_STARTED, { category: 'conversion', label: 'pricing_page' })}
                  className="w-full py-3 px-6 rounded-lg font-semibold bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity"
                >
                  Sign In to Subscribe
                </button>
              </SignInButton>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full py-3 px-6 rounded-lg font-semibold bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Subscribe Now'}
              </button>
            )}
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-400">
            All plans include a 7-day money-back guarantee. Cancel anytime.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Questions? Contact us at support@statflow.app
          </p>
        </div>
      </div>
    </div>
  )
}
