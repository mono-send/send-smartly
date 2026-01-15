import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Calendar, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

type LogSource = "api" | "mcp";

interface Log {
  id: string;
  endpoint: string;
  status: number;
  method: string;
  source: LogSource;
  created_at: string;
  user_agent?: string;
}

interface LogsResponse {
  items: Array<{
    id: string;
    endpoint: string;
    status_code: number;
    method: string;
    source: LogSource;
    created_at: string;
    user_agent?: string;
  }>;
  next_cursor: string | null;
}

function getDateRange(days: string): { start_at: string; end_at: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  if (days === "1") {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(start.getDate() - parseInt(days));
    start.setHours(0, 0, 0, 0);
  }

  return {
    start_at: start.toISOString(),
    end_at: end.toISOString(),
  };
}

function getStatusRange(filter: string) {
  switch (filter) {
    case "2xx":
      return { min: 200, max: 299 };
    case "3xx":
      return { min: 300, max: 399 };
    case "4xx":
      return { min: 400, max: 499 };
    case "5xx":
      return { min: 500, max: 599 };
    default:
      return null;
  }
}

function StatusCode({ code }: { code: number }) {
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-success/10 text-success";
    if (status >= 400 && status < 500) return "bg-warning/10 text-warning";
    if (status >= 500) return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded px-2 py-0.5 font-mono text-xs font-medium",
      getStatusColor(code)
    )}>
      {code}
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  const getMethodColor = (m: string) => {
    switch (m) {
      case "GET": return "text-info";
      case "POST": return "text-success";
      case "PUT": return "text-warning";
      case "DELETE": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  return (
    <span className={cn("font-mono text-xs font-medium", getMethodColor(method))}>
      {method}
    </span>
  );
}

export default function LogsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7");
  const [logs, setLogs] = useState<Log[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const logsRef = useRef<Log[]>([]);

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async (
    cursor?: string,
    replace = false,
    options: { silent?: boolean } = {}
  ) => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;

    if (options.silent) {
      setIsRefreshing(true);
    } else if (replace) {
      setIsLoading(true);
      setNextCursor(null);
    } else if (cursor) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    setHasError(false);

    try {
      const params = new URLSearchParams();

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      if (sourceFilter !== "all") {
        params.append("source", sourceFilter);
      }

      const statusRange = getStatusRange(statusFilter);
      if (statusRange) {
        params.append("status_code_from", statusRange.min.toString());
        params.append("status_code_to", statusRange.max.toString());
      }

      const { start_at, end_at } = getDateRange(dateRange);
      params.append("start_at", start_at);
      params.append("end_at", end_at);

      if (cursor) {
        params.append("cursor", cursor);
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/logs?${queryString}` : "/logs";

      const response = await api(endpoint);

      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data: LogsResponse = await response.json();

      const mappedLogs: Log[] = data.items.map((item) => ({
        id: item.id,
        endpoint: item.endpoint,
        status: item.status_code,
        method: item.method,
        source: item.source,
        created_at: item.created_at,
        user_agent: item.user_agent,
      }));

      if (replace || !cursor) {
        const previousLogs = logsRef.current;
        const isSameLength = previousLogs.length === mappedLogs.length;
        const isSameOrder = isSameLength && previousLogs.every(
          (log, index) => log.id === mappedLogs[index]?.id
        );

        if (isSameOrder) {
          return;
        }

        setLogs(mappedLogs);
        setNextCursor(data.next_cursor);
      } else {
        setLogs((prev) => {
          const existingIds = new Set(prev.map((log) => log.id));
          const uniqueNewLogs = mappedLogs.filter((log) => !existingIds.has(log.id));
          return [...prev, ...uniqueNewLogs];
        });
        setNextCursor(data.next_cursor);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast.error("Failed to load logs");
      if (!cursor) {
        setLogs([]);
      }
      setHasError(true);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [debouncedSearch, sourceFilter, statusFilter, dateRange]);

  useEffect(() => {
    fetchLogs(undefined, true);
  }, [fetchLogs]);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement) return;

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        nextCursor &&
        !isLoading &&
        !isLoadingMore &&
        !hasError
      ) {
        fetchLogs(nextCursor);
      }
    }, {
      rootMargin: "200px",
      threshold: 0.1,
    });

    observer.observe(loadMoreElement);

    return () => {
      observer.unobserve(loadMoreElement);
    };
  }, [fetchLogs, hasError, isLoading, isLoadingMore, nextCursor]);

  const formatCreatedTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const onRefresh = useCallback(() => {
    fetchLogs(undefined, true, { silent: true });
  }, [fetchLogs]);

  return (
    <>
      <TopBar title="Logs" subtitle="API request logs and debugging" />
      
      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[150px] max-w-xs">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search endpoints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 bg-white hover:border-stone-300 focus-within:border-stone-300 focus-within:shadow-input hover:shadow-input-hover focus-within:shadow-input focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            />
          </div>
          
          <Select value={sourceFilter} onValueChange={setSourceFilter} className="bg-white">
            <SelectTrigger className="w-[120px]" className="bg-white">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="mcp">MCP</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter} className="bg-white">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="2xx">2xx</SelectItem>
              <SelectItem value="3xx">3xx</SelectItem>
              <SelectItem value="4xx">4xx</SelectItem>
              <SelectItem value="5xx">5xx</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange} className="bg-white">
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="15">Last 15 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2 rounded-xl px-3 bg-white"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {/* Refresh */}
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="uppercase text-xs">
                <TableHead className="h-10 rounded-tl-2xl">Endpoint</TableHead>
                <TableHead className="h-10">Source</TableHead>
                <TableHead className="h-10">Status</TableHead>
                <TableHead className="h-10">Method</TableHead>
                <TableHead className="h-10 rounded-tr-2xl">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : hasError ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Unable to load logs. Please try again.
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {logs.map((log) => (
                    <TableRow 
                      key={log.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/logs/${log.id}`)}
                    >
                      <TableCell className="px-4 py-2">
                        <code className="font-mono text-sm">{log.endpoint}</code>
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <span className={cn(
                          "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium uppercase",
                          log.source === "api" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"
                        )}>
                          {log.source}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <StatusCode code={log.status} />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <MethodBadge method={log.method} />
                      </TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground">{formatCreatedTime(log.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} className="h-14 text-center text-muted-foreground">
                      {isLoadingMore ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading more logs
                        </div>
                      ) : nextCursor ? (
                        <div ref={loadMoreRef}>Load more</div>
                      ) : (
                        <span>No more logs</span>
                      )}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination hint */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>Showing {logs.length} log{logs.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </>
  );
}
