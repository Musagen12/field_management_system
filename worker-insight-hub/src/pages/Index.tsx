import { DashboardHeader } from "@/components/DashboardHeader";
import { WorkerResponseTimeChart } from "@/components/charts/WorkerResponseTimeChart";
import { AggregatedResponseTimeChart } from "@/components/charts/AggregatedResponseTimeChart";
import { RankedResponseTimeChart } from "@/components/charts/RankedResponseTimeChart";
import { TaskCompletionTimeChart } from "@/components/charts/TaskCompletionTimeChart";
import { ReworkFrequencyChart } from "@/components/charts/ReworkFrequencyChart";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-6">
          {/* Row 1: Worker Response Times (full width) */}
          <section className="animate-fade-in opacity-0 stagger-1">
            <WorkerResponseTimeChart />
          </section>

          {/* Row 2: Aggregated and Ranked Response Times */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="animate-fade-in opacity-0 stagger-2">
              <AggregatedResponseTimeChart />
            </section>
            <section className="animate-fade-in opacity-0 stagger-3">
              <RankedResponseTimeChart />
            </section>
          </div>

          {/* Row 3: Task Completion Timeline */}
          <section className="animate-fade-in opacity-0 stagger-4">
            <h2 className="text-xl font-bold font-mono text-foreground mb-4">
              Task Completion Timeline
            </h2>
            <TaskCompletionTimeChart />
          </section>

          {/* Row 4: Rework Frequency */}
          <section className="animate-fade-in opacity-0 stagger-5">
            <ReworkFrequencyChart />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
