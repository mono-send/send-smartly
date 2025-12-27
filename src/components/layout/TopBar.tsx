import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationCount } from "@/hooks/useNotificationCount";

interface TopBarProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  showBackButton?: boolean;
  onBack?: () => void;
  children?: React.ReactNode;
}

export function TopBar({ title, subtitle, action, showBackButton, onBack, children }: TopBarProps) {
  const navigate = useNavigate();
  const { count: unreadCount } = useNotificationCount();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {children}
        {action && (
          <Button onClick={action.onClick} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 relative"
          onClick={() => navigate("/notifications")}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </div>
    </header>
  );
}
