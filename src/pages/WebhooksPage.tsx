import { useState, useEffect } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { EmptyState } from "@/components/ui/empty-state";
import { Webhook, Check, Info, MoreHorizontal, Trash2, ExternalLink, Pencil, Play, Loader2, Clock, CheckCircle2, XCircle, History, RefreshCw } from "lucide-react";
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
import { cn } from "@/lib/utils";
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

interface SavedWebhook {
  id: string;
  endpointUrl: string;
  events: string[];
  createdAt: Date;
  maxRetries: number;
  retryIntervalSeconds: number;
}

interface DeliveryLogEntry {
  id: string;
  webhookId: string;
  endpointUrl: string;
  eventType: string;
  status: "success" | "failed" | "pending" | "retrying";
  statusMessage: string;
  timestamp: Date;
  payload: object;
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
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryInterval, setRetryInterval] = useState(5);

  const openAddDialog = () => {
    setWebhookToEdit(null);
    setEndpointUrl("https://");
    setSelectedEvents([]);
    setMaxRetries(3);
    setRetryInterval(5);
    setIsDialogOpen(true);
  };

  const openEditDialog = (webhook: SavedWebhook) => {
    setWebhookToEdit(webhook);
    setEndpointUrl(webhook.endpointUrl);
    setSelectedEvents([...webhook.events]);
    setMaxRetries(webhook.maxRetries);
    setRetryInterval(webhook.retryIntervalSeconds);
    setIsDialogOpen(true);
  };

  const handleSaveWebhook = () => {
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
      setWebhooks(prev => prev.map(w => 
        w.id === webhookToEdit.id 
          ? { ...w, endpointUrl, events: selectedEvents, maxRetries, retryIntervalSeconds: retryInterval }
          : w
      ));
      toast.success("Webhook updated successfully");
    } else {
      // Add new webhook
      const newWebhook: SavedWebhook = {
        id: crypto.randomUUID(),
        endpointUrl,
        events: selectedEvents,
        createdAt: new Date(),
        maxRetries,
        retryIntervalSeconds: retryInterval,
      };
      setWebhooks(prev => [...prev, newWebhook]);
      toast.success("Webhook added successfully");
    }

    setIsDialogOpen(false);
    setWebhookToEdit(null);
    setEndpointUrl("https://");
    setSelectedEvents([]);
  };

  const handleDeleteWebhook = () => {
    if (webhookToDelete) {
      setWebhooks(prev => prev.filter(w => w.id !== webhookToDelete.id));
      toast.success("Webhook deleted");
      setWebhookToDelete(null);
    }
  };

  const getTestPayload = (webhook: SavedWebhook) => {
    const eventType = webhook.events[0] || "email.delivered";
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

  const sendWebhookRequest = async (
    webhook: SavedWebhook,
    payload: object,
    logEntryId: string,
    attempt: number
  ): Promise<boolean> => {
    try {
      await fetch(webhook.endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        mode: "no-cors",
      });
      return true;
    } catch {
      return false;
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookToTest) return;

    setIsTestingWebhook(true);
    setTestResult(null);

    const payload = getTestPayload(webhookToTest);
    const logEntryId = crypto.randomUUID();
    const logEntry: DeliveryLogEntry = {
      id: logEntryId,
      webhookId: webhookToTest.id,
      endpointUrl: webhookToTest.endpointUrl,
      eventType: payload.type,
      status: "pending",
      statusMessage: "Sending...",
      timestamp: new Date(),
      payload,
      attempt: 1,
      maxRetries: webhookToTest.maxRetries,
    };

    setDeliveryLog(prev => [logEntry, ...prev].slice(0, 50));

    let success = false;
    let currentAttempt = 1;
    const maxAttempts = webhookToTest.maxRetries + 1;

    while (currentAttempt <= maxAttempts && !success) {
      if (currentAttempt > 1) {
        // Update log to show retrying
        setDeliveryLog(prev => prev.map(entry => 
          entry.id === logEntryId 
            ? { 
                ...entry, 
                status: "retrying" as const, 
                statusMessage: `Retry ${currentAttempt - 1}/${webhookToTest.maxRetries}...`,
                attempt: currentAttempt,
              }
            : entry
        ));
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, webhookToTest.retryIntervalSeconds * 1000));
      }

      success = await sendWebhookRequest(webhookToTest, payload, logEntryId, currentAttempt);
      
      if (!success && currentAttempt < maxAttempts) {
        currentAttempt++;
      } else {
        break;
      }
    }

    if (success) {
      const successMessage = "Test payload sent. Due to browser security restrictions, we cannot verify the response. Check your endpoint logs to confirm receipt.";
      
      setDeliveryLog(prev => prev.map(entry => 
        entry.id === logEntryId 
          ? { ...entry, status: "success" as const, statusMessage: successMessage, attempt: currentAttempt }
          : entry
      ));
      
      setTestResult({
        success: true,
        message: currentAttempt > 1 
          ? `Succeeded on attempt ${currentAttempt}. ${successMessage}`
          : successMessage,
      });
    } else {
      const errorMessage = `Failed after ${currentAttempt} attempt${currentAttempt > 1 ? 's' : ''}. Check your endpoint URL.`;
      
      setDeliveryLog(prev => prev.map(entry => 
        entry.id === logEntryId 
          ? { ...entry, status: "failed" as const, statusMessage: errorMessage, attempt: currentAttempt }
          : entry
      ));
      
      setTestResult({
        success: false,
        message: errorMessage,
      });
    }

    setIsTestingWebhook(false);
  };

  const openTestDialog = (webhook: SavedWebhook) => {
    setWebhookToTest(webhook);
    setTestResult(null);
  };

  const formatLogTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  const toggleGroup = (group: EventGroup) => {
    const groupEventIds = group.events.map(e => e.id);
    const allSelected = groupEventIds.every(id => selectedEvents.includes(id));
    
    if (allSelected) {
      setSelectedEvents(prev => prev.filter(id => !groupEventIds.includes(id)));
    } else {
      setSelectedEvents(prev => [...new Set([...prev, ...groupEventIds])]);
    }
  };

  const toggleAllEvents = () => {
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
        handleSaveWebhook();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDialogOpen, endpointUrl, selectedEvents, webhookToEdit]);

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
        {webhooks.length === 0 ? (
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
                          href={webhook.endpointUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-foreground hover:underline truncate flex items-center gap-1"
                        >
                          {webhook.endpointUrl}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {webhook.events.length === allEventIds.length ? (
                          <Badge variant="secondary" className="text-xs">All Events</Badge>
                        ) : (
                          webhook.events.slice(0, 5).map((eventId) => (
                            <Badge key={eventId} variant="outline" className="text-xs gap-1">
                              <span className={cn("w-1.5 h-1.5 rounded-full", getEventColor(eventId))} />
                              {eventId}
                            </Badge>
                          ))
                        )}
                        {webhook.events.length > 5 && webhook.events.length !== allEventIds.length && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 5} more
                          </Badge>
                        )}
                      </div>
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
          </div>
        )}

        {/* Delivery Log Section */}
        {deliveryLog.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <button
                onClick={() => setShowDeliveryLog(!showDeliveryLog)}
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
                  {deliveryLog.map((entry) => (
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
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        {formatLogTime(entry.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{webhookToEdit ? "Edit Webhook" : "Add Webhook"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input
                id="endpoint"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="https://"
              />
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
                        selectedEvents.length === allEventIds.length && "bg-muted"
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
                            isGroupSelected(group) && "bg-muted"
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
                              selectedEvents.includes(event.id) && "bg-muted"
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

            {/* Retry Configuration */}
            <div className="space-y-3 pt-2 border-t border-border">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Configuration
              </Label>
              <div className="grid grid-cols-2 gap-3">
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
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveWebhook} className="gap-2">
                {webhookToEdit ? "Save" : "Add"}
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="gap-2">
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
        description={`Are you sure you want to delete the webhook for "${webhookToDelete?.endpointUrl}"? This action cannot be undone.`}
      />

      <Dialog open={!!webhookToTest} onOpenChange={(open) => !open && setWebhookToTest(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Test Webhook</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Endpoint</Label>
              <p className="text-sm font-medium truncate">{webhookToTest?.endpointUrl}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Sample Payload</Label>
              <CodeBlock 
                code={webhookToTest ? JSON.stringify(getTestPayload(webhookToTest), null, 2) : ""} 
                language="json"
              />
            </div>

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
