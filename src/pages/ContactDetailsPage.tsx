import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Copy, ArrowUpRight, Circle, User } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Contact {
  id: string;
  email: string;
  status: "subscribed" | "unsubscribed" | "bounced" | "complained";
  category_id: string | null;
  category_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  segment: string | null;
  segment_name: string | null;
}

interface ActivityItem {
  id: string;
  event_type: string;
  segment_name: string | null;
  segment_id: string | null;
  category_id: string | null;
  category_name: string | null;
  created_at: string;
}

export default function ContactDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  useEffect(() => {
    if (id) {
      fetchContact();
      fetchActivity();
    }
  }, [id]);

  const fetchContact = async () => {
    setIsLoading(true);
    try {
      const response = await api(`/contacts/${id}`);
      if (response.ok) {
        const data = await response.json();
        setContact(data);
      } else {
        toast.error("Failed to load contact");
        navigate("/audience");
      }
    } catch (error) {
      toast.error("Failed to load contact");
      navigate("/audience");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivity = async () => {
    setIsLoadingActivity(true);
    try {
      const response = await api(`/contacts/${id}/activity`);
      if (response.ok) {
        const data = await response.json();
        setActivity(data.items || []);
      }
    } catch (error) {
      console.error("Failed to load activity");
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getEventLabel = (eventType: string, item: ActivityItem) => {
    switch (eventType) {
      case "imported":
        return `Imported${item.segment_name ? ` to ${item.segment_name}` : ""}`;
      case "subscribed":
        return `Opted in to ${item.category_name || "newsletter"}`;
      case "unsubscribed":
        return `Opted out of ${item.category_name || "newsletter"}`;
      case "created":
        return "Contact created";
      case "bounced":
        return "Email bounced";
      case "complained":
        return "Marked as spam";
      default:
        return eventType.charAt(0).toUpperCase() + eventType.slice(1);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "subscribed":
      case "imported":
        return <ArrowUpRight className="h-3 w-3" />;
      case "created":
        return <Circle className="h-3 w-3" />;
      default:
        return <Circle className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <>
        <TopBar title="Contact" />
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!contact) {
    return null;
  }

  // Extract properties from metadata
  const properties = contact.metadata || {};

  return (
    <>
      <TopBar title="Contact" />
      <div className="p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <h1 className="text-2xl font-semibold">{contact.email}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              API
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <span className="text-xs font-medium">A</span>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8">
              •••
            </Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-4 gap-8 mb-8 pb-8 border-b">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Email Address</p>
            <p className="text-sm">{contact.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Created</p>
            <p className="text-sm">{formatDate(contact.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Status</p>
            <StatusBadge status={contact.status} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">ID</p>
            <div className="flex items-center gap-2">
              <p className="text-sm truncate max-w-[120px]">{contact.id}</p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => copyToClipboard(contact.id)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Segments & Topics */}
        <div className="grid grid-cols-4 gap-8 mb-8 pb-8 border-b">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Segments</p>
            <p className="text-sm italic text-muted-foreground">
              {contact.segment_name || "No segments"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Topics</p>
            <p className="text-sm">
              {contact.category_name ? (
                <span className="border-b border-dashed border-foreground">{contact.category_name}</span>
              ) : (
                <span className="italic text-muted-foreground">No topics</span>
              )}
            </p>
          </div>
        </div>

        {/* Properties */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Properties</h2>
          {Object.keys(properties).length > 0 ? (
            <div className="grid grid-cols-3 gap-8">
              {Object.entries(properties).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm">{String(value) || "-"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No properties</p>
          )}
        </div>

        {/* Activity */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Activity</h2>
          {isLoadingActivity ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-40" />
            </div>
          ) : activity.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[7px] top-3 bottom-3 w-px bg-border" />
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 relative">
                    <div className="h-4 w-4 rounded-full bg-background border border-border flex items-center justify-center z-10">
                      {getEventIcon(item.event_type)}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span>{getEventLabel(item.event_type, item)}</span>
                      <span className="text-muted-foreground">{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No activity</p>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Activity data may take a few seconds to update.
          </p>
        </div>
      </div>
    </>
  );
}
