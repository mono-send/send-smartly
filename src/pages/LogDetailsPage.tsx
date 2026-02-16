import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Server, MoreVertical, Copy, Check, Plug } from "lucide-react";
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
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { CardContent } from "@/components/ui/card";

type LogSource = "api" | "mcp";

interface LogResponse {
  id: string;
  endpoint: string;
  source: LogSource;
  status_code: number;
  method: string;
  user_agent?: string;
  tool_name?: string;
  tool_description?: string;
  request_body?: unknown;
  response_body?: unknown;
  created_at: string;
}

interface Log {
  id: string;
  endpoint: string;
  status: number;
  method: string;
  source: LogSource;
  createdAt: string;
  userAgent?: string;
  toolName?: string;
  toolDescription?: string;
  requestBody: unknown;
  responseBody: unknown;
}

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
  const [log, setLog] = useState<Log | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    const fetchLog = async () => {
      if (!id) {
        setIsLoading(false);
        setIsNotFound(true);
        return;
      }

      setIsLoading(true);
      setHasError(false);
      setIsNotFound(false);

      try {
        const response = await api(`/logs/${id}`);

        if (response.status === 404) {
          setLog(null);
          setIsNotFound(true);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch log details");
        }

        const data: LogResponse = await response.json();

        const mappedLog: Log = {
          id: data.id,
          endpoint: data.endpoint,
          status: data.status_code,
          method: data.method,
          source: data.source,
          createdAt: data.created_at,
          userAgent: data.user_agent,
          toolName: data.tool_name,
          toolDescription: data.tool_description,
          requestBody: data.request_body ?? null,
          responseBody: data.response_body ?? {},
        };

        setLog(mappedLog);
      } catch (error) {
        console.error("Failed to fetch log details:", error);
        toast.error("Failed to load log details");
        setHasError(true);
        setLog(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLog();
  }, [id]);

  const isMcp = log?.source === "mcp";

  const responseBodyJson = useMemo(() => {
    try {
      return JSON.stringify(log?.responseBody ?? {}, null, 2);
    } catch (error) {
      console.error("Failed to stringify response body:", error);
      return "{}";
    }
  }, [log?.responseBody]);

  const requestBodyJson = useMemo(() => {
    try {
      return JSON.stringify(log?.requestBody ?? {}, null, 2);
    } catch (error) {
      console.error("Failed to stringify request body:", error);
      return "{}";
    }
  }, [log?.requestBody]);

  const hasRequestBody = useMemo(() => {
    if (!log || log.requestBody === null || log.requestBody === undefined) return false;
    if (typeof log.requestBody !== "object") return true;
    return Object.keys(log.requestBody as Record<string, unknown>).length > 0;
  }, [log]);

  const formatCreatedTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const displayTitle = isMcp && log?.toolName ? log.toolName : `${log?.method ?? ""} ${log?.endpoint ?? ""}`;
  const detailCards = useMemo(() => {
    if (!log) return [];

    const cards = [
      {
        label: isMcp ? "Tool Name" : "Endpoint",
        value: isMcp && log.toolName ? log.toolName : log.endpoint,
        valueClassName: "font-mono",
      },
      {
        label: "Date",
        value: formatCreatedTime(log.createdAt),
      },
      {
        label: "Status",
        value: <StatusCode code={log.status} />,
      },
      {
        label: "Method",
        value: log.method,
      },
      {
        label: isMcp ? "Client" : "User-Agent",
        value: log.userAgent || "-",
        valueClassName: "font-mono text-sm",
      },
    ];

    if (isMcp) {
      cards.push({
        label: "Endpoint",
        value: log.endpoint,
        valueClassName: "font-mono text-sm",
      });
    }

    return cards;
  }, [isMcp, log]);

  if (isLoading) {
    return (
      <>
        <TopBar 
          title="Logs" 
          showBackButton
          onBack={() => navigate("/logs")}
        />
        <div className="p-6">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-7 w-48" />
              </div>
            </div>
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>

          <div className="grid overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm md:grid-cols-5 md:divide-x mb-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className={index === 4 ? "" : "border-b md:border-b-0"}>
                <CardContent className="flex flex-col gap-2 py-6">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-24" />
                </CardContent>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </>
    );
  }

  if (hasError) {
    return (
      <>
        <TopBar 
          title="Logs" 
          showBackButton
          onBack={() => navigate("/logs")}
        />
        <div className="p-6">
          <p className="text-muted-foreground">Unable to load log details right now.</p>
        </div>
      </>
    );
  }

  if (isNotFound || !log) {
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
                {displayTitle}
              </h1>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Copy log ID</DropdownMenuItem>
              {!isMcp && <DropdownMenuItem>View related email</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* MCP Tool Description */}
        {isMcp && log.toolDescription && (
          <div className="mb-8 p-4 rounded-lg bg-accent/50 border border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Tool Description</p>
            <p className="text-foreground">{log.toolDescription}</p>
          </div>
        )}

        {/* Details Grid */}
        <div
          className={cn(
            "grid overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm md:divide-x mb-10",
            detailCards.length === 6 ? "md:grid-cols-6" : "md:grid-cols-5"
          )}
        >
          {detailCards.map((card, index) => (
            <div
              key={card.label}
              className={index === detailCards.length - 1 ? "" : "border-b md:border-b-0"}
            >
              <CardContent className="flex flex-col gap-2 py-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {card.label}
                </p>
                <div className={cn("text-foreground text-sm font-medium", card.valueClassName)}>
                  {card.value}
                </div>
              </CardContent>
            </div>
          ))}
        </div>

        {/* Response Body */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Response</h2>
          <div className="relative rounded-2xl bg-code border border-code-border p-4 overflow-x-auto">
            <div className="absolute top-2 right-2">
              <CopyButton content={responseBodyJson} />
            </div>
            <pre className="font-mono text-sm text-code-foreground">
              <code>{responseBodyJson}</code>
            </pre>
          </div>
        </div>

        {/* Request Body */}
        {hasRequestBody && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Request</h2>
            <div className="relative rounded-2xl bg-code border border-code-border p-4 overflow-x-auto">
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
