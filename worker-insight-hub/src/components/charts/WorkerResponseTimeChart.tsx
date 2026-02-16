import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { useWorkers, useAllWorkersResponseTime } from "@/hooks/useAnalytics";

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

export const WorkerResponseTimeChart = () => {
  const { data: workers, isLoading: workersLoading } = useWorkers();
  const usernames = workers?.map((w) => w.username) || [];
  const { data: responseData, isLoading: responseLoading } =
    useAllWorkersResponseTime(usernames);

  const isLoading = workersLoading || responseLoading;

  // Transform data for the line chart
  const chartData = (() => {
    if (!responseData || responseData.length === 0) return [];

    // Find the maximum number of data points across all workers
    const maxLength = Math.max(
      ...responseData.map((r) => r.data?.length || 0)
    );

    // Create data points for each task index
    return Array.from({ length: maxLength }, (_, index) => {
      const point: Record<string, unknown> = { index: index + 1 };
      responseData.forEach((worker) => {
        const value = worker.data?.[index];
        if (value !== undefined && value !== null) {
          // Extract response_time_min from the API response
          const responseTimeMin =
            typeof value === "object"
              ? (value as Record<string, unknown>).response_time_min ?? 
                (value as Record<string, unknown>).response_time ?? 
                value
              : value;
          point[worker.username] = Number(responseTimeMin);
        }
      });
      return point;
    });
  })();

  return (
    <ChartCard
      title="Worker Response Time Trend"
      subtitle="Index-based performance trend per worker"
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 18%)" />
          <XAxis
            dataKey="index"
            stroke="hsl(215, 20%, 55%)"
            tick={{ fill: "hsl(215, 20%, 55%)" }}
            label={{
              value: "Task Index",
              position: "insideBottom",
              offset: -5,
              fill: "hsl(215, 20%, 55%)",
            }}
          />
          <YAxis
            stroke="hsl(215, 20%, 55%)"
            tick={{ fill: "hsl(215, 20%, 55%)" }}
            label={{
              value: "Response Time (min)",
              angle: -90,
              position: "insideLeft",
              fill: "hsl(215, 20%, 55%)",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 47%, 9%)",
              border: "1px solid hsl(222, 47%, 18%)",
              borderRadius: "8px",
              color: "hsl(210, 40%, 98%)",
            }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "20px",
            }}
          />
          {usernames.map((username, idx) => (
            <Line
              key={username}
              type="monotone"
              dataKey={username}
              stroke={CHART_COLORS[idx % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS[idx % CHART_COLORS.length], r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
