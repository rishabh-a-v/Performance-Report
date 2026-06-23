import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

interface CompletionDonutProps {
  done: number
  active: number
  blocked: number
  backlog: number
  height?: number
}

const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#94a3b8']

export function CompletionDonut({ done, active, blocked, backlog, height = 200 }: CompletionDonutProps) {
  const data = [
    { name: 'Done',      value: done },
    { name: 'Active',    value: active },
    { name: 'Blocked',   value: blocked },
    { name: 'Backlog',   value: backlog },
  ].filter((d) => d.value > 0)

  const total = done + active + blocked + backlog
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={height * 0.28}
            outerRadius={height * 0.42}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-800">{pct}%</span>
        <span className="text-xs text-slate-400">complete</span>
      </div>
    </div>
  )
}
