import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        new: "bg-info/10 text-info border border-info/20",
        pending: "bg-warning/10 text-warning-foreground border border-warning/20",
        in_progress: "bg-primary/10 text-primary border border-primary/20",
        completed: "bg-success/10 text-success border border-success/20",
        resolved: "bg-success/10 text-success border border-success/20",
        acknowledged: "bg-accent text-accent-foreground border border-border",
        assigned: "bg-secondary text-secondary-foreground border border-border",
      }
    },
    defaultVariants: {
      variant: "new",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status: string;
}

type StatusVariant = 'new' | 'pending' | 'in_progress' | 'completed' | 'resolved' | 'acknowledged' | 'assigned';

const getVariantFromStatus = (status: string): StatusVariant => {
  const statusMap: Record<string, StatusVariant> = {
    new: 'new',
    pending: 'pending',
    in_progress: 'in_progress',
    completed: 'completed',
    resolved: 'resolved',
    acknowledged: 'acknowledged',
    assigned: 'assigned',
  };
  
  return statusMap[status.toLowerCase()] || 'new';
};

const StatusBadge = ({ className, status, ...props }: StatusBadgeProps) => {
  const variant = getVariantFromStatus(status);
  
  return (
    <div className={cn(statusBadgeVariants({ variant }), className)} {...props}>
      {status.replace('_', ' ').toUpperCase()}
    </div>
  );
};

export { StatusBadge, statusBadgeVariants };