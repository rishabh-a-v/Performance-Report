import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts'

interface WorkloadBarProps {
  data: { name: string; completed: number; active: number; blocked: number }[]
  height?: number
}

export function WorkloadBar({ data, height = 220 }: WorkloadBarProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={16} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          labelStyle={{ color: '#475569', fontWeight: 600 }}
        />
        <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[3, 3, 0, 0]} />
        <Bar dataKey="active"    name="Active"    fill="#3b82f6" radius={[3, 3, 0, 0]} />
        <Bar dataKey="blocked"   name="Blocked"   fill="#ef4444" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
