import { cn } from "@/lib/utils";

type StatusType = 
  | "delivered" 
  | "sent" 
  | "opened" 
  | "clicked" 
  | "bounced" 
  | "failed" 
  | "pending" 
  | "queued"
  | "verified"
  | "subscribed"
  | "unsubscribed"
  | "suspended";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  delivered: {
    label: "Delivered",
    className: "bg-success/10 text-success border-success/20",
  },
  sent: {
    label: "Sent",
    className: "bg-info/10 text-info border-info/20",
  },
  opened: {
    label: "Opened",
    className: "bg-success/10 text-success border-success/20",
  },
  clicked: {
    label: "Clicked",
    className: "bg-success/10 text-success border-success/20",
  },
  bounced: {
    label: "Bounced",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  failed: {
    label: "Failed",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  pending: {
    label: "Pending",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  queued: {
    label: "Queued",
    className: "bg-muted text-muted-foreground border-border",
  },
  verified: {
    label: "Verified",
    className: "bg-success/10 text-success border-success/20",
  },
  subscribed: {
    label: "Subscribed",
    className: "bg-success/10 text-success border-success/20",
  },
  unsubscribed: {
    label: "Unsubscribed",
    className: "bg-muted text-muted-foreground border-border",
  },
  suspended: {
    label: "Suspended",
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
