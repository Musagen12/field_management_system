import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
}

export const ChartCard = ({
  title,
  subtitle,
  children,
  isLoading,
  className = "",
}: ChartCardProps) => {
  return (
    <div className={`chart-card ${className}`}>
      <div className="chart-title">{title}</div>
      {subtitle && <div className="chart-subtitle">{subtitle}</div>}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full bg-secondary" />
        </div>
      ) : (
        children
      )}
    </div>
  );
};
