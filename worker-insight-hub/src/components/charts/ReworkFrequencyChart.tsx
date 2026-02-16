import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { useReworkFrequency } from "@/hooks/useAnalytics";

const CHART_COLORS = [
  "hsl(340, 82%, 52%)",
  "hsl(24, 95%, 53%)",
  "hsl(47, 100%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(174, 72%, 56%)",
  "hsl(142, 71%, 45%)",
  "hsl(199, 89%, 48%)",
  "hsl(291, 64%, 42%)",
];

export const ReworkFrequencyChart = () => {
  const { data, isLoading } = useReworkFrequency();

  const chartData = data
    ? Object.entries(data)
        .map(([worker, count]) => ({
          worker,
          count: typeof count === "number" ? count : 0,
        }))
        .sort((a, b) => b.count - a.count)
    : [];

  return (
    <ChartCard
      title="Rework Frequency"
      subtitle="Number of times workers were asked to redo tasks"
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 18%)" horizontal={false} />
          <XAxis
            type="number"
            stroke="hsl(215, 20%, 55%)"
            tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="worker"
            stroke="hsl(215, 20%, 55%)"
            tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 47%, 9%)",
              border: "1px solid hsl(222, 47%, 18%)",
              borderRadius: "8px",
              color: "hsl(210, 40%, 98%)",
            }}
            formatter={(value: number) => [value, "Reworks"]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
