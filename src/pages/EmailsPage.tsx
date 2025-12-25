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
import { Search, MoreHorizontal, Calendar, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";
import { toast } from "sonner";

const mockEmails = [
  {
    id: "1",
    to: "john@example.com",
    subject: "Welcome to MonoSend",
    status: "delivered" as const,
    sent: "2 minutes ago",
  },
  {
    id: "2",
    to: "sarah@startup.io",
    subject: "Your invoice is ready",
    status: "opened" as const,
    sent: "15 minutes ago",
  },
  {
    id: "3",
    to: "dev@company.com",
    subject: "Password reset request",
    status: "sent" as const,
    sent: "1 hour ago",
  },
  {
    id: "4",
    to: "marketing@brand.co",
    subject: "Weekly newsletter",
    status: "clicked" as const,
    sent: "2 hours ago",
  },
  {
    id: "5",
    to: "invalid@bounce.test",
    subject: "Account verification",
    status: "bounced" as const,
    sent: "3 hours ago",
  },
  {
    id: "6",
    to: "queue@example.com",
    subject: "Scheduled report",
    status: "queued" as const,
    sent: "5 hours ago",
  },
];

interface Email {
  id: string;
  to: string;
  subject: string;
  status: "delivered" | "opened" | "sent" | "clicked" | "bounced" | "queued";
  sent: string;
}

export default function EmailsPage() {
  const [search, setSearch] = useState("");
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [emailToDelete, setEmailToDelete] = useState<Email | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const navigate = useNavigate();

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

  return (
    <>
      <TopBar title="Emails" subtitle="View and manage your sent emails" />
      
      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select defaultValue="all">
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="clicked">Clicked</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="7">
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
        )}

        {/* Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                    className={isSomeSelected ? "data-[state=checked]:bg-primary data-[state=unchecked]:bg-primary/50" : ""}
                  />
                </TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emails.map((email) => (
                <TableRow 
                  key={email.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/emails/${email.id}`)}
                  data-selected={selectedIds.has(email.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(email.id)}
                      onCheckedChange={() => toggleSelect(email.id)}
                      aria-label={`Select email to ${email.to}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{email.to}</TableCell>
                  <TableCell>
                    <StatusBadge status={email.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{email.subject}</TableCell>
                  <TableCell className="text-muted-foreground">{email.sent}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/emails/${email.id}`)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Resend</DropdownMenuItem>
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
            </TableBody>
          </Table>
        </div>

        {/* Pagination hint */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {emails.length} of {emails.length} emails</span>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={!!emailToDelete}
        onOpenChange={(open) => !open && setEmailToDelete(null)}
        onConfirm={handleDeleteEmail}
        title="Delete Email"
        description={`Are you sure you want to delete the email to "${emailToDelete?.to}"? This action cannot be undone.`}
      />

      <ConfirmDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        title="Delete Selected Emails"
        description={`Are you sure you want to delete ${selectedIds.size} email${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`}
      />
    </>
  );
}
