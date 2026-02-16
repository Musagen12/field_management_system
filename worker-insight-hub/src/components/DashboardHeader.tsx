import { Activity, BarChart3, Clock, Users } from "lucide-react";

export const DashboardHeader = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 glow-effect">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-foreground">
                Worker Analytics
              </h1>
              <p className="text-sm text-muted-foreground">
                Performance metrics and insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">Workers</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Response Times</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Metrics</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
