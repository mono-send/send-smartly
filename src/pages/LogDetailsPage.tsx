import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Server, MoreHorizontal, Copy, Check } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Mock data - in real app would fetch by ID
const mockLogs: Record<string, {
  id: string;
  endpoint: string;
  status: number;
  method: string;
  date: string;
  userAgent: string;
  responseBody: object;
  requestBody: object;
}> = {
  "1": {
    id: "1",
    endpoint: "/emails",
    status: 200,
    method: "POST",
    date: "2 minutes ago",
    userAgent: "resend-node:6.4.0",
    responseBody: {
      id: "3fcd4164-be76-4555-9bb4-9f155f8cbedf"
    },
    requestBody: {
      bcc: [],
      cc: [],
      from: "welcome@monosend.io",
      replyTo: [],
      subject: "Welcome to MonoSend",
      to: ["user@example.com"],
      html: "<h1>Welcome!</h1><p>Thank you for signing up.</p>",
      text: "Welcome! Thank you for signing up."
    }
  },
  "2": {
    id: "2",
    endpoint: "/emails",
    status: 200,
    method: "POST",
    date: "5 minutes ago",
    userAgent: "resend-node:6.4.0",
    responseBody: {
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    },
    requestBody: {
      from: "noreply@monosend.io",
      to: ["customer@example.com"],
      subject: "Order Confirmation",
      html: "<p>Your order has been confirmed.</p>"
    }
  },
  "3": {
    id: "3",
    endpoint: "/domains",
    status: 200,
    method: "GET",
    date: "15 minutes ago",
    userAgent: "curl/8.1.2",
    responseBody: {
      data: [
        { id: "1", name: "monosend.io", status: "verified" }
      ]
    },
    requestBody: {}
  },
  "4": {
    id: "4",
    endpoint: "/emails/batch",
    status: 429,
    method: "POST",
    date: "1 hour ago",
    userAgent: "resend-python:1.2.0",
    responseBody: {
      statusCode: 429,
      message: "Rate limit exceeded",
      name: "rate_limit_exceeded"
    },
    requestBody: {
      emails: [{ to: "a@example.com" }, { to: "b@example.com" }]
    }
  },
  "5": {
    id: "5",
    endpoint: "/emails",
    status: 400,
    method: "POST",
    date: "2 hours ago",
    userAgent: "axios/1.6.0",
    responseBody: {
      statusCode: 400,
      message: "Missing required field: from",
      name: "validation_error"
    },
    requestBody: {
      to: ["user@example.com"],
      subject: "Test"
    }
  },
  "6": {
    id: "6",
    endpoint: "/api-keys",
    status: 200,
    method: "GET",
    date: "3 hours ago",
    userAgent: "resend-node:6.4.0",
    responseBody: {
      data: [
        { id: "key_1", name: "Production" }
      ]
    },
    requestBody: {}
  },
  "7": {
    id: "7",
    endpoint: "/emails",
    status: 500,
    method: "POST",
    date: "5 hours ago",
    userAgent: "resend-go:1.0.0",
    responseBody: {
      statusCode: 500,
      message: "Internal server error",
      name: "internal_error"
    },
    requestBody: {
      from: "system@monosend.io",
      to: ["user@example.com"],
      subject: "Notification"
    }
  }
};

function StatusCode({ code }: { code: number }) {
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-success/10 text-success border-success/20";
    if (status >= 400 && status < 500) return "bg-warning/10 text-warning border-warning/20";
    if (status >= 500) return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs font-medium",
      getStatusColor(code)
    )}>
      {code}
    </span>
  );
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <Tooltip open={copied ? true : undefined}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-7 w-7 text-code-foreground/60 hover:text-code-foreground hover:bg-code-foreground/10"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? "Copied" : "Copy"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function LogDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const log = id ? mockLogs[id] : null;

  if (!log) {
    return (
      <>
        <TopBar 
          title="Log not found" 
          showBackButton
          onBack={() => navigate("/logs")}
        />
        <div className="p-6">
          <p className="text-muted-foreground">The requested log could not be found.</p>
        </div>
      </>
    );
  }

  const responseBodyJson = JSON.stringify(log.responseBody, null, 2);
  const requestBodyJson = JSON.stringify(log.requestBody, null, 2);

  return (
    <>
      <TopBar 
        title="Logs" 
        showBackButton
        onBack={() => navigate("/logs")}
      />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted border border-border">
              <Server className="h-8 w-8 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Log</p>
              <h1 className="text-2xl font-semibold text-foreground">
                {log.method} {log.endpoint}
              </h1>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Copy log ID</DropdownMenuItem>
              <DropdownMenuItem>View related email</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Details Grid - First Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Endpoint</p>
            <p className="text-foreground font-mono">{log.endpoint}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Date</p>
            <p className="text-foreground">{log.date}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Status</p>
            <StatusCode code={log.status} />
          </div>
        </div>

        {/* Details Grid - Second Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Method</p>
            <p className="text-foreground">{log.method}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">User-Agent</p>
            <p className="text-foreground font-mono text-sm">{log.userAgent}</p>
          </div>
        </div>

        {/* Response Body */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Response Body</h2>
          <div className="relative rounded-lg bg-code border border-code-border p-4 overflow-x-auto">
            <div className="absolute top-2 right-2">
              <CopyButton content={responseBodyJson} />
            </div>
            <pre className="font-mono text-sm text-code-foreground">
              <code>{responseBodyJson}</code>
            </pre>
          </div>
        </div>

        {/* Request Body */}
        {Object.keys(log.requestBody).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Request Body</h2>
            <div className="relative rounded-lg bg-code border border-code-border p-4 overflow-x-auto">
              <div className="absolute top-2 right-2">
                <CopyButton content={requestBodyJson} />
              </div>
              <pre className="font-mono text-sm text-code-foreground">
                <code>{requestBodyJson}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
