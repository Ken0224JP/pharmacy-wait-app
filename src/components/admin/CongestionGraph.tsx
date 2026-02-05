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
import { GraphPoint, GraphSettings } from '@/types';

interface CongestionGraphProps {
  data: GraphPoint[];
  settings: GraphSettings; // ★設定を受け取る
}

export default function CongestionGraph({ data, settings }: CongestionGraphProps) {
  if (!data || data.length === 0) return null;

  // 左軸の要素（新規受付数、最大同時待ち）のいずれかが表示されるか
  const showLeftAxisData = settings.showNewVisitors || settings.showMaxWait;
  // 右軸の要素（平均待ち時間）が表示されるか
  const showRightAxisData = settings.showAvgWait;

  // 表示設定に基づいてマージンを決定
  let chartMargin;

  if (showRightAxisData && !showLeftAxisData) {
    // 1. 平均待ち時間のみ表示 (右軸のみ)
    chartMargin = { top: 10, right: -20, bottom: 0, left: -40 };
  } else if (!showRightAxisData) {
    // 2. 平均待ち時間のみ表示しない (左軸のみ、または両方非表示)
    chartMargin = { top: 10, right: 20, bottom: 0, left: -20 };
  } else {
    // 3. 平均待ち時間が表示、かつ、新規受付数か最大同時待ちの一つ以上が表示 (左右両軸)
    chartMargin = { top: 10, right: -10, bottom: 0, left: -20 };
  }

  return (
    <div className="w-full h-72 mt-4 bg-white rounded-lg">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            fontSize={11} 
            tickMargin={8}
            stroke="#9ca3af"
            interval="preserveStartEnd"
          />
          
          {/* 左軸: 人数用 */}
          <YAxis 
            yAxisId="left"
            fontSize={11} 
            allowDecimals={false}
            stroke="#9ca3af"
            unit='人'
            orientation="left"
          />

          {/* 右軸: 時間用 (平均待ち時間を表示する場合のみ) */}
          {settings.showAvgWait && (
             <YAxis 
               yAxisId="right"
               fontSize={11} 
               allowDecimals={false}
               stroke="#9ca3af"
               unit='分'
               orientation="right"
             />
          )}

          <Tooltip 
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px'
            }}
          />

          <Legend 
            align="center"
            wrapperStyle={{ 
              width: '115%',
              fontSize: '12px', 
              paddingTop: '10px'
            }} 
          />

          {/* 新規受付数（棒グラフ） */}
          {settings.showNewVisitors && (
            <Bar 
              yAxisId="left"
              dataKey="intervalNewVisitors" 
              name="新規受付数" 
              barSize={20} 
              fill="#93c5fd"
              radius={[4, 4, 0, 0]} 
              unit={"人"}
            />
          )}

          {/* 最大同時待ち（折れ線） */}
          {settings.showMaxWait && (
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="intervalMaxWait" 
              name="最大同時待ち" 
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 3, fill: '#2563eb' }}
              activeDot={{ r: 5 }}
              unit={"人"}            
            />
          )}

          {/* 平均待ち時間（折れ線・右軸） */}
          {settings.showAvgWait && (
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="intervalAvgWaitTime" 
              name="平均待ち時間" 
              stroke="#f59e0b" // オレンジ
              strokeWidth={2}
              strokeDasharray="5 5" // 点線にして区別
              dot={{ r: 3, fill: '#f59e0b' }}
              activeDot={{ r: 5 }}
              unit={"分"}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}