'use client'

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
}

export default function StatsCard({ title, value, change, changeType = 'neutral', icon }: StatsCardProps) {
  const changeColors = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400',
  }

  return (
    <div className="glass rounded-xl p-4 sm:p-6 hover:bg-white/[0.08] transition-all duration-300 animate-slide-up min-h-[100px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-400 mb-1 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
          {change && (
            <p className={`text-xs sm:text-sm mt-1.5 sm:mt-2 truncate ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 sm:p-3 rounded-lg bg-white/5 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
