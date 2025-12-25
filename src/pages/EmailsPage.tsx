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
import { Search, MoreHorizontal, Calendar } from "lucide-react";
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
  const navigate = useNavigate();

  const handleDeleteEmail = () => {
    if (emailToDelete) {
      setEmails(prev => prev.filter(e => e.id !== emailToDelete.id));
      toast.success("Email deleted");
      setEmailToDelete(null);
    }
  };

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

        {/* Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
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
                >
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
    </>
  );
}
