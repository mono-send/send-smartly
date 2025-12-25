import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Globe, Code, MoreHorizontal, ExternalLink, AlertTriangle, Mail } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
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

// Mock data - in real app would fetch by ID
const mockDomains: Record<string, {
  id: string;
  domain: string;
  status: "verified" | "pending";
  region: string;
  regionLabel: string;
  created: string;
  sendingEnabled: boolean;
  receivingEnabled: boolean;
  dkimRecords: Array<{
    type: string;
    name: string;
    content: string;
    ttl: string;
    priority?: string;
    status: "verified" | "pending" | "not_started";
  }>;
  spfRecords: Array<{
    type: string;
    name: string;
    content: string;
    ttl: string;
    priority?: string;
    status: "verified" | "pending" | "not_started";
  }>;
  mxRecords: Array<{
    type: string;
    name: string;
    content: string;
    ttl: string;
    priority?: string;
    status: "verified" | "pending" | "not_started";
  }>;
}> = {
  "1": {
    id: "1",
    domain: "mail.monosend.co",
    status: "verified",
    region: "us-east-1",
    regionLabel: "North Virginia (us-east-1)",
    created: "2 days ago",
    sendingEnabled: true,
    receivingEnabled: false,
    dkimRecords: [
      {
        type: "TXT",
        name: "resend._domainkey",
        content: "p=MIGfMA0GCSqGSIb3DQEB...",
        ttl: "Auto",
        status: "verified"
      }
    ],
    spfRecords: [
      {
        type: "MX",
        name: "send",
        content: "feedback-smtp.us-east-1...",
        ttl: "60",
        priority: "10",
        status: "verified"
      },
      {
        type: "TXT",
        name: "send",
        content: "v=spf1 include:amazonses...",
        ttl: "60",
        status: "verified"
      }
    ],
    mxRecords: [
      {
        type: "MX",
        name: "@",
        content: "inbound-smtp.us-east-1...",
        ttl: "60",
        priority: "9",
        status: "not_started"
      }
    ]
  },
  "2": {
    id: "2",
    domain: "notify.example.com",
    status: "verified",
    region: "us-east-1",
    regionLabel: "North Virginia (us-east-1)",
    created: "1 week ago",
    sendingEnabled: true,
    receivingEnabled: true,
    dkimRecords: [
      {
        type: "TXT",
        name: "resend._domainkey",
        content: "p=MIGfMA0GCSqGSIb3DQEB...",
        ttl: "Auto",
        status: "verified"
      }
    ],
    spfRecords: [
      {
        type: "MX",
        name: "send",
        content: "feedback-smtp.us-east-1...",
        ttl: "60",
        priority: "10",
        status: "verified"
      },
      {
        type: "TXT",
        name: "send",
        content: "v=spf1 include:amazonses...",
        ttl: "60",
        status: "verified"
      }
    ],
    mxRecords: [
      {
        type: "MX",
        name: "@",
        content: "inbound-smtp.us-east-1...",
        ttl: "60",
        priority: "9",
        status: "verified"
      }
    ]
  },
  "3": {
    id: "3",
    domain: "updates.startup.io",
    status: "pending",
    region: "eu-west-1",
    regionLabel: "Ireland (eu-west-1)",
    created: "3 hours ago",
    sendingEnabled: false,
    receivingEnabled: false,
    dkimRecords: [
      {
        type: "TXT",
        name: "resend._domainkey",
        content: "p=MIGfMA0GCSqGSIb3DQEB...",
        ttl: "Auto",
        status: "pending"
      }
    ],
    spfRecords: [
      {
        type: "MX",
        name: "send",
        content: "feedback-smtp.eu-west-1...",
        ttl: "60",
        priority: "10",
        status: "pending"
      },
      {
        type: "TXT",
        name: "send",
        content: "v=spf1 include:amazonses...",
        ttl: "60",
        status: "pending"
      }
    ],
    mxRecords: [
      {
        type: "MX",
        name: "@",
        content: "inbound-smtp.eu-west-1...",
        ttl: "60",
        priority: "9",
        status: "not_started"
      }
    ]
  }
};

function RecordStatusBadge({ status }: { status: "verified" | "pending" | "not_started" }) {
  const config = {
    verified: { label: "Verified", className: "bg-success/10 text-success border-success/20" },
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

function DNSRecordsTable({ records }: { records: typeof mockDomains["1"]["dkimRecords"] }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[80px]">Type</TableHead>
            <TableHead className="w-[180px]">Name</TableHead>
            <TableHead>Content</TableHead>
            <TableHead className="w-[80px]">TTL</TableHead>
            <TableHead className="w-[80px]">Priority</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => (
            <TableRow key={index}>
              <TableCell className="font-mono text-sm">{record.type}</TableCell>
              <TableCell className="font-mono text-sm">{record.name}</TableCell>
              <TableCell className="font-mono text-sm truncate max-w-[200px]">{record.content}</TableCell>
              <TableCell className="text-muted-foreground">{record.ttl}</TableCell>
              <TableCell className="text-muted-foreground">{record.priority || "-"}</TableCell>
              <TableCell>
                <RecordStatusBadge status={record.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function DomainDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sendingEnabled, setSendingEnabled] = useState(false);
  const [receivingEnabled, setReceivingEnabled] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const domain = id ? mockDomains[id] : null;

  // Initialize state from domain data
  useState(() => {
    if (domain) {
      setSendingEnabled(domain.sendingEnabled);
      setReceivingEnabled(domain.receivingEnabled);
    }
  });

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
                  <MoreHorizontal className="h-4 w-4" />
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
            <p className="text-foreground">{domain.created}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Status</p>
            <StatusBadge status={domain.status} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Region</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">🇺🇸</span>
              <p className="text-foreground">{domain.regionLabel}</p>
            </div>
          </div>
        </div>

        {/* DNS Records Card */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">DNS Records</h2>
            <div className="flex items-center gap-2">
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
            <DNSRecordsTable records={domain.dkimRecords} />
          </div>

          {/* Enable Sending - SPF */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Enable Sending</h3>
              <Switch 
                checked={sendingEnabled} 
                onCheckedChange={setSendingEnabled}
              />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-medium text-sm">SPF</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <DNSRecordsTable records={domain.spfRecords} />
          </div>

          {/* Enable Receiving - MX */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Enable Receiving</h3>
              <Switch 
                checked={receivingEnabled} 
                onCheckedChange={setReceivingEnabled}
              />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-medium text-sm">MX</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <DNSRecordsTable records={domain.mxRecords} />
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Remove domain"
        description={`Are you sure you want to remove "${domain.domain}"? This action cannot be undone and will stop all email sending and receiving for this domain.`}
        confirmLabel="Remove domain"
        onConfirm={() => {
          toast.success("Domain removed successfully");
          navigate("/domains");
        }}
      />
    </>
  );
}
