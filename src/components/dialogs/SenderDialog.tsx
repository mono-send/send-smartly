import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Loader2, AlertTriangle } from "lucide-react";

export interface SenderData {
  name: string;
  from: string;
  domain_id: string;
  reply_to?: string;
}

interface Domain {
  id: string;
  domain: string;
  name?: string;
  status?: "pending" | "unverified" | "verified" | "suspended";
}

interface SenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  editingSenderId?: string | null;
  onSubmit: (data: SenderData) => void;
  isSubmitting?: boolean;
}

export function SenderDialog({
  open,
  onOpenChange,
  mode,
  editingSenderId,
  onSubmit,
  isSubmitting = false,
}: SenderDialogProps) {
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [domainId, setDomainId] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const [isLoadingSender, setIsLoadingSender] = useState(false);

  // Fetch sender details when editing
  useEffect(() => {
    if (open && mode === "edit" && editingSenderId) {
      fetchSenderDetails(editingSenderId);
    } else if (open && mode === "create") {
      setName("");
      setFrom("");
      setDomainId("");
      setReplyTo("");
    }
  }, [open, mode, editingSenderId]);

  const fetchSenderDetails = async (senderId: string) => {
    try {
      setIsLoadingSender(true);
      const response = await api(`/senders/${senderId}`);
      if (response.ok) {
        const data = await response.json();
        setName(data.name || "");
        setFrom(data.from || "");
        setDomainId(data.domain?.id || "");
        setReplyTo(data.reply_to || "");
      }
    } catch (error) {
      console.error("Failed to fetch sender details:", error);
    } finally {
      setIsLoadingSender(false);
    }
  };

  useEffect(() => {
    if (open && domains.length === 0) {
      fetchDomains();
    }
  }, [open, domains.length]);

  const fetchDomains = async () => {
    try {
      setIsLoadingDomains(true);
      const response = await api("/domains");
      if (response.ok) {
        const data = await response.json();
        const domainItems = Array.isArray(data) ? data : data.items || [];
        const normalizedDomains = domainItems
          .map((domain: any) => ({
            id: domain.id,
            domain: domain.domain || domain.name || "",
            name: domain.name,
            status: domain.status,
          }))
          .filter((domain: Domain) => domain.domain);
        setDomains(normalizedDomains);
      }
    } catch (error) {
      console.error("Failed to fetch domains:", error);
    } finally {
      setIsLoadingDomains(false);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      name,
      from,
      domain_id: domainId,
      reply_to: replyTo || undefined,
    });
  };

  const isEdit = mode === "edit";
  const isFormValid = name.trim() !== "" && from.trim() !== "" && domainId !== "";

  // Get the selected domain to check its status
  const selectedDomain = domains.find((d) => d.id === domainId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit sender" : "Add sender"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the sender information."
              : "Create a new sender for your account."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoadingSender ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="senderName">Sender name</Label>
                <Input
                  id="senderName"
                  placeholder="e.g., Marketing Team"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromEmail">From email</Label>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <Input
                    id="fromEmail"
                    placeholder="e.g., no-reply"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="md:flex-1"
                  />
                  <span className="hidden text-sm font-medium text-muted-foreground md:inline">@</span>
                  {isLoadingDomains ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading domains...
                    </div>
                  ) : domains.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No domains available</p>
                  ) : (
                    <div className="md:flex-1">
                      <Select value={domainId} onValueChange={setDomainId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a domain" />
                        </SelectTrigger>
                        <SelectContent>
                          {domains.map((domain) => (
                            <SelectItem key={domain.id} value={domain.id}>
                              {domain.domain}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the local part of the email (before @)
                </p>
              </div>

              {selectedDomain && selectedDomain.status === "unverified" && (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Unverified domain</AlertTitle>
                  <AlertDescription>
                    This domain has not been verified yet. Emails sent from this sender may have lower
                    deliverability or be marked as spam. Please verify your domain to ensure optimal email delivery.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="replyTo">Reply-to (optional)</Label>
                <Input
                  id="replyTo"
                  placeholder="e.g., support@example.com"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                />
              </div>

              <div className="rounded-lg border border-muted bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Tip:</span> Marketing emails such as product updates or
                feature announcements get higher engagement when sent from a real person’s name.
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button className="h-9" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button className="h-9" onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Saving..." : "Creating..."}
              </>
            ) : (
              isEdit ? "Save changes" : "Create sender"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
