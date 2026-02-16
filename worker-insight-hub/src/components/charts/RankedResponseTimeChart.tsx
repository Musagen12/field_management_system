import { ChartCard } from "./ChartCard";
import { useAggregatedResponseTime } from "@/hooks/useAnalytics";
import { Trophy, Medal, Award } from "lucide-react";

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-400" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-300" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-muted-foreground font-medium">{rank}</span>;
  }
};

const getRankBgClass = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-yellow-500/10 border-yellow-500/30";
    case 2:
      return "bg-gray-400/10 border-gray-400/30";
    case 3:
      return "bg-amber-600/10 border-amber-600/30";
    default:
      return "bg-secondary/50 border-border";
  }
};

export const RankedResponseTimeChart = () => {
  const { data, isLoading } = useAggregatedResponseTime();

  const rankedData = data?.results
    ? [...data.results]
        .sort((a, b) => a.average_response_time_min - b.average_response_time_min)
        .map((item, index) => ({
          rank: index + 1,
          username: item.username,
          avgTime: item.average_response_time_min,
          taskCount: item.task_count,
        }))
    : [];

  return (
    <ChartCard
      title="Worker Performance Ranking"
      subtitle="Workers ranked by average response time (fastest first)"
      isLoading={isLoading}
    >
      <div className="space-y-3">
        {rankedData.map((worker) => (
          <div
            key={worker.username}
            className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:scale-[1.01] ${getRankBgClass(worker.rank)}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center">
                {getRankIcon(worker.rank)}
              </div>
              <div>
                <p className="font-semibold text-foreground capitalize">
                  {worker.username}
                </p>
                <p className="text-sm text-muted-foreground">
                  {worker.taskCount} task{worker.taskCount !== 1 ? "s" : ""} completed
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">
                {worker.avgTime.toFixed(2)} min
              </p>
              <p className="text-xs text-muted-foreground">avg response time</p>
            </div>
          </div>
        ))}
        {rankedData.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground py-8">
            No ranking data available
          </p>
        )}
      </div>
    </ChartCard>
  );
};
