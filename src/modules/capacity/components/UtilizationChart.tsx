import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface ForecastDataPoint {
  date: string;
  capacity: number;
  demand: number;
}

interface UtilizationChartProps {
  data: ForecastDataPoint[];
}

export function UtilizationChart({ data }: UtilizationChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
        No forecast data available
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="capacityColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="demandColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickLine={false} 
            axisLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
          />
          <YAxis 
            tickLine={false} 
            axisLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif'
            }}
            labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
          />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              color: '#475569',
              paddingLeft: '10px'
            }} 
          />
          <Area 
            type="monotone" 
            dataKey="capacity" 
            stroke="#10b981" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#capacityColor)" 
            name="Available Capacity (Hrs)" 
          />
          <Area 
            type="monotone" 
            dataKey="demand" 
            stroke="#6366f1" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#demandColor)"
            name="Allocated Demand (Hrs)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
