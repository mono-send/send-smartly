import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Globe, Code, MoreVertical, ExternalLink, AlertTriangle, Mail, Loader2, Copy, Check, RefreshCw } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DNSRecord {
  id: string;
  dns_standard: "DKIM" | "SPF" | "DMARC" | "MX";
  record_type: string;
  name: string;
  content: string;
  ttl: string;
  priority: number | null;
  status: "verified" | "pending" | "not_started" | "unverified";
  created_at: string;
}

interface DomainData {
  id: string;
  domain: string;
  status: "verified" | "pending" | "unverified";
  region: string;
  enable_sending: boolean;
  enable_receiving: boolean;
  created_at: string;
  dns_records: DNSRecord[];
}

const regionLabels: Record<string, { label: string; flag: string }> = {
  "us-east-1": { label: "North Virginia (us-east-1)", flag: "🇺🇸" },
  "us-west-2": { label: "Oregon (us-west-2)", flag: "🇺🇸" },
  "eu-west-1": { label: "Ireland (eu-west-1)", flag: "🇮🇪" },
  "eu-central-1": { label: "Frankfurt (eu-central-1)", flag: "🇩🇪" },
  "ap-southeast-1": { label: "Singapore (ap-southeast-1)", flag: "🇸🇬" },
  "ap-northeast-1": { label: "Tokyo (ap-northeast-1)", flag: "🇯🇵" },
};

