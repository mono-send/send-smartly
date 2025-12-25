import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Lock, Code, MoreHorizontal, Copy, Check } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ApiKeyDialog, ApiKeyData } from "@/components/dialogs/ApiKeyDialog";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis } from "recharts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type TimeRange = "1d" | "7d" | "14d" | "30d";

// Mock usage data for charts by time range
const generateMockData = (keyId: string, range: TimeRange): Array<{ date: string; requests: number }> => {
  const baseMultiplier = keyId === "1" ? 1 : keyId === "2" ? 0.1 : 0;
  
  const dataByRange: Record<TimeRange, Array<{ date: string; requests: number }>> = {
    "1d": [
      { date: "00:00", requests: Math.round(12 * baseMultiplier) },
      { date: "04:00", requests: Math.round(8 * baseMultiplier) },
      { date: "08:00", requests: Math.round(45 * baseMultiplier) },
      { date: "12:00", requests: Math.round(67 * baseMultiplier) },
      { date: "16:00", requests: Math.round(89 * baseMultiplier) },
      { date: "20:00", requests: Math.round(34 * baseMultiplier) },
      { date: "Now", requests: Math.round(23 * baseMultiplier) },
    ],
    "7d": [
      { date: "Dec 18", requests: Math.round(267 * baseMultiplier) },
      { date: "Dec 19", requests: Math.round(245 * baseMultiplier) },
      { date: "Dec 20", requests: Math.round(312 * baseMultiplier) },
      { date: "Dec 21", requests: Math.round(289 * baseMultiplier) },
      { date: "Dec 22", requests: Math.round(267 * baseMultiplier) },
      { date: "Dec 23", requests: Math.round(298 * baseMultiplier) },
      { date: "Dec 24", requests: Math.round(256 * baseMultiplier) },
    ],
    "14d": [
      { date: "Dec 11", requests: Math.round(145 * baseMultiplier) },
      { date: "Dec 12", requests: Math.round(189 * baseMultiplier) },
      { date: "Dec 13", requests: Math.round(156 * baseMultiplier) },
      { date: "Dec 14", requests: Math.round(203 * baseMultiplier) },
      { date: "Dec 15", requests: Math.round(178 * baseMultiplier) },
      { date: "Dec 16", requests: Math.round(234 * baseMultiplier) },
      { date: "Dec 17", requests: Math.round(198 * baseMultiplier) },
      { date: "Dec 18", requests: Math.round(267 * baseMultiplier) },
      { date: "Dec 19", requests: Math.round(245 * baseMultiplier) },
      { date: "Dec 20", requests: Math.round(312 * baseMultiplier) },
      { date: "Dec 21", requests: Math.round(289 * baseMultiplier) },
      { date: "Dec 22", requests: Math.round(267 * baseMultiplier) },
      { date: "Dec 23", requests: Math.round(298 * baseMultiplier) },
      { date: "Dec 24", requests: Math.round(256 * baseMultiplier) },
    ],
    "30d": [
      { date: "Nov 25", requests: Math.round(134 * baseMultiplier) },
      { date: "Nov 27", requests: Math.round(156 * baseMultiplier) },
      { date: "Nov 29", requests: Math.round(178 * baseMultiplier) },
      { date: "Dec 1", requests: Math.round(167 * baseMultiplier) },
      { date: "Dec 3", requests: Math.round(189 * baseMultiplier) },
      { date: "Dec 5", requests: Math.round(201 * baseMultiplier) },
      { date: "Dec 7", requests: Math.round(223 * baseMultiplier) },
      { date: "Dec 9", requests: Math.round(198 * baseMultiplier) },
      { date: "Dec 11", requests: Math.round(245 * baseMultiplier) },
      { date: "Dec 13", requests: Math.round(267 * baseMultiplier) },
      { date: "Dec 15", requests: Math.round(234 * baseMultiplier) },
      { date: "Dec 17", requests: Math.round(289 * baseMultiplier) },
      { date: "Dec 19", requests: Math.round(312 * baseMultiplier) },
      { date: "Dec 21", requests: Math.round(278 * baseMultiplier) },
      { date: "Dec 23", requests: Math.round(298 * baseMultiplier) },
      { date: "Dec 24", requests: Math.round(256 * baseMultiplier) },
    ],
  };
  
  return dataByRange[range];
};

const timeRangeLabels: Record<TimeRange, string> = {
  "1d": "Last 24 hours",
  "7d": "Last 7 days",
  "14d": "Last 14 days",
  "30d": "Last 30 days",
};

const chartConfig = {
  requests: {
    label: "Requests",
    color: "hsl(var(--primary))",
  },
};

