import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { useTaskCompletionTimes } from "@/hooks/useAnalytics";
import { format, parseISO, startOfHour } from "date-fns";

export const TaskCompletionTimeChart = () => {
  const { data, isLoading } = useTaskCompletionTimes();

  if (isLoading) {
    return (
      <ChartCard
        title="Upload Activity Timeline"
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
        title="Upload Activity Timeline"
        subtitle="No data available"
      >
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No upload data available
        </div>
      </ChartCard>
    );
  }

  // Collect all timestamps from all tasks and workers
  const allTimestamps: Date[] = [];
  Object.values(data).forEach((workers) => {
    Object.values(workers).forEach((timestamps) => {
      timestamps.forEach((ts) => {
        allTimestamps.push(parseISO(ts));
      });
    });
  });

  // Sort timestamps
  allTimestamps.sort((a, b) => a.getTime() - b.getTime());

  // Group by hour intervals
  const intervalCounts = new Map<string, { time: Date; count: number }>();
  
  allTimestamps.forEach((timestamp) => {
    const intervalStart = startOfHour(timestamp);
    const key = intervalStart.toISOString();
    
    if (intervalCounts.has(key)) {
      intervalCounts.get(key)!.count += 1;
    } else {
      intervalCounts.set(key, { time: intervalStart, count: 1 });
    }
  });

  // Convert to chart data array and sort by time
  const chartData = Array.from(intervalCounts.values())
    .sort((a, b) => a.time.getTime() - b.time.getTime())
    .map((item) => ({
      time: item.time.getTime(),
      uploads: item.count,
      label: format(item.time, "MMM d, HH:mm"),
    }));

  return (
    <ChartCard
      title="Upload Activity Timeline"
      subtitle="Number of uploads over time (hourly intervals)"
    >
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(174, 72%, 56%)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(174, 72%, 56%)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 18%)" />
          <XAxis
            dataKey="time"
            stroke="hsl(215, 20%, 55%)"
            tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
            tickFormatter={(value) => format(new Date(value), "HH:mm")}
            label={{
              value: "Time",
              position: "insideBottom",
              offset: -5,
              fill: "hsl(215, 20%, 55%)",
            }}
          />
          <YAxis
            stroke="hsl(215, 20%, 55%)"
            tick={{ fill: "hsl(215, 20%, 55%)" }}
            allowDecimals={false}
            label={{
              value: "Uploads",
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
            labelFormatter={(value) => format(new Date(value), "MMM d, yyyy HH:mm")}
            formatter={(value: number) => [`${value} uploads`, "Count"]}
          />
          <Area
            type="monotone"
            dataKey="uploads"
            stroke="hsl(174, 72%, 56%)"
            strokeWidth={2}
            fill="url(#uploadGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
