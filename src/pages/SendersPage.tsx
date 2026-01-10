import { TopBar } from "@/components/layout/TopBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreVertical } from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";
import { SenderDialog, SenderData } from "@/components/dialogs/SenderDialog";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Sender {
  id: string;
  name: string;
  from: string;
  domain: {
    id: string;
    name: string;
  };
  reply_to?: string;
  created_at: string;
  updated_at: string;
}

export default function SendersPage() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [senderToDelete, setSenderToDelete] = useState<{ id: string; name: string } | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSenderId, setEditingSenderId] = useState<string | null>(null);

  const fetchSenders = async () => {
    setIsLoading(true);
    try {
      const response = await api("/senders");
      if (response.ok) {
        const data = await response.json();
        setSenders(data);
      }
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        toast.error("Failed to load senders");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSenders();
  }, []);

  const handleAddSender = () => {
    setDialogMode("create");
    setEditingSenderId(null);
    setIsDialogOpen(true);
  };

  const handleEditSender = (senderId: string) => {
    setDialogMode("edit");
    setEditingSenderId(senderId);
    setIsDialogOpen(true);
  };

  const handleDeleteSender = (senderId: string, senderName: string) => {
    setSenderToDelete({ id: senderId, name: senderName });
  };

  const handleSubmitSender = async (data: SenderData) => {
    setIsSubmitting(true);
    try {
      const endpoint = dialogMode === "create" ? "/senders" : `/senders/${editingSenderId}`;
      const method = dialogMode === "create" ? "POST" : "PUT";

      const response = await api(endpoint, {
        method,
        body: data,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(dialogMode === "create" ? "Sender created successfully" : "Sender updated successfully");
        setIsDialogOpen(false);
        fetchSenders();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save sender");
      }
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteSender = async () => {
    if (!senderToDelete) return;
    setIsDeleting(true);
    try {
      const response = await api(`/senders/${senderToDelete.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "Sender deleted successfully");
        setSenderToDelete(null);
        fetchSenders();
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to delete sender");
      }
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TopBar
        title="Senders"
        subtitle="Manage your email senders"
        action={{
          label: "Add sender",
          onClick: handleAddSender,
        }}
      />

      <div className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          A sender represents the email address with an authorized domain to send emails on your behalf. It helps
          ensure emails are legitimate, not spoofed, and can be trusted by recipients and mail servers.
        </p>
        {/* Table */}
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="uppercase text-xs">
                <TableHead className="h-10 rounded-tl-2xl">Sender Name</TableHead>
                <TableHead className="h-10">From Email</TableHead>
                <TableHead className="h-10">Reply-To</TableHead>
                <TableHead className="w-[50px] h-10 rounded-tr-2xl"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : senders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No senders found
                  </TableCell>
                </TableRow>
              ) : (
                senders.map((sender) => (
                  <TableRow key={sender.id} className="hover:bg-muted/50">
                    <TableCell className="px-4 py-2 font-medium">
                      {sender.name}
                    </TableCell>
                    <TableCell className="px-4 py-2 font-mono text-sm">
                      {sender.from}@{sender.domain.name}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-muted-foreground">
                      {sender.reply_to || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditSender(sender.id)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteSender(sender.id, sender.name)}
                          >
                            Delete
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

      {/* Sender Dialog */}
      <SenderDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={dialogMode}
        editingSenderId={editingSenderId}
        onSubmit={handleSubmitSender}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!senderToDelete}
        onOpenChange={(open) => !open && setSenderToDelete(null)}
        title="Delete sender"
        description={`Are you sure you want to delete "${senderToDelete?.name}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete sender"}
        onConfirm={confirmDeleteSender}
      />
    </>
  );
}
