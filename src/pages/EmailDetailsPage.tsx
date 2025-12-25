import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Mail, Copy, Check, ChevronLeft, MoreHorizontal, Send, CheckCircle, Code, BookOpen } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
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

// Mock email data - in production this would come from an API
const mockEmailDetails = {
  "1": {
    id: "3fcd4164-be76-4555-9bb4-8a2f1c3d5e6a",
    to: "john@example.com",
    from: "welcome@monosend.co",
    subject: "Welcome to MonoSend",
    status: "delivered" as const,
    events: [
      { type: "sent", label: "Sent", date: "Dec 21, 9:09 PM", completed: true },
      { type: "delivered", label: "Delivered", date: "Dec 21, 9:09 PM", completed: true },
    ],
    preview: `Hello John,

Welcome to MonoSend! We're excited to have you on board.

Your account has been successfully created and you can now start sending emails via our API.

Best regards,
The MonoSend Team`,
    plainText: `Hello John,

Welcome to MonoSend! We're excited to have you on board.

Your account has been successfully created and you can now start sending emails via our API.

Best regards,
The MonoSend Team`,
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Welcome to MonoSend</title>
</head>
<body>
  <h1>Hello John,</h1>
  <p>Welcome to MonoSend! We're excited to have you on board.</p>
  <p>Your account has been successfully created and you can now start sending emails via our API.</p>
  <p>Best regards,<br/>The MonoSend Team</p>
</body>
</html>`,
  },
  "2": {
    id: "4eab5275-cf87-5666-0cc5-9b3g2d4e6f7b",
    to: "sarah@startup.io",
    from: "billing@monosend.co",
    subject: "Your invoice is ready",
    status: "opened" as const,
    events: [
      { type: "sent", label: "Sent", date: "Dec 21, 8:45 PM", completed: true },
      { type: "delivered", label: "Delivered", date: "Dec 21, 8:45 PM", completed: true },
      { type: "opened", label: "Opened", date: "Dec 21, 8:52 PM", completed: true },
    ],
    preview: `Hi Sarah,

Your invoice #INV-2024-001 for $99.00 is ready.

View your invoice: https://billing.monosend.co/invoices/INV-2024-001

Thanks for your business!`,
    plainText: `Hi Sarah,

Your invoice #INV-2024-001 for $99.00 is ready.

View your invoice: https://billing.monosend.co/invoices/INV-2024-001

Thanks for your business!`,
    html: `<!DOCTYPE html>
<html>
<body>
  <h1>Hi Sarah,</h1>
  <p>Your invoice #INV-2024-001 for $99.00 is ready.</p>
  <a href="https://billing.monosend.co/invoices/INV-2024-001">View your invoice</a>
  <p>Thanks for your business!</p>
</body>
</html>`,
  },
};

export default function EmailDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [showResendDialog, setShowResendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApiSection, setShowApiSection] = useState(false);

  const email = mockEmailDetails[id as keyof typeof mockEmailDetails] || mockEmailDetails["1"];

  const handleResend = () => {
    toast.success(`Email to "${email.to}" queued for resend`);
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
              <h1 className="text-2xl font-semibold">{email.to}</h1>
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
                  <MoreHorizontal className="h-4 w-4" />
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
        <div className="mb-8 grid grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">From</p>
            <p className="mt-1 text-sm">{email.from}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Subject</p>
            <p className="mt-1 text-sm">{email.subject}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">To</p>
            <p className="mt-1 text-sm">{email.to}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ID</p>
            <div className="mt-1 flex items-center gap-2">
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
          </div>
        </div>

        {/* Email Events Timeline */}
        <div className="mb-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Email Events
          </p>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-8">
              {email.events.map((event, index) => (
                <div key={event.type} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        event.completed
                          ? event.type === "delivered" || event.type === "opened" || event.type === "clicked"
                            ? "border-success bg-success/10 text-success"
                            : "border-border bg-muted text-muted-foreground"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {event.type === "sent" ? (
                        <Send className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </div>
                    <p className={`mt-2 text-sm font-medium ${
                      event.type === "delivered" || event.type === "opened" || event.type === "clicked"
                        ? "text-success"
                        : ""
                    }`}>
                      {event.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{event.date}</p>
                  </div>
                  {index < email.events.length - 1 && (
                    <div className="mx-4 h-0.5 w-16 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="rounded-lg border border-border bg-card">
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => copyToClipboard(email.preview, "content")}
              >
                {copiedContent ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <TabsContent value="preview" className="p-6">
              <div className="whitespace-pre-wrap text-sm">{email.preview}</div>
            </TabsContent>

            <TabsContent value="plain-text" className="p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground">
                {email.plainText}
              </pre>
            </TabsContent>

            <TabsContent value="html" className="p-6">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs text-muted-foreground">
                {email.html}
              </pre>
            </TabsContent>

            <TabsContent value="insights" className="p-6">
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
        description={`Are you sure you want to resend this email to "${email.to}"? A new copy of this email will be sent.`}
        confirmLabel="Resend"
      />

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Email"
        description={`Are you sure you want to delete the email to "${email.to}"? This action cannot be undone.`}
      />

      <APISection isOpen={showApiSection} onClose={() => setShowApiSection(false)} />
    </div>
  );
}
