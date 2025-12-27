import { TopBar } from "@/components/layout/TopBar";
import { Bell, Mail, AlertCircle, CheckCircle, Info, ExternalLink, Trash2, Settings, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApiNotification {
  id: string;
  user_id: string;
  subject: string;
  body: string;
  type: string;
  details: string;
  cta: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

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

function mapApiTypeToUiType(apiType: string): Notification["type"] {
  switch (apiType.toLowerCase()) {
    case "email":
    case "broadcast":
      return "email";
    case "success":
    case "verified":
      return "success";
    case "warning":
    case "alert":
      return "warning";
    case "info":
    case "welcome":
    default:
      return "info";
  }
}

function mapApiNotificationToUi(apiNotification: ApiNotification): Notification {
  return {
    id: apiNotification.id,
    type: mapApiTypeToUiType(apiNotification.type),
    title: apiNotification.subject,
    description: apiNotification.body,
    details: apiNotification.details || apiNotification.body,
    time: formatDistanceToNow(new Date(apiNotification.created_at), { addSuffix: true }),
    read: apiNotification.is_read,
    actionUrl: apiNotification.cta || undefined,
    actionLabel: apiNotification.cta ? "View" : undefined,
  };
}

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api("/notifications");
        if (response.ok) {
          const data = await response.json();
          const mappedNotifications = (data.items || []).map(mapApiNotificationToUi);
          setNotifications(mappedNotifications);
        }
      } catch (error: any) {
        if (error.message !== "Unauthorized") {
          console.error("Failed to fetch notifications:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const markAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      const response = await api("/notifications/read", { method: "POST" });
      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      }
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        console.error("Failed to mark notifications as read:", error);
      }
    } finally {
      setIsMarkingAllRead(false);
    }
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
              <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={isMarkingAllRead}>
                {isMarkingAllRead ? "Marking..." : "Mark all as read"}
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

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Notifications list */}
        {!isLoading && notifications.length > 0 && (
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
        )}

        {!isLoading && notifications.length === 0 && (
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
