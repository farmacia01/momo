"use client";

import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';

interface WeightData {
  data_medicao: string;
  peso_kg: number;
}

export function DashboardChart({ data }: { data: WeightData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[110px] items-center justify-center text-[11px] text-gray-400 font-medium">
        Nenhum registro de peso no período.
      </div>
    );
  }

  // Get only the last 7 records
  const recentData = [...data].slice(0, 7).reverse();

  const chartData = recentData.map(item => {
    const date = new Date(item.data_medicao);
    return {
      name: `${date.getDate()}/${date.getMonth() + 1}`,
      peso: item.peso_kg
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-xl shadow-premium border-none">
          <p className="text-[10px] text-gray-400 font-medium mb-0.5">{label}</p>
          <p className="text-sm font-bold text-gray-900">{payload[0].value} <span className="font-medium text-gray-500">kg</span></p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, index, data } = props;
    // Only show dot on the last point
    if (index === data.length - 1) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={8} fill="#16a34a" fillOpacity={0.2} />
          <circle cx={cx} cy={cy} r={4} fill="#16a34a" stroke="#fff" strokeWidth={1.5} />
        </g>
      );
    }
    return null;
  };

  return (
    <div className="h-[110px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
          <defs>
            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#d1d5db', fontWeight: 500 }} 
            dy={8} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f3f4f6', strokeWidth: 1 }} />
          <Area 
            type="monotone" 
            dataKey="peso" 
            stroke="#16a34a" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#colorWeight)" 
            dot={<CustomDot data={chartData} />}
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
