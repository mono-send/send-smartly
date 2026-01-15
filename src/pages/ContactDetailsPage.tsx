import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Copy, ArrowUpRight, Circle, User } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ContactSegment {
  id: string;
  name: string;
}

interface ContactCategory {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  status: "subscribed" | "unsubscribed" | "bounced" | "complained";
  metadata?: Record<string, string>[];
  created_at: string;
  categories: ContactCategory[];
  segments: ContactSegment[];
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

type EmailActivityItem = {
  id: string;
  status: string;
  subject: string;
  created_at: string;
  [key: string]: unknown;
};

export default function ContactDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [emailActivity, setEmailActivity] = useState<EmailActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [isLoadingEmailActivity, setIsLoadingEmailActivity] = useState(true);

  useEffect(() => {
    if (id) {
      fetchContact();
      fetchActivity();
      fetchEmailActivity();
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

  const fetchEmailActivity = async () => {
    setIsLoadingEmailActivity(true);
    try {
      const response = await api(`/contacts/${id}/emails`);
      if (response.ok) {
        const data = await response.json();
        setEmailActivity(data.items || []);
      }
    } catch (error) {
      console.error("Failed to load email activity");
    } finally {
      setIsLoadingEmailActivity(false);
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

  // Extract properties: first_name, last_name, and metadata
  const getProperties = () => {
    const props: { key: string; value: string }[] = [];
    
    if (contact.first_name) {
      props.push({ key: "first_name", value: contact.first_name });
    }
    if (contact.last_name) {
      props.push({ key: "last_name", value: contact.last_name });
    }
    
    // Handle metadata array
    if (contact.metadata && Array.isArray(contact.metadata)) {
      contact.metadata.forEach((item) => {
        Object.entries(item).forEach(([key, value]) => {
          if (value) {
            props.push({ key, value: String(value) });
          }
        });
      });
    }
    
    return props;
  };

  const properties = getProperties();
  return (
    <>
      <TopBar title="Contact Details" />
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

        {/* Details Table */}
        <div className="mb-8">
          <div className="rounded-2xl border border-border bg-white">
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="border-b border-border px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <div className="grid grid-cols-3 gap-4">
                    <div>Email Address</div>
                    <div>Status</div>
                    <div>ID</div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-4">
                    <div>Segments</div>
                    <div>Categories</div>
                    <div>Created</div>
                  </div>
                </div>
                <div className="px-6 py-4 text-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center">{contact.email}</div>
                    <div className="flex items-center">
                      <StatusBadge status={contact.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="truncate max-w-[140px]">{contact.id}</p>
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
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      {contact.segments && contact.segments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {contact.segments.map((segment) => (
                            <span key={segment.id} className="border-b border-dashed border-foreground">
                              {segment.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="italic text-muted-foreground">No segments</p>
                      )}
                    </div>
                    <div>
                      {contact.categories && contact.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {contact.categories.map((category) => (
                            <span key={category.id} className="border-b border-dashed border-foreground">
                              {category.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="italic text-muted-foreground">No categories</p>
                      )}
                    </div>
                    <div className="flex items-center">{formatDate(contact.created_at)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Properties</h2>
          {properties.length > 0 ? (
            <div className="grid grid-cols-3 gap-8">
              {properties.map((prop, index) => (
                <div key={index}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {prop.key.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm">{prop.value || "-"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No properties</p>
          )}
        </div>

        {/* Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold mb-4">Activity</h2>
            <div className="rounded-2xl border border-border bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th scope="col" className="px-6 py-3 text-left">
                        Activity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingActivity ? (
                      Array.from({ length: 2 }).map((_, index) => (
                        <tr key={`activity-skeleton-${index}`} className="border-b border-border last:border-b-0">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-4 rounded-full" />
                              <Skeleton className="h-4 w-48" />
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <Skeleton className="h-4 w-20" />
                          </td>
                        </tr>
                      ))
                    ) : activity.length > 0 ? (
                      activity.map((item) => (
                        <tr key={item.id} className="border-b border-border last:border-b-0">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{getEventIcon(item.event_type)}</span>
                              <span>{getEventLabel(item.event_type, item)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {formatDate(item.created_at)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-6 py-4 text-sm text-muted-foreground italic" colSpan={2}>
                          No activity
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Activity data may take a few seconds to update.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">Email Activity</h2>
            <div className="rounded-2xl border border-border bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th scope="col" className="px-6 py-3 text-left">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left">
                        Subject
                      </th>
                      <th scope="col" className="px-6 py-3 text-left">
                        Sent
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingEmailActivity ? (
                      Array.from({ length: 2 }).map((_, index) => (
                        <tr key={`email-activity-skeleton-${index}`} className="border-b border-border last:border-b-0">
                          <td className="px-6 py-3">
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="px-6 py-3">
                            <Skeleton className="h-4 w-48" />
                          </td>
                          <td className="px-6 py-3">
                            <Skeleton className="h-4 w-20" />
                          </td>
                        </tr>
                      ))
                    ) : emailActivity.length > 0 ? (
                      emailActivity.map((item) => (
                        <tr key={item.id} className="border-b border-border last:border-b-0">
                          <td className="px-6 py-3 text-muted-foreground">{item.status}</td>
                          <td className="px-6 py-3">{item.subject}</td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {formatDate(item.created_at)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-6 py-4 text-sm text-muted-foreground italic" colSpan={3}>
                          No email activity
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
