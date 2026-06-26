import { cn, riskLevel } from '@/lib/utils'

interface ScoreGaugeProps {
  score: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreGauge({ score, label = 'KPI Score', size = 'md' }: ScoreGaugeProps) {
  const { label: riskLabel, color } = riskLevel(score)
  const radius = size === 'sm' ? 28 : size === 'lg' ? 48 : 38
  const stroke = size === 'sm' ? 5 : 7
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'
  const svgSize = (radius + stroke + 4) * 2

  const trackColor = '#f1f5f9'
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={svgSize / 2} cy={svgSize / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
          <circle
            cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold text-slate-800', textSize)}>{score}</span>
        </div>
      </div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <span className={cn('text-xs font-semibold', color)}>{riskLabel} Risk</span>
    </div>
  )
}
