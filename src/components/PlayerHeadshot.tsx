'use client'

import { useState } from 'react'
import Image from 'next/image'

interface PlayerHeadshotProps {
  src: string | null
  firstName: string
  lastName: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const sizeClasses = {
  small: 'w-10 h-10 text-sm',
  medium: 'w-16 h-16 sm:w-20 sm:h-20 text-xl',
  large: 'w-32 h-32 sm:w-40 sm:h-40 text-3xl'
}

export default function PlayerHeadshot({
  src,
  firstName,
  lastName,
  size = 'large',
  className = ''
}: PlayerHeadshotProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`
  const sizeClass = sizeClasses[size]

  // Show initials if no src provided or image failed to load
  const showInitials = !src || imageError

  return (
    <div className={`relative flex-shrink-0 rounded-full overflow-hidden bg-gray-800 ring-4 ring-primary/20 ${sizeClass} ${className}`}>
      {/* Initials as fallback/background */}
      <div className={`absolute inset-0 flex items-center justify-center font-bold text-gray-500 ${showInitials ? 'opacity-100' : 'opacity-100'}`}>
        {initials}
      </div>

      {/* Player headshot - will overlay initials if loads successfully */}
      {src && !imageError && (
        <Image
          src={src}
          alt={`${firstName} ${lastName}`}
          fill
          className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          unoptimized
        />
      )}
    </div>
  )
}
