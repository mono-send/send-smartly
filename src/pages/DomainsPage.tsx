import { formatDistanceToNow } from "date-fns";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MoreVertical, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Domain {
  id: string;
  domain: string;
  status: "pending" | "pending_dns" | "unverified" | "verified" | "suspended";
  region: string;
  created_at: string;
}

export default function DomainsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDomains = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (regionFilter !== "all") {
        params.append("region", regionFilter);
      }

      const queryString = params.toString();
      const response = await api(`/domains${queryString ? `?${queryString}` : ""}`);
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
    const timeout = setTimeout(() => {
      fetchDomains();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, statusFilter, regionFilter]);

  return (
    <>
      <TopBar
        title="Domains"
        subtitle="Manage your sending domains"
        action={{
          label: "Add domain",
          onClick: () => navigate("/domains/new"),
        }}
      />

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[150px] max-w-xs">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 bg-white hover:border-stone-300 focus-within:border-stone-300 focus-within:shadow-input hover:shadow-input-hover focus-within:shadow-input focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="pending_dns">Pending DNS</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              <SelectItem value="us-east-1">us-east-1</SelectItem>
              <SelectItem value="eu-west-1">eu-west-1</SelectItem>
              <SelectItem value="ap-south-1">ap-south-1</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="uppercase text-xs">
                <TableHead className="h-10 rounded-tl-2xl">Domain</TableHead>
                <TableHead className="h-10">Status</TableHead>
                <TableHead className="h-10">Region</TableHead>
                <TableHead className="h-10">Created</TableHead>
                <TableHead className="w-[50px] h-10 rounded-tr-2xl"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
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
                    <TableCell className="px-4 py-2 font-medium">
                      <div className="flex items-center gap-2">
                        {domain.domain}
                        <a
                          href={`https://${domain.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${domain.domain} in a new tab`}
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <StatusBadge className="uppercase" status={domain.status} />
                    </TableCell>
                    <TableCell className="px-4 py-2 font-mono text-sm text-muted-foreground">
                      {domain.region}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-muted-foreground">
                      {formatDistanceToNow(new Date(domain.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/domains/${domain.id}`)}>
                            View DNS records
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

    </>
  );
}
