import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const useWorkers = () => {
  return useQuery({
    queryKey: ["workers"],
    queryFn: api.getWorkers,
  });
};

export const useWorkerResponseTime = (username: string) => {
  return useQuery({
    queryKey: ["workerResponseTime", username],
    queryFn: () => api.getWorkerResponseTime(username),
    enabled: !!username,
  });
};

export const useAllWorkersResponseTime = (usernames: string[]) => {
  return useQuery({
    queryKey: ["allWorkersResponseTime", usernames],
    queryFn: async () => {
      const results = await Promise.all(
        usernames.map(async (username) => {
          const data = await api.getWorkerResponseTime(username);
          return { username, data };
        })
      );
      return results;
    },
    enabled: usernames.length > 0,
  });
};

export const useAggregatedResponseTime = () => {
  return useQuery({
    queryKey: ["aggregatedResponseTime"],
    queryFn: api.getAggregatedResponseTime,
  });
};

export const useExecutionTimeByTaskAndWorker = () => {
  return useQuery({
    queryKey: ["executionTimeByTaskAndWorker"],
    queryFn: api.getExecutionTimeByTaskAndWorker,
  });
};

export const useRankedResponseTime = () => {
  return useQuery({
    queryKey: ["rankedResponseTime"],
    queryFn: api.getRankedResponseTime,
  });
};

export const useTaskCompletionTimes = () => {
  return useQuery({
    queryKey: ["taskCompletionTimes"],
    queryFn: api.getTaskCompletionTimes,
  });
};

export const useReworkFrequency = () => {
  return useQuery({
    queryKey: ["reworkFrequency"],
    queryFn: api.getReworkFrequency,
  });
};
