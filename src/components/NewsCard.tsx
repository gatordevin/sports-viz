'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ESPNNews } from '@/lib/espn'

interface NewsCardProps {
  article: ESPNNews
  compact?: boolean
}

function formatTimeAgo(dateString: string, mounted: boolean): string {
  // Return placeholder until client-side hydration to avoid mismatch
  if (!mounted) {
    return '...'
  }
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `${diffMins}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function NewsCard({ article, compact = false }: NewsCardProps) {
  const [mounted, setMounted] = useState(false)
  const imageUrl = article.images?.[0]?.url
  const link = article.links?.[0]?.href || '#'

  useEffect(() => {
    setMounted(true)
  }, [])

  if (compact) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block py-3 px-4 glass rounded-lg hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-start space-x-3">
          {imageUrl && (
            <div className="w-16 h-16 relative flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt={article.headline}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-white line-clamp-2 group-hover:text-primary transition-colors">
              {article.headline}
            </h4>
            <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(article.published, mounted)}</p>
          </div>
        </div>
      </a>
    )
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block glass rounded-xl overflow-hidden hover:bg-white/[0.08] transition-all duration-300 group animate-fade-in"
    >
      {imageUrl && (
        <div className="relative w-full h-40 sm:h-48">
          <Image
            src={imageUrl}
            alt={article.headline}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
        </div>
      )}
      <div className="p-4 sm:p-5">
        <div className="flex items-center space-x-2 mb-2">
          {article.categories?.slice(0, 2).map((cat, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded"
            >
              {cat.description}
            </span>
          ))}
          <span className="text-xs text-gray-500">{formatTimeAgo(article.published, mounted)}</span>
        </div>
        <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {article.headline}
        </h3>
        {article.description && (
          <p className="text-sm text-gray-400 line-clamp-2">{article.description}</p>
        )}
      </div>
    </a>
  )
}

// Compact news list component
export function NewsList({ articles, title }: { articles: ESPNNews[], title?: string }) {
  if (articles.length === 0) return null

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5">
      {title && (
        <h3 className="font-bold text-lg text-white mb-4 flex items-center space-x-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <span>{title}</span>
        </h3>
      )}
      <div className="space-y-2">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} compact />
        ))}
      </div>
    </div>
  )
}
