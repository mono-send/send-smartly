import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CardContent } from "@/components/ui/card";
import {
  Mail,
  Copy,
  Check,
  ChevronLeft,
  MoreVertical,
  Send,
  CheckCircle,
  Code,
  BookOpen,
  Loader2,
  Monitor,
  Smartphone,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmActionDialog } from "@/components/dialogs/ConfirmActionDialog";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";
import { APISection } from "@/components/APISection";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EmailEvent {
  status: string;
  created_at: string;
}

interface EmailDetails {
  id: string;
  to_email: string;
  from_email: string;
  subject: string;
  body: string;
  plain_text?: string;
  text_body?: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  contact_id: string | null;
  domain_id: string | null;
  template_id: string | null;
  broadcast_id: string | null;
  api_key_id: string | null;
  events: EmailEvent[];
}

export default function EmailDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [showResendDialog, setShowResendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApiSection, setShowApiSection] = useState(false);
  const [email, setEmail] = useState<EmailDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    const fetchEmailDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const response = await api(`/emails/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch email details");
        }
        
        const data: EmailDetails = await response.json();
        setEmail(data);
      } catch (error) {
        console.error("Failed to fetch email details:", error);
        toast.error("Failed to load email details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmailDetails();
  }, [id]);

  const handleResend = () => {
    if (email) {
      toast.success(`Email to "${email.to_email}" queued for resend`);
    }
    setShowResendDialog(false);
  };

  const handleDelete = () => {
    toast.success("Email deleted");
    setShowDeleteDialog(false);
    navigate("/emails");
  };

  const copyToClipboard = async (text: string, type: "id" | "content") => {
    await navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  const truncateId = (id: string) => {
    if (id.length <= 20) return id;
    return id.substring(0, 20) + "...";
  };

  const formatEventDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, h:mm a");
    } catch {
      return dateString;
    }
  };

  const derivePlainTextFromHtml = (html: string) => {
    if (!html) return "";
    if (typeof DOMParser === "undefined") {
      return html;
    }
    const parsed = new DOMParser().parseFromString(html, "text/html");
    return parsed.body.textContent ?? "";
  };

  const getEventLabel = (status: string) => {
    const labels: Record<string, string> = {
      queued: "Queued",
      sent: "Sent",
      delivered: "Delivered",
      opened: "Opened",
      clicked: "Clicked",
      bounced: "Bounced",
      failed: "Failed",
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const isSuccessEvent = (status: string) => {
    return ["delivered", "opened", "clicked"].includes(status);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/emails")}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Emails
        </Button>

        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-7 w-48" />
            </div>
          </div>
        </div>

        <div className="mb-8 grid overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm md:grid-cols-4 md:divide-x">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-b md:border-b-0">
              <CardContent className="flex flex-col gap-2 py-6">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-32" />
              </CardContent>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <Skeleton className="h-3 w-24 mb-4" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>

        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/emails")}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Emails
        </Button>
        <div className="text-center text-muted-foreground py-12">
          Email not found
        </div>
      </div>
    );
  }

  const plainTextContent =
    email.plain_text ??
    email.text_body ??
    derivePlainTextFromHtml(email.body);

  return (
    <div className="p-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/emails")}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Emails
        </Button>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-muted/30">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <h1 className="text-2xl font-semibold">{email.to_email}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowApiSection(true)}>
              <Code className="h-4 w-4" />
              API
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Docs
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowResendDialog(true)}>
                  Resend
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-8 grid overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm md:grid-cols-4 md:divide-x">
          <div className="border-b md:border-b-0">
            <CardContent className="flex flex-col gap-2 py-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">From</p>
              <p className="text-sm font-medium">{email.from_email}</p>
            </CardContent>
          </div>
          <div className="border-b md:border-b-0">
            <CardContent className="flex flex-col gap-2 py-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Subject</p>
              <p className="text-sm font-medium">{email.subject}</p>
            </CardContent>
          </div>
          <div className="border-b md:border-b-0">
            <CardContent className="flex flex-col gap-2 py-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">To</p>
              <p className="text-sm font-medium">{email.to_email}</p>
            </CardContent>
          </div>
          <div>
            <CardContent className="flex flex-col gap-2 py-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ID</p>
              <div className="flex items-center gap-2">
                <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                  {truncateId(email.id)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(email.id, "id")}
                >
                  {copiedId ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardContent>
          </div>
        </div>

        {/* Email Events Timeline */}
        <div className="mb-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Email Events
          </p>
          <div className="rounded-2xl border border-border bg-card p-6">
            {email.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded</p>
            ) : (
              <div className="flex items-center gap-8">
                {email.events.map((event, index) => (
                  <div key={`${event.status}-${index}`} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                          isSuccessEvent(event.status)
                            ? "border-success bg-success/10 text-success"
                            : event.status === "bounced" || event.status === "failed"
                            ? "border-destructive bg-destructive/10 text-destructive"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {event.status === "sent" || event.status === "queued" ? (
                          <Send className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </div>
                      <p className={`text-sm font-medium ${
                        isSuccessEvent(event.status)
                          ? "text-success"
                          : event.status === "bounced" || event.status === "failed"
                          ? "text-destructive"
                          : ""
                      }`}>
                        {getEventLabel(event.status)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatEventDate(event.created_at)}</p>
                    </div>
                    {index < email.events.length - 1 && (
                      <div className="mx-4 h-0.5 w-16 bg-border" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Tabs */}
        <div className="rounded-2xl border border-border bg-card">
          <Tabs defaultValue="preview">
            <div className="flex items-center justify-between border-b border-border px-4">
              <TabsList className="h-12 bg-transparent">
                <TabsTrigger value="preview" className="data-[state=active]:bg-muted">
                  Preview
                </TabsTrigger>
                <TabsTrigger value="plain-text" className="data-[state=active]:bg-muted">
                  Plain Text
                </TabsTrigger>
                <TabsTrigger value="html" className="data-[state=active]:bg-muted">
                  HTML
                </TabsTrigger>
                <TabsTrigger value="insights" className="data-[state=active]:bg-muted">
                  Insights
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8", previewMode === "desktop" && "bg-muted")}
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8", previewMode === "mobile" && "bg-muted")}
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(email.body, "content")}
                >
                  {copiedContent ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <TabsContent value="preview" className="px-6 py-4">
              <div
                className={cn(
                  "mx-auto min-h-[320px] overflow-hidden rounded-lg bg-white shadow-sm",
                  previewMode === "desktop" ? "max-w-full" : "max-w-[375px]"
                )}
              >
                <div dangerouslySetInnerHTML={{ __html: email.body }} />
              </div>
            </TabsContent>

            <TabsContent value="plain-text" className="px-6 py-4">
              <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground">
                {plainTextContent}
              </pre>
            </TabsContent>

            <TabsContent value="html" className="px-6 py-4">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs text-muted-foreground">
                {email.body}
              </pre>
            </TabsContent>

            <TabsContent value="insights" className="px-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="text-sm">DMARC validation passed</span>
                  </div>
                  <StatusBadge status="delivered" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="text-sm">Link domain matches sender</span>
                  </div>
                  <StatusBadge status="delivered" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">Open tracking disabled</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Recommended</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">Click tracking disabled</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Recommended</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

      <ConfirmActionDialog
        open={showResendDialog}
        onOpenChange={setShowResendDialog}
        onConfirm={handleResend}
        title="Resend Email"
        description={`Are you sure you want to resend this email to "${email.to_email}"? A new copy of this email will be sent.`}
        confirmLabel="Resend"
      />

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Email"
        description={`Are you sure you want to delete the email to "${email.to_email}"? This action cannot be undone.`}
      />

      <APISection isOpen={showApiSection} onClose={() => setShowApiSection(false)} />
    </div>
  );
}
