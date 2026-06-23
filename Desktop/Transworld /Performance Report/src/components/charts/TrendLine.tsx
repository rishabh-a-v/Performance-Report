import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'

interface Series { key: string; color: string; label?: string }

interface TrendLineProps {
  data: Record<string, string | number>[]
  xKey: string
  series: Series[]
  height?: number
  yDomain?: [number, number]
  unit?: string
  yFormatter?: (value: number) => string
}

export function TrendLine({ data, xKey, series, height = 220, yDomain, unit, yFormatter }: TrendLineProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: yFormatter ? 10 : -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis domain={yDomain} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit={unit} tickFormatter={yFormatter} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          labelStyle={{ color: '#475569', fontWeight: 600 }}
          formatter={yFormatter ? (val: number) => [yFormatter(val)] : undefined}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
