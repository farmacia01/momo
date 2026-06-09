"use client";

import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from "@/app/providers";

interface WeightData {
  data_medicao: string;
  peso_kg: number;
}

export function DashboardChart({ data }: { data: WeightData[] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gridColor = isDark ? "#222" : "#e2e8f0";
  const tickColor = isDark ? "#555" : "#94a3b8";
  const tooltipBg = isDark ? "#222" : "#ffffff";
  const tooltipBorder = isDark ? "#333" : "#e2e8f0";
  const tooltipMuted = isDark ? "#777" : "#94a3b8";
  const dotStroke = isDark ? "#1a1a1a" : "#ffffff";
  const cursorColor = isDark ? "#333" : "#e2e8f0";
  const textColor = isDark ? "#ffffff" : "#0f172a";

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[110px] items-center justify-center text-[11px] font-medium" style={{ color: "var(--color-text-muted)" }}>
        Nenhum registro de peso no período.
      </div>
    );
  }

  const recentData = [...data].slice(0, 7).reverse();
  const chartData = recentData.map(item => {
    const date = new Date(item.data_medicao);
    return { name: `${date.getDate()}/${date.getMonth() + 1}`, peso: item.peso_kg };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="px-3 py-2 rounded-xl" style={{ background: tooltipBg, border: `1px solid ${tooltipBorder}` }}>
          <p className="text-[10px] font-medium mb-0.5" style={{ color: tooltipMuted }}>{label}</p>
          <p className="text-sm font-bold" style={{ color: textColor }}>
            {payload[0].value} <span className="font-medium" style={{ color: tooltipMuted }}>kg</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, index, data } = props;
    if (index === data.length - 1) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={8} fill="#ff6500" fillOpacity={0.2} />
          <circle cx={cx} cy={cy} r={4} fill="#ff6500" stroke={dotStroke} strokeWidth={1.5} />
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
              <stop offset="5%" stopColor="#ff6500" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ff6500" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: tickColor, fontWeight: 500 }}
            dy={8}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: cursorColor, strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="peso"
            stroke="#ff6500"
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
