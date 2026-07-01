import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

interface SkillCount {
  name: string;
  value: number;
}

interface SkillGapPieProps {
  data: SkillCount[];
}

const COLORS = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#f43f5e', // rose
  '#14b8a6'  // teal
];

export function SkillGapPie({ data }: SkillGapPieProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
        No skill data available
      </div>
    );
  }

  // Sort data descending by count
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 8);

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={sortedData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              fontSize: '11px',
              fontFamily: 'Inter, sans-serif'
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#475569',
              marginTop: '10px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
