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
import { useExecutionTimeByTaskAndWorker } from "@/hooks/useAnalytics";

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

export const ExecutionTimeByTaskChart = () => {
  const { data, isLoading } = useExecutionTimeByTaskAndWorker();

  if (isLoading) {
    return (
      <ChartCard
        title="Execution Time by Task"
        subtitle="Loading..."
        isLoading={true}
      >
        <div />
      </ChartCard>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <ChartCard
        title="Execution Time by Task"
        subtitle="No data available"
      >
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No execution time data available
        </div>
      </ChartCard>
    );
  }

  // Create a chart for each task
  const tasks = Object.entries(data);

  return (
    <div className="space-y-6">
      {tasks.map(([taskName, workers]) => {
        const workerNames = Object.keys(workers);
        
        // Find the maximum number of data points across all workers
        const maxLength = Math.max(
          ...Object.values(workers).map((times) => times?.length || 0)
        );

        // Transform data for the line chart
        const chartData = Array.from({ length: maxLength }, (_, index) => {
          const point: Record<string, unknown> = { index: index + 1 };
          Object.entries(workers).forEach(([workerName, times]) => {
            if (times && times[index] !== undefined) {
              point[workerName] = times[index];
            }
          });
          return point;
        });

        return (
          <ChartCard
            key={taskName}
            title={taskName.charAt(0).toUpperCase() + taskName.slice(1)}
            subtitle="Execution time per worker"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(222, 47%, 18%)"
                />
                <XAxis
                  dataKey="index"
                  stroke="hsl(215, 20%, 55%)"
                  tick={{ fill: "hsl(215, 20%, 55%)" }}
                  label={{
                    value: "Execution #",
                    position: "insideBottom",
                    offset: -5,
                    fill: "hsl(215, 20%, 55%)",
                  }}
                />
                <YAxis
                  stroke="hsl(215, 20%, 55%)"
                  tick={{ fill: "hsl(215, 20%, 55%)" }}
                  tickFormatter={(value) => value >= 60 ? `${(value / 60).toFixed(1)}m` : `${value.toFixed(0)}s`}
                  label={{
                    value: "Time",
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
                  formatter={(value: number) => {
                    if (value >= 60) {
                      return [`${(value / 60).toFixed(2)} min`, "Time"];
                    }
                    return [`${value.toFixed(2)}s`, "Time"];
                  }}
                />
                <Legend />
                {workerNames.map((workerName, idx) => (
                  <Line
                    key={workerName}
                    type="monotone"
                    dataKey={workerName}
                    stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{
                      fill: CHART_COLORS[idx % CHART_COLORS.length],
                      r: 4,
                    }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      })}
    </div>
  );
};
