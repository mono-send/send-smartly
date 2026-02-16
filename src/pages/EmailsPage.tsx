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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MoreVertical, Calendar, Trash2, X, RefreshCw, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";
import { ConfirmActionDialog } from "@/components/dialogs/ConfirmActionDialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface Email {
  id: string;
  to_email: string;
  from_email: string;
  subject: string;
  status: "delivered" | "opened" | "sent" | "clicked" | "bounced" | "queued" | "failed";
  created_at: string;
}

interface EmailsResponse {
  items: Array<{
    id: string;
    to_email: string;
    from_email: string;
    subject: string;
    status: string;
    created_at: string;
    event: {
      status: string;
      created_at: string;
    } | null;
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

export default function EmailsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7");
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [emailToDelete, setEmailToDelete] = useState<Email | null>(null);
  const [emailToResend, setEmailToResend] = useState<Email | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkResendDialog, setShowBulkResendDialog] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toEmailParam = searchParams.get("to")?.trim() ?? "";

  useEffect(() => {
    if (toEmailParam && search.length === 0) {
      setSearch(toEmailParam);
    }
  }, [search.length, toEmailParam]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchEmails = useCallback(async (cursor?: string, replace = false) => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    if (replace) {
      setIsLoading(true);
      setNextCursor(null);
    } else if (cursor) {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      
      if (toEmailParam) {
        params.append("to_email", toEmailParam);
      }

      if (statusFilter !== "all") {
        params.append("status_filter", statusFilter);
      }
      
      const { start_at, end_at } = getDateRange(dateRange);
      params.append("start_at", start_at);
      params.append("end_at", end_at);

      if (cursor) {
        params.append("cursor", cursor);
      }
      
      const queryString = params.toString();
      const endpoint = queryString ? `/emails?${queryString}` : "/emails";
      
      const response = await api(endpoint);
      
      if (!response.ok) {
        throw new Error("Failed to fetch emails");
      }
      
      const data: EmailsResponse = await response.json();
      
      const mappedEmails: Email[] = data.items.map((item) => ({
        id: item.id,
        to_email: item.to_email,
        from_email: item.from_email,
        subject: item.subject,
        status: item.status as Email["status"],
        created_at: item.created_at,
      }));

      setEmails((prev) => {
        if (replace || !cursor) {
          return mappedEmails;
        }

        const existingIds = new Set(prev.map((email) => email.id));
        const uniqueNewEmails = mappedEmails.filter((email) => !existingIds.has(email.id));
        return [...prev, ...uniqueNewEmails];
      });

      setNextCursor(data.next_cursor);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
      toast.error("Failed to load emails");
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [debouncedSearch, statusFilter, dateRange, toEmailParam]);

  useEffect(() => {
    setSelectedIds(new Set());
    fetchEmails(undefined, true);
  }, [fetchEmails]);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement) return;

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && nextCursor && !isLoading && !isLoadingMore) {
        fetchEmails(nextCursor);
      }
    }, {
      rootMargin: "200px",
      threshold: 0.1,
    });

    observer.observe(loadMoreElement);

    return () => {
      observer.unobserve(loadMoreElement);
    };
  }, [fetchEmails, isLoading, isLoadingMore, nextCursor]);

  const handleDeleteEmail = () => {
    if (emailToDelete) {
      setEmails(prev => prev.filter(e => e.id !== emailToDelete.id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(emailToDelete.id);
        return next;
      });
      toast.success("Email deleted");
      setEmailToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    setEmails(prev => prev.filter(e => !selectedIds.has(e.id)));
    toast.success(`${selectedIds.size} email${selectedIds.size > 1 ? 's' : ''} deleted`);
    setSelectedIds(new Set());
    setShowBulkDeleteDialog(false);
  };

  const handleResendEmail = () => {
    if (emailToResend) {
      toast.success(`Email to "${emailToResend.to_email}" queued for resend`);
      setEmailToResend(null);
    }
  };

  const handleBulkResend = () => {
    toast.success(`${selectedIds.size} email${selectedIds.size > 1 ? 's' : ''} queued for resend`);
    setSelectedIds(new Set());
    setShowBulkResendDialog(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === emails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(emails.map(e => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllSelected = emails.length > 0 && selectedIds.size === emails.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < emails.length;

  const formatSentTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const handleClearToFilter = useCallback(() => {
    if (!toEmailParam) {
      return;
    }

    setSearch("");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("to");
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams, toEmailParam]);

  return (
    <>
      <TopBar title="Email Activity" subtitle="View and manage your sent emails" />
      
      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[150px] max-w-xs">
            <button
              type="button"
              onClick={handleClearToFilter}
              disabled={!toEmailParam}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground disabled:cursor-default"
              aria-label={toEmailParam ? "Clear to filter" : "Search"}
            >
              {toEmailParam ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
            <Input
              placeholder="Search by ID, To, Subject"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 bg-white hover:border-stone-300 focus-within:border-stone-300 focus-within:shadow-input hover:shadow-input-hover focus-within:shadow-input focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="clicked">Clicked</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px] bg-white">
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

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedIds.size} email{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="h-7 gap-1 text-xs"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBulkResendDialog(true)}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Resend Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="uppercase text-xs">
                {/* <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                    className={isSomeSelected ? "data-[state=checked]:bg-primary data-[state=unchecked]:bg-primary/50" : ""}
                    disabled={isLoading || emails.length === 0}
                  />
                </TableHead> */}
                <TableHead className="h-10 rounded-tl-2xl">To</TableHead>
                <TableHead className="h-10">Status</TableHead>
                <TableHead className="h-10">Subject</TableHead>
                <TableHead className="h-10">Sent</TableHead>
                <TableHead className="w-[50px] h-10 rounded-tr-2xl"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {/* <TableCell><Skeleton className="h-4 w-4" /></TableCell> */}
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : emails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No emails found
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {emails.map((email) => (
                    <TableRow 
                      key={email.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/emails/${email.id}`)}
                      data-selected={selectedIds.has(email.id)}
                    >
                      {/* <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(email.id)}
                          onCheckedChange={() => toggleSelect(email.id)}
                          aria-label={`Select email to ${email.to_email}`}
                        />
                      </TableCell> */}
                      <TableCell className="font-medium px-4 py-2">{email.to_email}</TableCell>
                      <TableCell className="px-4 py-2">
                        <StatusBadge status={email.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground px-4 py-2">{email.subject}</TableCell>
                      <TableCell className="text-muted-foreground px-4 py-2">{formatSentTime(email.created_at)}</TableCell>
                      <TableCell className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/emails/${email.id}`)}>
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEmailToResend(email)}>
                              Resend
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setEmailToDelete(email)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} className="h-14 text-center text-muted-foreground">
                      {isLoadingMore ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading more emails
                        </div>
                      ) : nextCursor ? (
                        <div ref={loadMoreRef}>Load more</div>
                      ) : (
                        <span>No more emails</span>
                      )}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination hint */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {emails.length} email{emails.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={!!emailToDelete}
        onOpenChange={(open) => !open && setEmailToDelete(null)}
        onConfirm={handleDeleteEmail}
        title="Delete Email"
        description={`Are you sure you want to delete the email to "${emailToDelete?.to_email}"? This action cannot be undone.`}
      />

      <ConfirmDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        title="Delete Selected Emails"
        description={`Are you sure you want to delete ${selectedIds.size} email${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`}
      />

      <ConfirmActionDialog
        open={!!emailToResend}
        onOpenChange={(open) => !open && setEmailToResend(null)}
        onConfirm={handleResendEmail}
        title="Resend Email"
        description={`Are you sure you want to resend the email to "${emailToResend?.to_email}"? A new copy of this email will be sent.`}
        confirmLabel="Resend"
      />

      <ConfirmActionDialog
        open={showBulkResendDialog}
        onOpenChange={setShowBulkResendDialog}
        onConfirm={handleBulkResend}
        title="Resend Selected Emails"
        description={`Are you sure you want to resend ${selectedIds.size} email${selectedIds.size > 1 ? 's' : ''}? New copies will be sent to all recipients.`}
        confirmLabel="Resend All"
      />
    </>
  );
}
