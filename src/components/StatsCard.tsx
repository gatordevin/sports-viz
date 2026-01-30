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
    <div className="glass rounded-xl p-6 hover:bg-white/[0.08] transition-all duration-300 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-lg bg-white/5">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
