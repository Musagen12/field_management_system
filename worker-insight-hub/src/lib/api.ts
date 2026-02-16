const API_BASE_URL = "http://localhost:8000";

export interface Worker {
  username: string;
  [key: string]: unknown;
}

export interface ResponseTimeData {
  [key: string]: unknown;
}

export interface AggregatedResponseTimeResult {
  username: string;
  average_response_time_min: number;
  task_count: number;
}

export interface AggregatedResponseTime {
  worker_count: number;
  results: AggregatedResponseTimeResult[];
}

export interface ExecutionTimeByTaskAndWorker {
  [task: string]: {
    [worker: string]: number[];
  };
}

export interface RankedResponseTime {
  [worker: string]: number;
}

export interface TaskCompletionTimes {
  [task: string]: {
    [worker: string]: string[];
  };
}

export interface ReworkFrequency {
  [worker: string]: number;
}

export const api = {
  // Get list of workers
  async getWorkers(): Promise<Worker[]> {
    const response = await fetch(`${API_BASE_URL}/analytics/workers/`);
    if (!response.ok) throw new Error("Failed to fetch workers");
    return response.json();
  },

  // Get worker response time data
  async getWorkerResponseTime(username: string): Promise<ResponseTimeData[]> {
    const response = await fetch(
      `${API_BASE_URL}/analytics/worker/${username}/task-response-time`
    );
    if (!response.ok) throw new Error(`Failed to fetch response time for ${username}`);
    return response.json();
  },

  // Get aggregated response times
  async getAggregatedResponseTime(): Promise<AggregatedResponseTime> {
    const response = await fetch(
      `${API_BASE_URL}/analytics/workers/aggregated-response-time`
    );
    if (!response.ok) throw new Error("Failed to fetch aggregated response times");
    return response.json();
  },

  // Get execution time by task and worker
  async getExecutionTimeByTaskAndWorker(): Promise<ExecutionTimeByTaskAndWorker> {
    const response = await fetch(
      `${API_BASE_URL}/analytics/execution-time/by-task-and-worker`
    );
    if (!response.ok) throw new Error("Failed to fetch execution time data");
    return response.json();
  },

  // Get ranked response times
  async getRankedResponseTime(): Promise<RankedResponseTime> {
    const response = await fetch(
      `${API_BASE_URL}/analytics/workers/ranked-response-time`
    );
    if (!response.ok) throw new Error("Failed to fetch ranked response times");
    return response.json();
  },

  // Get task completion times
  async getTaskCompletionTimes(): Promise<TaskCompletionTimes> {
    const response = await fetch(
      `${API_BASE_URL}/analytics/task-completion-times`
    );
    if (!response.ok) throw new Error("Failed to fetch task completion times");
    return response.json();
  },

  // Get rework frequency
  async getReworkFrequency(): Promise<ReworkFrequency> {
    const response = await fetch(
      `${API_BASE_URL}/analytics/workers/rework-frequency`
    );
    if (!response.ok) throw new Error("Failed to fetch rework frequency");
    return response.json();
  },
};
