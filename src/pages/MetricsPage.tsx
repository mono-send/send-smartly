import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";

const deliveryData = [
  { date: "Mon", delivered: 2400, bounced: 24, opened: 1800 },
  { date: "Tue", delivered: 1398, bounced: 18, opened: 1100 },
  { date: "Wed", delivered: 9800, bounced: 45, opened: 7200 },
  { date: "Thu", delivered: 3908, bounced: 29, opened: 2900 },
  { date: "Fri", delivered: 4800, bounced: 31, opened: 3600 },
  { date: "Sat", delivered: 3800, bounced: 22, opened: 2800 },
  { date: "Sun", delivered: 4300, bounced: 27, opened: 3200 },
];

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  subtitle?: string;
}

function MetricCard({ title, value, change, subtitle }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs">
            {change > 0 ? (
              <TrendingUp className="h-3 w-3 text-success" />
            ) : change < 0 ? (
              <TrendingDown className="h-3 w-3 text-destructive" />
            ) : (
              <Minus className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={change > 0 ? "text-success" : change < 0 ? "text-destructive" : "text-muted-foreground"}>
              {change > 0 ? "+" : ""}{change}%
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function MetricsPage() {
  return (
    <>
      <TopBar title="Metrics" subtitle="Email performance analytics">
        <Select defaultValue="7">
          <SelectTrigger className="w-[160px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Today</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </TopBar>
      
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Emails Sent"
            value="30,406"
            change={12.5}
            subtitle="vs last period"
          />
          <MetricCard
            title="Delivery Rate"
            value="99.2%"
            change={0.3}
            subtitle="196 bounced"
          />
          <MetricCard
            title="Open Rate"
            value="74.3%"
            change={-2.1}
            subtitle="22,591 opened"
          />
          <MetricCard
            title="Click Rate"
            value="12.8%"
            change={5.2}
            subtitle="3,892 clicked"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Delivery Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={deliveryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="delivered"
                      stroke="hsl(var(--success))"
                      fill="hsl(var(--success) / 0.2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={deliveryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="opened"
                      stroke="hsl(var(--info))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="bounced"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bounce & Complaint Rates */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bounce Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">0.64%</span>
                  <span className="text-sm text-success">Below threshold</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transient</span>
                    <span>0.21%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Permanent</span>
                    <span>0.38%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Undetermined</span>
                    <span>0.05%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Complaint Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">0.02%</span>
                  <span className="text-sm text-success">Below threshold</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep your complaint rate below 0.1% to maintain good deliverability.
                </p>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div 
                    className="h-2 rounded-full bg-success" 
                    style={{ width: "20%" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