function RecordStatusBadge({ status }: { status: "verified" | "unverified" | "pending" | "not_started" }) {
  const config = {
    verified: { label: "Verified", className: "bg-success/10 text-success border-success/20" },
    unverified: { label: "Unverified", className: "bg-warning/10 text-warning border-warning/20" },
    pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
    not_started: { label: "Not Started", className: "bg-muted text-muted-foreground border-border" }
  };
  
  const { label, className } = config[status];
  
  return (
    <span className={cn("inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}

function CopyableValue({ value, truncate }: { value: string; truncate?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setOpen(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1500);
  };

  return (
    <div className="flex items-center gap-2">
      <span className={cn("font-mono text-sm", truncate && "truncate max-w-[200px]")}>{value}</span>
      <Tooltip open={copied ? true : open} onOpenChange={setOpen} delayDuration={100}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy(value);
            }}
          >
            {copied === value ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          {/* <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-code-foreground/60 hover:text-code-foreground hover:bg-code-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button> */}
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? "Copied" : "Copy"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function DNSRecordsTable({ records }: { records: DNSRecord[] }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 uppercase text-xs">
              <TableHead className="w-[80px] h-10">Type</TableHead>
              <TableHead className="w-[180px] h-10">Name</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="w-[80px] h-10">TTL</TableHead>
              <TableHead className="w-[80px] h-10">Priority</TableHead>
              <TableHead className="w-[100px] h-10">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id} className="group">
                <TableCell className="font-mono text-sm px-4 py-2">{record.record_type}</TableCell>
                <TableCell className="px-4 py-2">
                  <CopyableValue value={record.name} />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <CopyableValue value={record.content} truncate />
                </TableCell>
                <TableCell className="text-muted-foreground px-4 py-2">{record.ttl}</TableCell>
                <TableCell className="text-muted-foreground px-4 py-2">{record.priority ?? "-"}</TableCell>
                <TableCell className="px-4 py-2">
                  <RecordStatusBadge status={record.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
}

export default function DomainDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [domain, setDomain] = useState<DomainData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingEnabled, setSendingEnabled] = useState(false);
  const [isUpdatingSending, setIsUpdatingSending] = useState(false);
  const [receivingEnabled, setReceivingEnabled] = useState(false);
  const [isUpdatingReceiving, setIsUpdatingReceiving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSendingToggle = async (checked: boolean) => {
    if (!domain) return;
    setIsUpdatingSending(true);
    try {
      const response = await api(`/domains/${domain.id}/flags`, {
        method: "PATCH",
        body: { enable_sending: checked },
      });
      if (response.ok) {
        setSendingEnabled(checked);
        toast.success(`Sending ${checked ? "enabled" : "disabled"} successfully.`);
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to update sending status");
      }
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setIsUpdatingSending(false);
    }
  };

  const handleReceivingToggle = async (checked: boolean) => {
    if (!domain) return;
    setIsUpdatingReceiving(true);
    try {
      const response = await api(`/domains/${domain.id}/flags`, {
        method: "PATCH",
        body: { enable_receiving: checked },
      });
      if (response.ok) {
        setReceivingEnabled(checked);
        toast.success(`Receiving ${checked ? "enabled" : "disabled"} successfully.`);
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to update receiving status");
      }
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setIsUpdatingReceiving(false);
    }
  };

  const handleRefresh = async () => {
    if (!domain) return;
    setIsRefreshing(true);
    try {
      const response = await api(`/domains/${domain.id}`);
      if (response.ok) {
        const data = await response.json();
        setDomain(data);
        setSendingEnabled(data.enable_sending);
        setReceivingEnabled(data.enable_receiving);
        toast.success("Domain status refreshed successfully.");
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to refresh domain");
      }
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        toast.error("An error occurred while refreshing domain");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchDomain = async () => {
      if (!id) return;
      try {
        const response = await api(`/domains/${id}`);
        if (response.ok) {
          const data = await response.json();
          setDomain(data);
          setSendingEnabled(data.enable_sending);
          setReceivingEnabled(data.enable_receiving);
        } else {
          const data = await response.json();
          toast.error(data.detail || "Failed to load domain");
          setDomain(null);
        }
      } catch (error: any) {
        if (error.message !== "Unauthorized") {
          toast.error("An error occurred while loading domain");
        }
        setDomain(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDomain();
  }, [id]);

  const handleDelete = async () => {
    if (!domain) return;
    setIsDeleting(true);
    try {
      const response = await api(`/domains/${domain.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "Domain removed successfully");
        navigate("/domains");
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to remove domain");
      }
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <TopBar 
          title="Domains" 
          showBackButton
          onBack={() => navigate("/domains")}
        />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (!domain) {
    return (
      <>
        <TopBar 
          title="Domain not found" 
          showBackButton
          onBack={() => navigate("/domains")}
        />
        <div className="p-6">
          <p className="text-muted-foreground">The requested domain could not be found.</p>
        </div>
      </>
    );
  }

  const dkimRecords = domain.dns_records.filter(r => r.dns_standard === "DKIM");
  const spfRecords = domain.dns_records.filter(r => r.dns_standard === "SPF");
  const dmarcRecords = domain.dns_records.filter(r => r.dns_standard === "DMARC");
  const mxRecords = domain.dns_records.filter(r => r.dns_standard === "MX");

  const regionInfo = regionLabels[domain.region] || { label: domain.region, flag: "🌍" };

  return (
    <>
      <TopBar 
        title="Domains" 
        showBackButton
        onBack={() => navigate("/domains")}
      />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted border border-border">
              <Globe className="h-8 w-8 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Domain</p>
              <h1 className="text-2xl font-semibold text-foreground">{domain.domain}</h1>
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
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Verify now</DropdownMenuItem>
                <DropdownMenuItem>Copy domain</DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  Remove domain
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Created</p>
            <p className="text-foreground">
              {formatDistanceToNow(new Date(domain.created_at), { addSuffix: true })}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Status</p>
            <StatusBadge status={domain.status} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Region</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">{regionInfo.flag}</span>
              <p className="text-foreground">{regionInfo.label}</p>
            </div>
          </div>
        </div>

        {/* Unverified Domain Alert */}
        {domain.status === "unverified" && (
          <Alert className="mb-6 bg-destructive/5 border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertTitle className="text-destructive">No DNS records found</AlertTitle>
            <AlertDescription className="text-destructive/90">
              Please add the DNS records below to verify domain ownership.
            </AlertDescription>
          </Alert>
        )}

        {/* DNS Records Card */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">DNS Records</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="gap-2 bg-primary"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                How to add records
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Domain Verification - DKIM */}
          <div className="mb-8">
            <h3 className="font-medium text-foreground mb-2">Domain Verification</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-medium text-sm">DKIM</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {dkimRecords.length > 0 ? (
              <DNSRecordsTable records={dkimRecords} />
            ) : (
              <p className="text-sm text-muted-foreground">No DKIM records configured</p>
            )}
          </div>

          {/* Enable Sending - SPF */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Enable Sending</h3>
              <Switch 
                checked={sendingEnabled} 
                onCheckedChange={handleSendingToggle}
                disabled={isUpdatingSending}
              />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-medium text-sm">SPF</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {spfRecords.length > 0 ? (
              <DNSRecordsTable records={spfRecords} />
            ) : (
              <p className="text-sm text-muted-foreground">No SPF records configured</p>
            )}

            <div className="flex items-center gap-2 mb-4 mt-6">
              <span className="font-medium text-sm">DMARC (Optional)</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {dmarcRecords.length > 0 ? (
              <DNSRecordsTable records={dmarcRecords} />
            ) : (
              <p className="text-sm text-muted-foreground">No DMARC records configured</p>
            )}
          </div>

          {/* Enable Receiving - MX */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Enable Receiving</h3>
              <Switch 
                checked={receivingEnabled} 
                onCheckedChange={handleReceivingToggle}
                disabled={isUpdatingReceiving}
              />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-medium text-sm">MX</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {mxRecords.length > 0 ? (
              <DNSRecordsTable records={mxRecords} />
            ) : (
              <p className="text-sm text-muted-foreground">No MX records configured</p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Remove domain"
        description={`Are you sure you want to remove "${domain.domain}"? This action cannot be undone and will stop all email sending and receiving for this domain.`}
        confirmLabel={isDeleting ? "Removing..." : "Remove domain"}
        onConfirm={handleDelete}
      />
    </>
  );
}