// Mock data - in real app would fetch by ID
const mockApiKeys: Record<string, {
  id: string;
  name: string;
  token: string;
  permission: string;
  domain: string;
  totalUses: number;
  lastUsed: string;
  created: string;
  creator: string;
}> = {
  "1": {
    id: "1",
    name: "Production",
    token: "ms_live_B5Bbt6Y6...",
    permission: "Full access",
    domain: "All domains",
    totalUses: 1247,
    lastUsed: "2 minutes ago",
    created: "1 month ago",
    creator: "john@example.com",
  },
  "2": {
    id: "2",
    name: "Development",
    token: "ms_test_K8Jht9P2...",
    permission: "Sending access",
    domain: "All domains",
    totalUses: 89,
    lastUsed: "1 hour ago",
    created: "2 weeks ago",
    creator: "jane@example.com",
  },
  "3": {
    id: "3",
    name: "Analytics",
    token: "ms_live_M3Nqw7R4...",
    permission: "Read only",
    domain: "All domains",
    totalUses: 0,
    lastUsed: "Never",
    created: "3 days ago",
    creator: "admin@example.com",
  },
};

export default function ApiKeyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("14d");
  
  const apiKey = id ? mockApiKeys[id] : null;
  const chartData = id ? generateMockData(id, timeRange) : [];

  if (!apiKey) {
    return (
      <>
        <TopBar 
          title="API Key not found" 
          showBackButton
          onBack={() => navigate("/api-keys")}
        />
        <div className="p-6">
          <p className="text-muted-foreground">The requested API key could not be found.</p>
        </div>
      </>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleEditSubmit = (data: ApiKeyData) => {
    console.log("Updated:", data);
    // In real app, would save to backend
  };

  return (
    <>
      <TopBar 
        title="API Keys" 
        showBackButton
        onBack={() => navigate("/api-keys")}
      />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted border border-border">
              <Lock className="h-8 w-8 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">API Key</p>
              <h1 className="text-2xl font-semibold text-foreground">{apiKey.name}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Code className="h-4 w-4" />
              API
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>Edit</DropdownMenuItem>
                <DropdownMenuItem>Roll key</DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => setIsRevokeDialogOpen(true)}
                >
                  Revoke
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Permission</p>
            <p className="text-foreground">{apiKey.permission}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Domain</p>
            <p className="text-foreground">{apiKey.domain}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Total Uses</p>
            <p className="text-foreground border-b border-dashed border-muted-foreground/50 inline">
              {apiKey.totalUses === 1 ? "1 time" : `${apiKey.totalUses.toLocaleString()} times`}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Token</p>
            <div className="flex items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 font-mono text-sm text-foreground">
                {apiKey.token}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Last Used</p>
            <p className="text-foreground border-b border-dashed border-muted-foreground/50 inline">
              {apiKey.lastUsed}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Created</p>
            <p className="text-foreground">{apiKey.created}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Creator</p>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-muted">
                  {apiKey.creator.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-foreground">{apiKey.creator}</p>
            </div>
          </div>
        </div>

        {/* Usage Analytics Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg">Usage Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">{timeRangeLabels[timeRange]}</p>
            </div>
            <ToggleGroup 
              type="single" 
              value={timeRange} 
              onValueChange={(value) => value && setTimeRange(value as TimeRange)}
              className="bg-muted rounded-lg p-1"
            >
              <ToggleGroupItem value="1d" size="sm" className="text-xs px-3">
                1D
              </ToggleGroupItem>
              <ToggleGroupItem value="7d" size="sm" className="text-xs px-3">
                7D
              </ToggleGroupItem>
              <ToggleGroupItem value="14d" size="sm" className="text-xs px-3">
                14D
              </ToggleGroupItem>
              <ToggleGroupItem value="30d" size="sm" className="text-xs px-3">
                30D
              </ToggleGroupItem>
            </ToggleGroup>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#fillRequests)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <ApiKeyDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        initialData={{
          name: apiKey.name,
          permission: apiKey.permission,
          domain: apiKey.domain,
        }}
        onSubmit={handleEditSubmit}
      />

      <ConfirmDeleteDialog
        open={isRevokeDialogOpen}
        onOpenChange={setIsRevokeDialogOpen}
        title="Revoke API key"
        description={`Are you sure you want to revoke "${apiKey.name}"? This action cannot be undone and any applications using this key will immediately lose access.`}
        confirmLabel="Revoke key"
        onConfirm={() => {
          toast.success("API key revoked successfully");
          navigate("/api-keys");
        }}
      />
    </>
  );
}
