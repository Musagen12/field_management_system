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
import { useAggregatedResponseTime } from "@/hooks/useAnalytics";

const CHART_COLORS = [
  "hsl(174, 72%, 56%)",
  "hsl(262, 83%, 58%)",
  "hsl(47, 100%, 50%)",
  "hsl(340, 82%, 52%)",
  "hsl(142, 71%, 45%)",
  "hsl(199, 89%, 48%)",
  "hsl(24, 95%, 53%)",
  "hsl(291, 64%, 42%)",
];

export const AggregatedResponseTimeChart = () => {
  const { data, isLoading } = useAggregatedResponseTime();

  const chartData = data?.results
    ? data.results
        .map((item) => ({
          worker: item.username,
          time: item.average_response_time_min,
          taskCount: item.task_count,
        }))
        .sort((a, b) => a.time - b.time)
    : [];

  return (
    <ChartCard
      title="Aggregated Response Times"
      subtitle="Workers ranked by average response time"
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 18%)" />
          <XAxis
            type="number"
            stroke="hsl(215, 20%, 55%)"
            tick={{ fill: "hsl(215, 20%, 55%)" }}
            label={{
              value: "Time (s)",
              position: "insideBottom",
              offset: -5,
              fill: "hsl(215, 20%, 55%)",
            }}
          />
          <YAxis
            type="category"
            dataKey="worker"
            stroke="hsl(215, 20%, 55%)"
            tick={{ fill: "hsl(215, 20%, 55%)" }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 47%, 9%)",
              border: "1px solid hsl(222, 47%, 18%)",
              borderRadius: "8px",
              color: "hsl(210, 40%, 98%)",
            }}
            formatter={(value: number) => [`${value.toFixed(2)}s`, "Time"]}
          />
          <Bar dataKey="time" radius={[0, 4, 4, 0]}>
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
