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
import { StatusBadge } from "@/components/ui/status-badge";
import { Search, MoreHorizontal, ExternalLink, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Domain {
  id: string;
  domain: string;
  status: "pending" | "verified";
  region: string;
  created_at: string;
}

export default function DomainsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("us-east-1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domainToRemove, setDomainToRemove] = useState<{ id: string; domain: string } | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDomains = async () => {
    try {
      const response = await api("/domains");
      if (response.ok) {
        const data = await response.json();
        setDomains(data);
      }
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        toast.error("Failed to load domains");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error("Please enter a domain name");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api("/domains", {
        method: "POST",
        body: { domain: newDomain, region: selectedRegion },
      });

      if (response.ok) {
        toast.success("Domain added successfully");
        setIsAddDialogOpen(false);
        setNewDomain("");
        setSelectedRegion("us-east-1");
        fetchDomains(); // Refresh the list
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to add domain");
      }
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
      <TopBar 
        title="Domains" 
        subtitle="Manage your sending domains"
        action={{
          label: "Add domain",
          onClick: () => setIsAddDialogOpen(true),
        }}
      />
      
      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              <SelectItem value="us-east-1">us-east-1</SelectItem>
              <SelectItem value="eu-west-1">eu-west-1</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : domains.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No domains found
                  </TableCell>
                </TableRow>
              ) : (
                domains.map((domain) => (
                  <TableRow 
                    key={domain.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/domains/${domain.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {domain.domain}
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={domain.status} />
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {domain.region}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(domain.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View DNS records</DropdownMenuItem>
                          <DropdownMenuItem>Configure</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDomainToRemove({ id: domain.id, domain: domain.domain })}
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Domain Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add domain</DialogTitle>
            <DialogDescription>
              Add a new domain to start sending emails. You'll need to configure DNS records to verify ownership.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain name</Label>
              <Input
                id="domain"
                placeholder="mail.example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                  <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                  <SelectItem value="ap-south-1">Asia Pacific (Mumbai)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAddDomain} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Domain Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!domainToRemove}
        onOpenChange={(open) => !open && setDomainToRemove(null)}
        title="Remove domain"
        description={`Are you sure you want to remove "${domainToRemove?.domain}"? This action cannot be undone and will stop all email sending and receiving for this domain.`}
        confirmLabel="Remove domain"
        onConfirm={() => {
          toast.success("Domain removed successfully");
          setDomainToRemove(null);
        }}
      />
    </>
  );
}
