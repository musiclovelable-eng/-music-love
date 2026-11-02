"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface AnalyticsData {
  date: string;
  totalStreams: number;
  streamsOver30s: number;
  uniqueListeners: number;
  subscribers: number;
}

interface Props {
  data: AnalyticsData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-xl border-border/50">
        <p className="text-xs font-medium mb-2 text-muted-foreground">
          {format(new Date(label), "d MMMM yyyy", { locale: ru })}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <span className="text-[11px] flex items-center gap-2 font-medium">
                <span 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="text-[11px] font-bold">
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function AnalyticsChart({ data }: Props) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      totalStreams: Number(item.totalStreams),
      streamsOver30s: Number(item.streamsOver30s),
      uniqueListeners: Number(item.uniqueListeners),
      subscribers: Number(item.subscribers),
    }));
  }, [data]);

  return (
    <div className="w-full h-[350px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
        >
          <CartesianGrid 
            strokeDasharray="5 5" 
            horizontal={true}
            vertical={false} 
            stroke="hsl(var(--muted-foreground) / 0.1)" 
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground) / 0.6)", fontSize: 11 }}
            tickFormatter={(value) => format(new Date(value), "dd.MM.yyyy")}
            minTickGap={60}
            dy={15}
          />
          <YAxis
            hide={true}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: 'hsl(var(--muted-foreground) / 0.1)', strokeWidth: 1 }}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            iconType="circle"
            iconSize={8}
            formatter={(value) => {
              const labels: Record<string, string> = {
                totalStreams: "Все прослушивания",
                streamsOver30s: "Прослушивания >30 секунд",
                uniqueListeners: "Слушатели",
                subscribers: "Подписчики"
              };
              const colors: Record<string, string> = {
                totalStreams: "var(--chart-1)",
                streamsOver30s: "var(--chart-2)",
                uniqueListeners: "var(--chart-3)",
                subscribers: "var(--chart-4)"
              };
              return (
                <span className="text-[12px] font-medium ml-1" style={{ color: colors[value] || 'inherit' }}>
                  {labels[value] || value}
                </span>
              );
            }}
            wrapperStyle={{ paddingTop: 40 }}
          />
          <Line
            type="monotone"
            dataKey="totalStreams"
            name="totalStreams"
            stroke="var(--chart-1)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "var(--chart-1)" }}
            isAnimationActive={true}
          />
          <Line
            type="monotone"
            dataKey="streamsOver30s"
            name="streamsOver30s"
            stroke="var(--chart-2)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "var(--chart-2)" }}
            isAnimationActive={true}
          />
          <Line
            type="monotone"
            dataKey="uniqueListeners"
            name="uniqueListeners"
            stroke="var(--chart-3)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "var(--chart-3)" }}
            isAnimationActive={true}
          />
          <Line
            type="monotone"
            dataKey="subscribers"
            name="subscribers"
            stroke="var(--chart-4)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "var(--chart-4)" }}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
