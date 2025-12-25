import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Server, MoreHorizontal, Copy, Check, Plug } from "lucide-react";
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

type LogSource = "api" | "mcp";

interface BaseLog {
  id: string;
  endpoint: string;
  status: number;
  method: string;
  date: string;
  userAgent: string;
  responseBody: object;
  requestBody: object;
  source: LogSource;
}

interface McpLog extends BaseLog {
  source: "mcp";
  toolName: string;
  toolDescription: string;
  parameters: object;
}

interface ApiLog extends BaseLog {
  source: "api";
}

type Log = ApiLog | McpLog;

// Mock data - in real app would fetch by ID
const mockLogs: Record<string, Log> = {
  "1": {
    id: "1",
    endpoint: "/emails",
    status: 200,
    method: "POST",
    source: "api",
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
    endpoint: "/tools/send_email",
    status: 200,
    method: "POST",
    source: "mcp",
    date: "3 minutes ago",
    userAgent: "mcp-client:1.0.0",
    toolName: "send_email",
    toolDescription: "Send a transactional email to a recipient using a template or custom content.",
    parameters: {
      to: "user@example.com",
      subject: "Your order has shipped",
      template_id: "order_shipped",
      variables: {
        order_id: "ORD-12345",
        tracking_number: "1Z999AA10123456784",
        carrier: "UPS"
      }
    },
    responseBody: {
      success: true,
      email_id: "em_8f7d6c5b4a3e2f1d",
      message: "Email queued for delivery"
    },
    requestBody: {}
  },
  "3": {
    id: "3",
    endpoint: "/emails",
    status: 200,
    method: "POST",
    source: "api",
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
  "4": {
    id: "4",
    endpoint: "/tools/list_contacts",
    status: 200,
    method: "GET",
    source: "mcp",
    date: "10 minutes ago",
    userAgent: "mcp-client:1.0.0",
    toolName: "list_contacts",
    toolDescription: "Retrieve a paginated list of contacts from an audience segment.",
    parameters: {
      audience_id: "aud_newsletter",
      limit: 50,
      offset: 0,
      filters: {
        subscribed: true,
        created_after: "2024-01-01"
      }
    },
    responseBody: {
      success: true,
      total: 1247,
      contacts: [
        { id: "ct_1", email: "john@example.com", name: "John Doe" },
        { id: "ct_2", email: "jane@example.com", name: "Jane Smith" }
      ],
      has_more: true
    },
    requestBody: {}
  },
  "5": {
    id: "5",
    endpoint: "/domains",
    status: 200,
    method: "GET",
    source: "api",
    date: "15 minutes ago",
    userAgent: "curl/8.1.2",
    responseBody: {
      data: [
        { id: "1", name: "monosend.io", status: "verified" }
      ]
    },
    requestBody: {}
  },
  "6": {
    id: "6",
    endpoint: "/tools/create_broadcast",
    status: 429,
    method: "POST",
    source: "mcp",
    date: "30 minutes ago",
    userAgent: "mcp-client:1.0.0",
    toolName: "create_broadcast",
    toolDescription: "Create and schedule a broadcast email to be sent to an audience segment.",
    parameters: {
      name: "Weekly Newsletter",
      audience_id: "aud_newsletter",
      subject: "This Week in Tech",
      template_id: "weekly_newsletter",
      schedule_at: "2024-12-26T09:00:00Z"
    },
    responseBody: {
      success: false,
      error: {
        code: "rate_limit_exceeded",
        message: "Too many broadcast creation requests. Please wait 60 seconds.",
        retry_after: 60
      }
    },
    requestBody: {}
  },
  "7": {
    id: "7",
    endpoint: "/emails/batch",
    status: 429,
    method: "POST",
    source: "api",
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
  "8": {
    id: "8",
    endpoint: "/tools/get_metrics",
    status: 500,
    method: "GET",
    source: "mcp",
    date: "2 hours ago",
    userAgent: "mcp-client:1.0.0",
    toolName: "get_metrics",
    toolDescription: "Retrieve email delivery and engagement metrics for a specified time range.",
    parameters: {
      start_date: "2024-12-01",
      end_date: "2024-12-25",
      metrics: ["sent", "delivered", "opened", "clicked", "bounced"],
      group_by: "day"
    },
    responseBody: {
      success: false,
      error: {
        code: "internal_error",
        message: "Failed to aggregate metrics. Please try again later."
      }
    },
    requestBody: {}
  },
  "9": {
    id: "9",
    endpoint: "/emails",
    status: 400,
    method: "POST",
    source: "api",
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
  "10": {
    id: "10",
    endpoint: "/api-keys",
    status: 200,
    method: "GET",
    source: "api",
    date: "3 hours ago",
    userAgent: "resend-node:6.4.0",
    responseBody: {
      data: [
        { id: "key_1", name: "Production" }
      ]
    },
    requestBody: {}
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

function SourceBadge({ source }: { source: LogSource }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium uppercase",
      source === "api" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"
    )}>
      {source}
    </span>
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

  const isMcp = log.source === "mcp";
  const mcpLog = isMcp ? (log as McpLog) : null;

  const responseBodyJson = JSON.stringify(log.responseBody, null, 2);
  const requestBodyJson = JSON.stringify(log.requestBody, null, 2);
  const parametersJson = mcpLog ? JSON.stringify(mcpLog.parameters, null, 2) : "";

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
            <div className={cn(
              "flex h-16 w-16 items-center justify-center rounded-xl border border-border",
              isMcp ? "bg-accent" : "bg-muted"
            )}>
              {isMcp ? (
                <Plug className="h-8 w-8 text-accent-foreground" />
              ) : (
                <Server className="h-8 w-8 text-success" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">Log</p>
                <SourceBadge source={log.source} />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">
                {isMcp && mcpLog ? mcpLog.toolName : `${log.method} ${log.endpoint}`}
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
              {!isMcp && <DropdownMenuItem>View related email</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* MCP Tool Description */}
        {isMcp && mcpLog && (
          <div className="mb-8 p-4 rounded-lg bg-accent/50 border border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Tool Description</p>
            <p className="text-foreground">{mcpLog.toolDescription}</p>
          </div>
        )}

        {/* Details Grid - First Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {isMcp ? "Tool Name" : "Endpoint"}
            </p>
            <p className="text-foreground font-mono">{isMcp && mcpLog ? mcpLog.toolName : log.endpoint}</p>
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
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {isMcp ? "Client" : "User-Agent"}
            </p>
            <p className="text-foreground font-mono text-sm">{log.userAgent}</p>
          </div>
          {isMcp && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Endpoint</p>
              <p className="text-foreground font-mono text-sm">{log.endpoint}</p>
            </div>
          )}
        </div>

        {/* MCP Parameters */}
        {isMcp && mcpLog && Object.keys(mcpLog.parameters).length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Parameters</h2>
            <div className="relative rounded-lg bg-code border border-code-border p-4 overflow-x-auto">
              <div className="absolute top-2 right-2">
                <CopyButton content={parametersJson} />
              </div>
              <pre className="font-mono text-sm text-code-foreground">
                <code>{parametersJson}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Response Body */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Response</h2>
          <div className="relative rounded-lg bg-code border border-code-border p-4 overflow-x-auto">
            <div className="absolute top-2 right-2">
              <CopyButton content={responseBodyJson} />
            </div>
            <pre className="font-mono text-sm text-code-foreground">
              <code>{responseBodyJson}</code>
            </pre>
          </div>
        </div>

        {/* Request Body (for API logs only) */}
        {!isMcp && Object.keys(log.requestBody).length > 0 && (
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
