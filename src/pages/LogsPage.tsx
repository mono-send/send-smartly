import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TopBar } from "@/components/layout/TopBar";
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
import { Search, Calendar } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const mockLogs = [
  {
    id: "1",
    endpoint: "/emails",
    status: 200,
    method: "POST",
    created: "2 minutes ago",
    userAgent: "resend-node:6.4.0",
  },
  {
    id: "2",
    endpoint: "/emails",
    status: 200,
    method: "POST",
    created: "5 minutes ago",
    userAgent: "resend-node:6.4.0",
  },
  {
    id: "3",
    endpoint: "/domains",
    status: 200,
    method: "GET",
    created: "15 minutes ago",
    userAgent: "curl/8.1.2",
  },
  {
    id: "4",
    endpoint: "/emails/batch",
    status: 429,
    method: "POST",
    created: "1 hour ago",
    userAgent: "resend-python:1.2.0",
  },
  {
    id: "5",
    endpoint: "/emails",
    status: 400,
    method: "POST",
    created: "2 hours ago",
    userAgent: "axios/1.6.0",
  },
  {
    id: "6",
    endpoint: "/api-keys",
    status: 200,
    method: "GET",
    created: "3 hours ago",
    userAgent: "resend-node:6.4.0",
  },
  {
    id: "7",
    endpoint: "/emails",
    status: 500,
    method: "POST",
    created: "5 hours ago",
    userAgent: "resend-go:1.0.0",
  },
];

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
  const [search, setSearch] = useState("");

  return (
    <DashboardLayout>
      <TopBar title="Logs" subtitle="API request logs and debugging" />
      
      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search endpoints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select defaultValue="all">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="2xx">2xx</SelectItem>
              <SelectItem value="4xx">4xx</SelectItem>
              <SelectItem value="5xx">5xx</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="15">
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
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                {/* <TableHead>User Agent</TableHead> */}
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLogs.map((log) => (
                <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <code className="font-mono text-sm">{log.endpoint}</code>
                  </TableCell>
                  <TableCell>
                    <StatusCode code={log.status} />
                  </TableCell>
                  <TableCell>
                    <MethodBadge method={log.method} />
                  </TableCell>
                  {/* <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.userAgent}
                  </TableCell> */}
                  <TableCell className="text-muted-foreground">{log.created}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination hint */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing 7 of 7 logs</span>
        </div>
      </div>
    </DashboardLayout>
  );
}
