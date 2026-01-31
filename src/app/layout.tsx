import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import './globals.css'
import Navigation from '@/components/Navigation'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StatFlow | Professional Sports Analytics',
  description: 'Real-time sports data, analytics, and visualizations for fantasy leagues and sports betting',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#10b981',
          colorBackground: '#0a0a0f',
          colorInputBackground: '#1a1a24',
          colorInputText: '#ffffff',
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} bg-dark-900 text-white`} suppressHydrationWarning>
          <Navigation />
          <main className="min-h-screen pt-16">
            {children}
          </main>
          <AnalyticsProvider />
        </body>
      </html>
    </ClerkProvider>
  )
}
