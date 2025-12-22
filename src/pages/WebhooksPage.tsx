import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TopBar } from "@/components/layout/TopBar";
import { EmptyState } from "@/components/ui/empty-state";
import { Webhook, Check, Info } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

export default function WebhooksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState("https://");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isEventsOpen, setIsEventsOpen] = useState(false);

  const handleAddWebhook = () => {
    // TODO: Add webhook logic
    console.log("Adding webhook:", { endpointUrl, selectedEvents });
    setIsDialogOpen(false);
    setEndpointUrl("https://");
    setSelectedEvents([]);
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

  const isGroupPartiallySelected = (group: EventGroup) => {
    const selected = group.events.filter(e => selectedEvents.includes(e.id));
    return selected.length > 0 && selected.length < group.events.length;
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
        handleAddWebhook();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDialogOpen, endpointUrl, selectedEvents]);

  return (
    <DashboardLayout>
      <TopBar 
        title="Webhooks" 
        subtitle="Receive real-time updates about email events"
        action={{
          label: "Add webhook",
          onClick: () => setIsDialogOpen(true),
        }}
      />
      
      <div className="p-6">
        <EmptyState
          icon={Webhook}
          title="No webhooks yet"
          description="Configure webhooks to receive real-time updates when emails are delivered, opened, clicked, or bounced."
          action={{
            label: "Add webhook",
            onClick: () => setIsDialogOpen(true),
          }}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
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
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <div className="max-h-[300px] overflow-y-auto">
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

            <div className="flex gap-2 pt-2">
              <Button onClick={handleAddWebhook} className="gap-2">
                Add
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>↵
                </kbd>
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="gap-2">
                Cancel
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  Esc
                </kbd>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
