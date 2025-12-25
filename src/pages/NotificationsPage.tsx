import { TopBar } from "@/components/layout/TopBar";
import { Bell, Mail, AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "email";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "email",
    title: "Email delivered successfully",
    description: "Your email to user@example.com was delivered.",
    time: "2 minutes ago",
    read: false,
  },
  {
    id: "2",
    type: "warning",
    title: "Rate limit warning",
    description: "You're approaching your daily email limit (80% used).",
    time: "15 minutes ago",
    read: false,
  },
  {
    id: "3",
    type: "success",
    title: "Domain verified",
    description: "monosend.io has been successfully verified.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "4",
    type: "info",
    title: "New feature available",
    description: "MCP integration is now available for your account.",
    time: "2 hours ago",
    read: true,
  },
  {
    id: "5",
    type: "email",
    title: "Broadcast completed",
    description: "Weekly Newsletter was sent to 1,247 recipients.",
    time: "3 hours ago",
    read: true,
  },
  {
    id: "6",
    type: "warning",
    title: "Bounce rate increase",
    description: "Your bounce rate has increased by 5% in the last 24 hours.",
    time: "5 hours ago",
    read: true,
  },
];

function NotificationIcon({ type }: { type: Notification["type"] }) {
  const iconClass = "h-5 w-5";
  
  switch (type) {
    case "email":
      return <Mail className={cn(iconClass, "text-primary")} />;
    case "success":
      return <CheckCircle className={cn(iconClass, "text-success")} />;
    case "warning":
      return <AlertCircle className={cn(iconClass, "text-warning")} />;
    case "info":
    default:
      return <Info className={cn(iconClass, "text-info")} />;
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  return (
    <>
      <TopBar 
        title="Notifications" 
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
      />
      
      <div className="p-6">
        {/* Header actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {notifications.length} notifications
            </span>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex items-start gap-4 rounded-lg border border-border p-4 transition-colors cursor-pointer hover:bg-muted/50",
                !notification.read && "bg-accent/30 border-accent"
              )}
              onClick={() => markAsRead(notification.id)}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                notification.type === "email" && "bg-primary/10",
                notification.type === "success" && "bg-success/10",
                notification.type === "warning" && "bg-warning/10",
                notification.type === "info" && "bg-info/10"
              )}>
                <NotificationIcon type={notification.type} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{notification.title}</h3>
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {notification.description}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {notification.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-foreground">No notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You're all caught up! Check back later.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
