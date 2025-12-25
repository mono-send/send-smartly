import { TopBar } from "@/components/layout/TopBar";
import { Bell, Mail, AlertCircle, CheckCircle, Info, ExternalLink, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "email";
  title: string;
  description: string;
  details: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "email",
    title: "Email delivered successfully",
    description: "Your email to user@example.com was delivered.",
    details: "The transactional email with subject 'Welcome to MonoSend' was successfully delivered to user@example.com at 09:45 AM. The recipient's mail server accepted the message without any issues. Delivery time: 1.2 seconds.",
    time: "2 minutes ago",
    read: false,
    actionUrl: "/emails/1",
    actionLabel: "View Email",
  },
  {
    id: "2",
    type: "warning",
    title: "Rate limit warning",
    description: "You're approaching your daily email limit (80% used).",
    details: "You have sent 8,000 out of your 10,000 daily email quota. At the current sending rate, you may reach your limit within the next 2 hours. Consider upgrading your plan or spacing out your email sends to avoid hitting the limit.",
    time: "15 minutes ago",
    read: false,
    actionUrl: "/settings",
    actionLabel: "Upgrade Plan",
  },
  {
    id: "3",
    type: "success",
    title: "Domain verified",
    description: "monosend.io has been successfully verified.",
    details: "Your domain monosend.io has passed all DNS verification checks. DKIM, SPF, and DMARC records are properly configured. You can now send emails from any address @monosend.io with full deliverability.",
    time: "1 hour ago",
    read: false,
    actionUrl: "/domains/1",
    actionLabel: "View Domain",
  },
  {
    id: "4",
    type: "info",
    title: "New feature available",
    description: "MCP integration is now available for your account.",
    details: "We've enabled Model Context Protocol (MCP) integration for your account. This allows AI assistants and automation tools to interact with your MonoSend account programmatically. Check the logs page to monitor MCP activity.",
    time: "2 hours ago",
    read: true,
    actionUrl: "/logs",
    actionLabel: "View Logs",
  },
  {
    id: "5",
    type: "email",
    title: "Broadcast completed",
    description: "Weekly Newsletter was sent to 1,247 recipients.",
    details: "Your broadcast 'Weekly Newsletter' has been successfully sent to all 1,247 recipients in your 'Newsletter Subscribers' audience. Delivery stats: 1,241 delivered, 4 bounced, 2 pending. Open rate tracking has begun.",
    time: "3 hours ago",
    read: true,
    actionUrl: "/broadcasts",
    actionLabel: "View Broadcast",
  },
  {
    id: "6",
    type: "warning",
    title: "Bounce rate increase",
    description: "Your bounce rate has increased by 5% in the last 24 hours.",
    details: "Your email bounce rate has increased from 2.1% to 7.1% over the past 24 hours. This may affect your sender reputation. We recommend reviewing your audience list and removing invalid email addresses. Common causes include outdated email lists or sending to unverified addresses.",
    time: "5 hours ago",
    read: true,
    actionUrl: "/metrics",
    actionLabel: "View Metrics",
  },
];

function NotificationIcon({ type, size = "md" }: { type: Notification["type"]; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-8 w-8" : size === "sm" ? "h-5 w-5" : "h-5 w-5";
  
  switch (type) {
    case "email":
      return <Mail className={cn(sizeClass, "text-primary")} />;
    case "success":
      return <CheckCircle className={cn(sizeClass, "text-success")} />;
    case "warning":
      return <AlertCircle className={cn(sizeClass, "text-warning")} />;
    case "info":
    default:
      return <Info className={cn(sizeClass, "text-info")} />;
  }
}

function getTypeLabel(type: Notification["type"]) {
  switch (type) {
    case "email":
      return "Email";
    case "success":
      return "Success";
    case "warning":
      return "Warning";
    case "info":
    default:
      return "Information";
  }
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const openNotification = (notification: Notification) => {
    markAsRead(notification.id);
    setSelectedNotification(notification);
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    setSelectedNotification(null);
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
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/notifications/preferences")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Preferences
            </Button>
          </div>
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
              onClick={() => openNotification(notification)}
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

      {/* Notification Details Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedNotification && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full",
                    selectedNotification.type === "email" && "bg-primary/10",
                    selectedNotification.type === "success" && "bg-success/10",
                    selectedNotification.type === "warning" && "bg-warning/10",
                    selectedNotification.type === "info" && "bg-info/10"
                  )}>
                    <NotificationIcon type={selectedNotification.type} size="lg" />
                  </div>
                  <div>
                    <span className={cn(
                      "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium uppercase mb-1",
                      selectedNotification.type === "email" && "bg-primary/10 text-primary",
                      selectedNotification.type === "success" && "bg-success/10 text-success",
                      selectedNotification.type === "warning" && "bg-warning/10 text-warning",
                      selectedNotification.type === "info" && "bg-info/10 text-info"
                    )}>
                      {getTypeLabel(selectedNotification.type)}
                    </span>
                    <p className="text-xs text-muted-foreground">{selectedNotification.time}</p>
                  </div>
                </div>
                <DialogTitle className="text-xl">{selectedNotification.title}</DialogTitle>
                <DialogDescription className="text-base">
                  {selectedNotification.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Details</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedNotification.details}
                </p>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteNotification(selectedNotification.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <div className="flex-1" />
                {selectedNotification.actionUrl && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedNotification(null);
                      window.location.href = selectedNotification.actionUrl!;
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {selectedNotification.actionLabel}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
