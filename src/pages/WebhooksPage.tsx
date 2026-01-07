import { useState, useEffect, useCallback, useRef } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { EmptyState } from "@/components/ui/empty-state";
import { Webhook, Check, Info, MoreHorizontal, Trash2, ExternalLink, Pencil, Play, Loader2, Clock, CheckCircle2, XCircle, History, RefreshCw, Key, Copy, Eye, EyeOff, Shield, Plus, X, BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";
import { CodeBlock } from "@/components/ui/code-block";

interface WebhookEvent {
  id: string;
  label: string;
  color: "green" | "red" | "blue" | "yellow" | "gray" | "purple";
  tooltip?: string;
}

interface EventGroup {
  name: string;
  events: WebhookEvent[];
}

interface WebhookStats {
  total: number;
  success: number;
  failed: number;
  pending?: number;
  success_rate?: number;
}

interface ApiWebhookItem {
  id: string;
  endpoint_url: string;
  status: string;
  event_types: string[];
  stats_7d?: WebhookStats | null;
  created_at?: string;
  max_retries?: number;
  retry_interval_seconds?: number;
  secret?: string;
  allowed_ips?: string[];
  timeout_seconds?: number;
}

interface ApiWebhookDetail {
  id: string;
  endpoint_url: string;
  status?: string;
  event_types?: string[];
  retry?: {
    max_retries?: number;
    interval_seconds?: number;
  };
  ip_allowlist?: string[];
  timeout_seconds?: number;
  signing_secret?: string;
  signing_secret_last4?: string;
}

interface ApiDeliveryItem {
  delivery_id?: string;
  status?: string;
  attempt_count?: number;
  max_attempts?: number;
  event_type?: string;
  created_at?: string;
  delivered_at?: string;
  failed_at?: string;
  updated_at?: string;
  error?: string;
  endpoint_url?: string;
}

interface SavedWebhook {
  id: string;
  endpoint_url: string;
  status: string;
  event_types: string[];
  stats_7d?: WebhookStats | null;
  createdAt: Date;
  maxRetries: number;
  retryIntervalSeconds: number;
  secret: string;
  allowedIps: string[];
  timeoutSeconds: number;
}

interface DeliveryLogEntry {
  id: string;
  deliveryId: string;
  webhookId: string;
  endpointUrl: string;
  eventType: string;
  status: "success" | "failed" | "pending" | "retrying";
  statusMessage: string;
  timestamp: Date;
  attempt: number;
  maxRetries: number;
}

const eventGroups: EventGroup[] = [
  {
    name: "Contacts",
    events: [
      { id: "contact.created", label: "contact.created", color: "green" },
      { id: "contact.deleted", label: "contact.deleted", color: "red" },
      { id: "contact.updated", label: "contact.updated", color: "blue" },
    ],
  },
  {
    name: "Domains",
    events: [
      { id: "domain.created", label: "domain.created", color: "green" },
      { id: "domain.deleted", label: "domain.deleted", color: "red" },
      { id: "domain.updated", label: "domain.updated", color: "blue" },
    ],
  },
  {
    name: "Email",
    events: [
      { id: "email.bounced", label: "email.bounced", color: "red" },
      { id: "email.clicked", label: "email.clicked", color: "purple", tooltip: "Triggered when a recipient clicks a tracked link in your email" },
      { id: "email.complained", label: "email.complained", color: "yellow" },
      { id: "email.delivered", label: "email.delivered", color: "green" },
      { id: "email.delivery_delayed", label: "email.delivery_delayed", color: "gray" },
      { id: "email.failed", label: "email.failed", color: "red" },
      { id: "email.opened", label: "email.opened", color: "blue", tooltip: "Triggered when a recipient opens your email (requires open tracking)" },
      { id: "email.received", label: "email.received", color: "blue" },
      { id: "email.scheduled", label: "email.scheduled", color: "gray" },
      { id: "email.sent", label: "email.sent", color: "gray" },
    ],
  },
];

const allEventIds = eventGroups.flatMap(group => group.events.map(e => e.id));

const colorMap: Record<string, string> = {
  green: "bg-success",
  red: "bg-destructive",
  blue: "bg-info",
  yellow: "bg-warning",
  gray: "bg-muted-foreground",
  purple: "bg-purple-500",
};

const getEventColor = (eventId: string): string => {
  for (const group of eventGroups) {
    const event = group.events.find(e => e.id === eventId);
    if (event) return colorMap[event.color];
  }
  return colorMap.gray;
};

export default function WebhooksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState("https://");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [webhooks, setWebhooks] = useState<SavedWebhook[]>([]);
  const [webhookToDelete, setWebhookToDelete] = useState<SavedWebhook | null>(null);
  const [webhookToEdit, setWebhookToEdit] = useState<SavedWebhook | null>(null);
  const [webhookToTest, setWebhookToTest] = useState<SavedWebhook | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; statusCode?: number } | null>(null);
  const [deliveryLog, setDeliveryLog] = useState<DeliveryLogEntry[]>([]);
  const [showDeliveryLog, setShowDeliveryLog] = useState(false);
  const [deliveryLogWebhook, setDeliveryLogWebhook] = useState<SavedWebhook | null>(null);
  const [isDeliveryLogLoading, setIsDeliveryLogLoading] = useState(false);
  const [isDeliveryLogFetchingNext, setIsDeliveryLogFetchingNext] = useState(false);
  const [deliveryLogCursor, setDeliveryLogCursor] = useState<string | null>(null);
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryInterval, setRetryInterval] = useState(5);
  const [timeoutSeconds, setTimeoutSeconds] = useState(30);
  const [status, setStatus] = useState("active");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [generatedSignature, setGeneratedSignature] = useState("");
  const [allowedIps, setAllowedIps] = useState<string[]>([]);
  const [newIpInput, setNewIpInput] = useState("");
  const [signingSecretLast4, setSigningSecretLast4] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [isDialogLoading, setIsDialogLoading] = useState(false);

  const generateSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const isValidIp = (ip: string): boolean => {
    // IPv4 validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv4 CIDR validation
    const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
    return ipv4Regex.test(ip) || ipv4CidrRegex.test(ip);
  };

  const addIpAddress = () => {
    const trimmedIp = newIpInput.trim();
    if (!trimmedIp) return;
    
    if (!isValidIp(trimmedIp)) {
      toast.error("Please enter a valid IP address or CIDR range");
      return;
    }
    
    if (allowedIps.includes(trimmedIp)) {
      toast.error("This IP address is already in the list");
      return;
    }
    
    setAllowedIps(prev => [...prev, trimmedIp]);
    setNewIpInput("");
  };

  const removeIpAddress = (ip: string) => {
    setAllowedIps(prev => prev.filter(i => i !== ip));
  };

  const getWebhookStats = (stats?: WebhookStats | null) => {
    if (!stats) return null;
    const total = stats.total ?? 0;
    if (total === 0) return null;
    const success = stats.success ?? 0;
    const failed = stats.failed ?? 0;
    const pending = stats.pending ?? 0;
    const successRate = stats.success_rate ?? (total > 0 ? Math.round((success / total) * 100) : 0);

    return { total, success, failed, pending, successRate };
  };

  const mapWebhookItem = (item: ApiWebhookItem): SavedWebhook => ({
    id: item.id,
    endpoint_url: item.endpoint_url,
    status: item.status,
    event_types: item.event_types ?? [],
    stats_7d: item.stats_7d ?? null,
    createdAt: item.created_at ? new Date(item.created_at) : new Date(),
    maxRetries: item.max_retries ?? 3,
    retryIntervalSeconds: item.retry_interval_seconds ?? 5,
    secret: item.secret ?? "",
    allowedIps: item.allowed_ips ?? [],
    timeoutSeconds: item.timeout_seconds ?? 30,
  });

  const fetchWebhooks = useCallback(async (cursor?: string) => {
    try {
      const queryString = cursor ? `?${new URLSearchParams({ cursor }).toString()}` : "";
      const response = await api(`/webhooks${queryString}`);
      if (!response.ok) {
        throw new Error("Failed to fetch webhooks");
      }
      const data = await response.json();
      const mappedItems = (data.items ?? []).map(mapWebhookItem);
      setWebhooks(prev => (cursor ? [...prev, ...mappedItems] : mappedItems));
      setNextCursor(data.next_cursor ?? null);
    } catch (error) {
      toast.error("Failed to load webhooks");
    }
  }, []);

  const openAddDialog = () => {
    setWebhookToEdit(null);
    setEndpointUrl("https://");
    setSelectedEvents([]);
    setMaxRetries(3);
    setRetryInterval(5);
    setTimeoutSeconds(30);
    setStatus("active");
    setWebhookSecret("auto");
    setShowSecret(false);
    setAllowedIps([]);
    setNewIpInput("");
    setSigningSecretLast4(null);
    setIsDialogLoading(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = async (webhook: SavedWebhook) => {
    setWebhookToEdit(webhook);
    setEndpointUrl("https://");
    setSelectedEvents([]);
    setMaxRetries(3);
    setRetryInterval(5);
    setTimeoutSeconds(30);
    setStatus(webhook.status ?? "active");
    setWebhookSecret("");
    setShowSecret(false);
    setAllowedIps([]);
    setNewIpInput("");
    setSigningSecretLast4(null);
    setIsDialogOpen(true);
    setIsDialogLoading(true);

    try {
      const response = await api(`/webhooks/${webhook.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch webhook details");
      }
      const data = await response.json();
      const item: ApiWebhookDetail = data?.item ?? data;
      const retry = item.retry ?? {};

      setEndpointUrl(item.endpoint_url ?? webhook.endpoint_url);
      setSelectedEvents(item.event_types ?? webhook.event_types);
      setMaxRetries(retry.max_retries ?? webhook.maxRetries ?? 3);
      setRetryInterval(retry.interval_seconds ?? webhook.retryIntervalSeconds ?? 5);
      setTimeoutSeconds(item.timeout_seconds ?? webhook.timeoutSeconds ?? 30);
      setStatus(item.status ?? webhook.status ?? "active");
      setWebhookSecret(item.signing_secret ?? webhook.secret ?? "");
      setAllowedIps(item.ip_allowlist ?? webhook.allowedIps ?? []);
      setSigningSecretLast4(item.signing_secret_last4 ?? null);
    } catch (error) {
      toast.error("Failed to load webhook details");
      setEndpointUrl(webhook.endpoint_url);
      setSelectedEvents([...webhook.event_types]);
      setMaxRetries(webhook.maxRetries);
      setRetryInterval(webhook.retryIntervalSeconds);
      setTimeoutSeconds(webhook.timeoutSeconds);
      setStatus(webhook.status ?? "active");
      setWebhookSecret(webhook.secret);
      setAllowedIps([...webhook.allowedIps]);
      setSigningSecretLast4(null);
    } finally {
      setIsDialogLoading(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (isDialogLoading) {
      return;
    }
    if (!endpointUrl || endpointUrl === "https://") {
      toast.error("Please enter a valid endpoint URL");
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error("Please select at least one event");
      return;
    }

    if (webhookToEdit) {
      // Update existing webhook
      const resolvedSecret = webhookSecret.trim() || webhookToEdit.secret;
      const payload = {
        status,
        event_types: selectedEvents,
        timeout_seconds: timeoutSeconds,
        endpoint_url: endpointUrl,
        signing_secret: resolvedSecret,
        retry: {
          max_retries: maxRetries,
          interval_seconds: retryInterval,
        },
        ip_allowlist: allowedIps,
      };

      try {
        setIsDialogLoading(true);
        const response = await api(`/webhooks/${webhookToEdit.id}`, {
          method: "PATCH",
          body: payload,
        });

        if (!response.ok) {
          let errorMessage = "Failed to update webhook";
          try {
            const errorData = await response.json();
            errorMessage = errorData?.message ?? errorData?.error ?? errorMessage;
          } catch {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        const item = data?.item ?? data;
        const mappedWebhook = mapWebhookItem(item);
        setWebhooks(prev => prev.map(w => (w.id === webhookToEdit.id ? mappedWebhook : w)));
        toast.success("Webhook updated successfully");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update webhook";
        toast.error(message);
        return;
      } finally {
        setIsDialogLoading(false);
      }
    } else {
      const payload = {
        status,
        endpoint_url: endpointUrl,
        event_types: selectedEvents,
        signing_secret: webhookSecret.trim() || "auto",
        retry: {
          max_retries: maxRetries,
          interval_seconds: retryInterval,
        },
        ip_allowlist: allowedIps,
        timeout_seconds: timeoutSeconds,
      };

      try {
        const response = await api("/webhooks", {
          method: "POST",
          body: payload,
        });

        if (!response.ok) {
          let errorMessage = "Failed to create webhook";
          try {
            const errorData = await response.json();
            errorMessage = errorData?.message ?? errorData?.error ?? errorMessage;
          } catch {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        const item = data?.item ?? data;
        const mappedWebhook = mapWebhookItem(item);

        setWebhooks(prev => [mappedWebhook, ...prev]);
        toast.success("Webhook added successfully");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create webhook";
        toast.error(message);
        return;
      }
    }

    setIsDialogOpen(false);
    setWebhookToEdit(null);
    setEndpointUrl("https://");
    setSelectedEvents([]);
    setStatus("active");
  };

  const handleDeleteWebhook = () => {
    if (webhookToDelete) {
      setWebhooks(prev => prev.filter(w => w.id !== webhookToDelete.id));
      toast.success("Webhook deleted");
      setWebhookToDelete(null);
    }
  };

  const getTestPayload = (webhook: SavedWebhook) => {
    const eventType = webhook.event_types[0] || "email.delivered";
    return {
      type: eventType,
      created_at: new Date().toISOString(),
      data: {
        id: "test_" + crypto.randomUUID().slice(0, 8),
        object: eventType.split(".")[0],
        test: true,
      },
    };
  };

  // Generate HMAC-SHA256 signature
  const generateHmacSignature = async (payload: string, secret: string): Promise<string> => {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const mapDeliveryStatus = (status?: string): DeliveryLogEntry["status"] => {
    const normalized = status?.toLowerCase() ?? "";
    if (["success", "succeeded", "delivered"].includes(normalized)) return "success";
    if (["failed", "error"].includes(normalized)) return "failed";
    if (["retrying", "retry", "retry_scheduled"].includes(normalized)) return "retrying";
    return "pending";
  };

  const fetchDeliveryLogs = useCallback(async (webhook: SavedWebhook, cursor?: string) => {
    try {
      if (cursor) {
        setIsDeliveryLogFetchingNext(true);
      } else {
        setIsDeliveryLogLoading(true);
      }
      const queryString = cursor ? `?${new URLSearchParams({ cursor }).toString()}` : "";
      const response = await api(`/webhooks/${webhook.id}/deliveries${queryString}`);
      if (!response.ok) {
        throw new Error("Failed to fetch delivery logs");
      }
      const data = await response.json();
      const items: ApiDeliveryItem[] = data?.items ?? data?.deliveries ?? [];
      const mappedEntries: DeliveryLogEntry[] = items.map((item) => {
        const timestamp = item.delivered_at ?? item.failed_at ?? item.created_at ?? item.updated_at;
        const status = mapDeliveryStatus(item.status);
        const attemptCount = item.attempt_count ?? 1;
        const maxAttempts = item.max_attempts ?? webhook.maxRetries + 1;
        const statusMessage = item.error ?? item.status ?? "Delivery queued.";

        return {
          id: item.delivery_id ?? crypto.randomUUID(),
          deliveryId: item.delivery_id ?? "unknown",
          webhookId: webhook.id,
          endpointUrl: item.endpoint_url ?? webhook.endpoint_url,
          eventType: item.event_type ?? "unknown",
          status,
          statusMessage,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          attempt: attemptCount,
          maxRetries: Math.max(0, maxAttempts - 1),
        };
      });

      setDeliveryLog(prev => (cursor ? [...prev, ...mappedEntries] : mappedEntries));
      setDeliveryLogCursor(data?.next_cursor ?? null);
    } catch (error) {
      toast.error("Failed to load delivery logs");
    } finally {
      setIsDeliveryLogLoading(false);
      setIsDeliveryLogFetchingNext(false);
    }
  }, []);

  const handleTestWebhook = async () => {
    if (!webhookToTest) return;

    setIsTestingWebhook(true);
    setTestResult(null);

    const payload = getTestPayload(webhookToTest);
    try {
      const response = await api(`/webhooks/${webhookToTest.id}`, {
        method: "POST",
        body: { event_type: payload.type },
      });

      if (!response.ok) {
        let errorMessage = "Failed to send test webhook";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message ?? errorData?.error ?? errorMessage;
        } catch {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const result = data?.item ?? data ?? {};
      const deliveryId = result.delivery_id ?? "unknown";
      const eventType = result.event_type ?? payload.type;
      const success = Boolean(result.success ?? true);

      setTestResult({
        success,
        message: success
          ? `Delivery ${deliveryId} queued for ${eventType}.`
          : `Delivery ${deliveryId} failed for ${eventType}.`,
      });

      setDeliveryLogWebhook(webhookToTest);
      setDeliveryLog([]);
      setDeliveryLogCursor(null);
      await fetchDeliveryLogs(webhookToTest);
      setShowDeliveryLog(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send test webhook";
      setTestResult({
        success: false,
        message,
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const openTestDialog = async (webhook: SavedWebhook) => {
    setWebhookToTest(webhook);
    setTestResult(null);
    
    // Pre-generate signature for display
    const payload = getTestPayload(webhook);
    const signature = await generateHmacSignature(JSON.stringify(payload), webhook.secret);
    setGeneratedSignature(signature);
  };

  const formatLogTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleRefreshDeliveryLog = async () => {
    if (!deliveryLogWebhook) return;
    await fetchDeliveryLogs(deliveryLogWebhook);
  };

  const toggleEvent = (eventId: string) => {
    if (isDialogLoading) return;
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  const toggleGroup = (group: EventGroup) => {
    if (isDialogLoading) return;
    const groupEventIds = group.events.map(e => e.id);
    const allSelected = groupEventIds.every(id => selectedEvents.includes(id));
    
    if (allSelected) {
      setSelectedEvents(prev => prev.filter(id => !groupEventIds.includes(id)));
    } else {
      setSelectedEvents(prev => [...new Set([...prev, ...groupEventIds])]);
    }
  };

  const toggleAllEvents = () => {
    if (isDialogLoading) return;
    if (selectedEvents.length === allEventIds.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents([...allEventIds]);
    }
  };

  const isGroupSelected = (group: EventGroup) => {
    return group.events.every(e => selectedEvents.includes(e.id));
  };

  const getDisplayText = () => {
    if (selectedEvents.length === 0) return "Select events...";
    if (selectedEvents.length === allEventIds.length) return "All Events";
    if (selectedEvents.length === 1) return selectedEvents[0];
    return `${selectedEvents.length} events selected`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDialogOpen && e.metaKey && e.key === "Enter") {
        e.preventDefault();
        if (!isDialogLoading) {
          handleSaveWebhook();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDialogOpen, endpointUrl, selectedEvents, webhookToEdit, isDialogLoading]);

  useEffect(() => {
    let isMounted = true;
    const loadWebhooks = async () => {
      setIsLoading(true);
      await fetchWebhooks();
      if (isMounted) {
        setIsLoading(false);
      }
    };
    loadWebhooks();
    return () => {
      isMounted = false;
    };
  }, [fetchWebhooks]);

  useEffect(() => {
    if (!loadMoreRef.current || !nextCursor || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNext) {
          setIsFetchingNext(true);
          fetchWebhooks(nextCursor).finally(() => {
            setIsFetchingNext(false);
          });
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [fetchWebhooks, isFetchingNext, isLoading, nextCursor]);

  return (
    <>
      <TopBar 
        title="Webhooks" 
        subtitle="Receive real-time updates about email events"
        action={{
          label: "Add webhook",
          onClick: openAddDialog,
        }}
      />
      
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <Card key={`skeleton-${index}`}>
                <CardContent className="p-4 animate-pulse">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-muted" />
                        <div className="h-4 w-56 bg-muted rounded" />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <div className="h-5 w-20 rounded-full bg-muted" />
                        <div className="h-5 w-16 rounded-full bg-muted" />
                        <div className="h-5 w-24 rounded-full bg-muted" />
                      </div>
                      <div className="flex items-center gap-4 pt-2 border-t border-border">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 flex-1 max-w-[120px] bg-muted rounded" />
                        <div className="h-4 w-16 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : webhooks.length === 0 ? (
          <EmptyState
            icon={Webhook}
            title="No webhooks yet"
            description="Configure webhooks to receive real-time updates when emails are delivered, opened, clicked, or bounced."
            action={{
              label: "Add webhook",
              onClick: openAddDialog,
            }}
          />
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-2">
                        <Webhook className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a 
                          href={webhook.endpoint_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-foreground hover:underline truncate flex items-center gap-1"
                        >
                          {webhook.endpoint_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {webhook.event_types.length === allEventIds.length ? (
                          <Badge variant="secondary" className="text-xs">All Events</Badge>
                        ) : (
                          webhook.event_types.slice(0, 5).map((eventId) => (
                            <Badge key={eventId} variant="outline" className="text-xs gap-1">
                              <span className={cn("w-1.5 h-1.5 rounded-full", getEventColor(eventId))} />
                              {eventId}
                            </Badge>
                          ))
                        )}
                        {webhook.event_types.length > 5 && webhook.event_types.length !== allEventIds.length && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.event_types.length - 5} more
                          </Badge>
                        )}
                      </div>
                      
                      {/* Delivery Statistics */}
                      {(() => {
                        const stats = getWebhookStats(webhook.stats_7d);
                        if (!stats) return null;
                        
                        return (
                          <div className="flex items-center gap-4 pt-2 border-t border-border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <BarChart3 className="h-3.5 w-3.5" />
                              <span>{stats.total} deliveries</span>
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                              <Progress 
                                value={stats.successRate} 
                                className="h-1.5 flex-1 max-w-[120px]"
                              />
                              <span className={cn(
                                "text-xs font-medium",
                                stats.successRate >= 90 ? "text-success" : 
                                stats.successRate >= 50 ? "text-warning" : "text-destructive"
                              )}>
                                {stats.successRate}%
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="flex items-center gap-1 text-success">
                                <CheckCircle2 className="h-3 w-3" />
                                {stats.success}
                              </span>
                              <span className="flex items-center gap-1 text-destructive">
                                <XCircle className="h-3 w-3" />
                                {stats.failed}
                              </span>
                              {stats.pending > 0 && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  {stats.pending}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openTestDialog(webhook)}>
                          <Play className="h-4 w-4 mr-2" />
                          Test
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(webhook)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setWebhookToDelete(webhook)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
            {nextCursor && (
              <div ref={loadMoreRef} className="h-8" />
            )}
            {isFetchingNext && (
              <Card>
                <CardContent className="p-4 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-muted" />
                    <div className="h-4 w-40 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Delivery Log Section */}
        {(deliveryLogWebhook || deliveryLog.length > 0) && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <button
                onClick={() => {
                  const nextOpen = !showDeliveryLog;
                  setShowDeliveryLog(nextOpen);
                  if (nextOpen && deliveryLogWebhook) {
                    fetchDeliveryLogs(deliveryLogWebhook);
                  }
                }}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Delivery Log</span>
                  <Badge variant="secondary" className="text-xs">{deliveryLog.length}</Badge>
                </div>
                <svg
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    showDeliveryLog && "rotate-180"
                  )}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {showDeliveryLog && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {deliveryLogWebhook
                        ? `Webhook: ${deliveryLogWebhook.endpoint_url}`
                        : "Delivery log"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1"
                      onClick={handleRefreshDeliveryLog}
                      disabled={isDeliveryLogLoading}
                    >
                      <RefreshCw className={cn("h-3 w-3", isDeliveryLogLoading && "animate-spin")} />
                      Refresh
                    </Button>
                  </div>
                  {isDeliveryLogLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading deliveries...
                    </div>
                  ) : deliveryLog.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No delivery logs available yet.</div>
                  ) : deliveryLog.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="flex items-start gap-3 p-3 rounded-md bg-muted/50 text-sm"
                    >
                      <div className="mt-0.5">
                        {entry.status === "success" && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                        {entry.status === "failed" && (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        {entry.status === "pending" && (
                          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                        )}
                        {entry.status === "retrying" && (
                          <RefreshCw className="h-4 w-4 text-warning animate-spin" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs gap-1">
                            <span className={cn("w-1.5 h-1.5 rounded-full", getEventColor(entry.eventType))} />
                            {entry.eventType}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            ID {entry.deliveryId}
                          </Badge>
                          {entry.attempt > 1 && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <RefreshCw className="h-2.5 w-2.5" />
                              Attempt {entry.attempt}/{entry.maxRetries + 1}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {entry.endpointUrl}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {entry.statusMessage}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatLogTime(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {deliveryLogCursor && (
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          if (!deliveryLogWebhook || !deliveryLogCursor) return;
                          fetchDeliveryLogs(deliveryLogWebhook, deliveryLogCursor);
                        }}
                        disabled={isDeliveryLogFetchingNext}
                      >
                        {isDeliveryLogFetchingNext ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load more"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setIsDialogLoading(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{webhookToEdit ? "Edit Webhook" : "Add Webhook"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {isDialogLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading webhook details...
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input
                id="endpoint"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="https://"
                disabled={isDialogLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus} disabled={isDialogLoading}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Events types</Label>
              <Popover open={isEventsOpen} onOpenChange={setIsEventsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isEventsOpen}
                    className="w-full justify-between font-normal"
                    disabled={isDialogLoading}
                  >
                    {getDisplayText()}
                    <svg
                      className={cn(
                        "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
                        isEventsOpen && "rotate-180"
                      )}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-[250px] overflow-hidden" align="start">
                  <div className="max-h-[250px] overflow-y-auto">
                    {/* All Events option */}
                    <div
                      className={cn(
                        "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted",
                        selectedEvents.length === allEventIds.length && "bg-muted",
                        isDialogLoading && "pointer-events-none opacity-60"
                      )}
                      onClick={toggleAllEvents}
                    >
                      <span className="font-medium">All Events</span>
                      {selectedEvents.length === allEventIds.length && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>

                    {/* Event Groups */}
                    {eventGroups.map((group) => (
                      <div key={group.name}>
                        {/* Group Header */}
                        <div
                          className={cn(
                            "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted border-t border-border",
                            isGroupSelected(group) && "bg-muted",
                            isDialogLoading && "pointer-events-none opacity-60"
                          )}
                          onClick={() => toggleGroup(group)}
                        >
                          <span className="font-medium text-sm text-muted-foreground">
                            {group.name}
                          </span>
                          {isGroupSelected(group) && (
                            <Check className="h-4 w-4" />
                          )}
                        </div>

                        {/* Group Events */}
                        {group.events.map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted pl-4",
                              selectedEvents.includes(event.id) && "bg-muted",
                              isDialogLoading && "pointer-events-none opacity-60"
                            )}
                            onClick={() => toggleEvent(event.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  colorMap[event.color]
                                )}
                              />
                              <span>{event.label}</span>
                              {event.tooltip && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">{event.tooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            {selectedEvents.includes(event.id) && (
                              <Check className="h-4 w-4" />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Signing Secret */}
            <div className="space-y-3 pt-2 border-t border-border">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Key className="h-3.5 w-3.5" />
                Signing Secret
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showSecret ? "text" : "password"}
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="pr-20 font-mono text-xs"
                    placeholder={signingSecretLast4 ? `••••${signingSecretLast4}` : "whsec_..."}
                    disabled={isDialogLoading}
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowSecret(!showSecret)}
                      disabled={isDialogLoading}
                    >
                      {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(webhookSecret, "Secret")}
                      disabled={isDialogLoading}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWebhookSecret(generateSecret())}
                  disabled={isDialogLoading}
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this secret to verify webhook signatures with HMAC-SHA256.
              </p>
            </div>

            {/* Retry Configuration */}
            <div className="space-y-3 pt-2 border-t border-border">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Configuration
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="maxRetries" className="text-xs">Max Retries</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    min={0}
                    max={10}
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                    className="h-9"
                    disabled={isDialogLoading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="retryInterval" className="text-xs">Interval (seconds)</Label>
                  <Input
                    id="retryInterval"
                    type="number"
                    min={1}
                    max={60}
                    value={retryInterval}
                    onChange={(e) => setRetryInterval(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
                    className="h-9"
                    disabled={isDialogLoading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="timeoutSeconds" className="text-xs">Timeout (seconds)</Label>
                  <Input
                    id="timeoutSeconds"
                    type="number"
                    min={1}
                    max={120}
                    value={timeoutSeconds}
                    onChange={(e) => setTimeoutSeconds(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                    className="h-9"
                    disabled={isDialogLoading}
                  />
                </div>
              </div>
            </div>

            {/* IP Allowlist */}
            <div className="space-y-3 pt-2 border-t border-border">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                IP Allowlist
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newIpInput}
                  onChange={(e) => setNewIpInput(e.target.value)}
                  placeholder="192.168.1.1 or 10.0.0.0/24"
                  className="flex-1"
                  disabled={isDialogLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addIpAddress();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addIpAddress}
                  disabled={isDialogLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {allowedIps.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allowedIps.map((ip) => (
                    <Badge key={ip} variant="secondary" className="gap-1 pr-1">
                      {ip}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 hover:bg-destructive/20"
                        onClick={() => removeIpAddress(ip)}
                        disabled={isDialogLoading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {allowedIps.length === 0 
                  ? "No restrictions. Add IPs to restrict webhook delivery to specific addresses."
                  : "Webhooks will only be delivered to these IP addresses."}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveWebhook} className="gap-2" disabled={isDialogLoading}>
                {webhookToEdit ? "Save" : "Add"}
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="gap-2" disabled={isDialogLoading}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!webhookToDelete}
        onOpenChange={(open) => !open && setWebhookToDelete(null)}
        onConfirm={handleDeleteWebhook}
        title="Delete Webhook"
        description={`Are you sure you want to delete the webhook for "${webhookToDelete?.endpoint_url}"? This action cannot be undone.`}
      />

      <Dialog open={!!webhookToTest} onOpenChange={(open) => !open && setWebhookToTest(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Test Webhook</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Endpoint</Label>
              <p className="text-sm font-medium truncate">{webhookToTest?.endpoint_url}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Sample Payload</Label>
              <CodeBlock 
                code={webhookToTest ? JSON.stringify(getTestPayload(webhookToTest), null, 2) : ""} 
                language="json"
              />
            </div>

            {webhookToTest?.secret && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm flex items-center gap-2">
                  <Key className="h-3.5 w-3.5" />
                  Signature Header
                </Label>
                <div className="bg-muted rounded-md p-3 font-mono text-xs break-all">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">X-Webhook-Signature:</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => copyToClipboard(`sha256=${generatedSignature}`, "Signature")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-foreground">sha256={generatedSignature}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Verify this signature on your server using HMAC-SHA256 with your secret key.
                </p>
              </div>
            )}

            {testResult && (
              <div className={cn(
                "p-3 rounded-md text-sm",
                testResult.success 
                  ? "bg-success/10 text-success border border-success/20" 
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              )}>
                {testResult.message}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleTestWebhook} disabled={isTestingWebhook} className="gap-2">
                {isTestingWebhook ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Send Test
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setWebhookToTest(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
