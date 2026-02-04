// src/components/admin/CongestionGraph.tsx
"use client";

import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { GraphPoint } from '@/types';

interface CongestionGraphProps {
  data: GraphPoint[];
}

export default function CongestionGraph({ data }: CongestionGraphProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-72 mt-4 bg-white rounded-lg">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            fontSize={11} 
            tickMargin={8}
            stroke="#9ca3af"
            interval="preserveStartEnd"
          />
          <YAxis 
            fontSize={11} 
            allowDecimals={false}
            stroke="#9ca3af"
            unit='人'
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px'
            }}
          formatter={(value: any, name: any) => [
                `${value}人`, 
                name
            ]}
          />
          <Legend 
            align="center"
            wrapperStyle={{ 
              width: '115%',
              fontSize: '12px', 
              paddingTop: '10px'
            }} 
          />

          {/* 棒グラフ：その時間帯の新規受付数 */}
          <Bar 
            dataKey="newVisitors" 
            name="新規受付数" 
            barSize={20} 
            fill="#93c5fd"
            radius={[4, 4, 0, 0]} 
          />

          {/* 折れ線グラフ：その時間帯の最大同時待ち */}
          <Line 
            type="monotone" 
            dataKey="maxWait" 
            name="最大同時待ち" 
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 3, fill: '#2563eb' }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}