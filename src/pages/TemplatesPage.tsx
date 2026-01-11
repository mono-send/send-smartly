import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/layout/TopBar";
import { MoreVertical, Copy, Trash2, Search, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";
import { formatDistanceToNow } from "date-fns";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
  });
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("sort_by", "created_at");
      params.append("sort_dir", "desc");

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const response = await api(`/templates?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTemplates();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const handleOpenDialog = () => {
    setFormData({ name: "", subject: "", body: "" });
    setIsDialogOpen(true);
  };

  const handleCreateTemplate = async () => {
    setIsCreating(true);
    try {
      const response = await api("/templates", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newTemplate = await response.json();
        setTemplates((prev) => [newTemplate, ...prev]);
        setIsDialogOpen(false);
        toast.success("Template created", {
          description: "Your template has been created successfully.",
        });
      } else if (response.status === 400) {
        const error = await response.json();
        toast.error("Error", {
          description: error.detail || "Failed to create template",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to create template",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDuplicate = async (template: Template) => {
    setIsDuplicating(template.id);
    try {
      const response = await api("/templates", {
        method: "POST",
        body: {
          name: `${template.name} (copy)`,
          subject: template.subject,
          body: template.body,
        },
      });

      if (response.ok) {
        const newTemplate = await response.json();
        setTemplates((prev) => [newTemplate, ...prev]);
        toast.success("Template duplicated", {
          description: "Your template has been duplicated successfully.",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to duplicate template",
      });
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);
    try {
      const response = await api(`/templates/${templateToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete.id));
        toast.success("Template deleted", {
          description: "Your template has been deleted successfully.",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to delete template",
      });
    } finally {
      setIsDeleting(false);
      setTemplateToDelete(null);
    }
  };

  return (
    <>
      <TopBar
        title="Dynamic Templates"
        subtitle="Create and manage email templates"
        action={{
          label: "Create template",
          onClick: handleOpenDialog,
        }}
      />

      <div className="p-6">
        {/* Search */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[150px] max-w-xs">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ID, Name or Subject"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 bg-white hover:border-stone-300 focus-within:border-stone-300 focus-within:shadow-input hover:shadow-input-hover focus-within:shadow-input focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="uppercase text-xs">
                <TableHead className="h-10 rounded-tl-2xl">Email template</TableHead>
                <TableHead className="h-10">Created</TableHead>
                <TableHead className="h-10">Updated</TableHead>
                <TableHead className="w-[50px] h-10 rounded-tr-2xl"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow 
                    key={template.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/templates/${template.id}`)}
                  >
                    <TableCell className="px-4 py-2">
                      <div className="space-y-1">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">Subject: {template.subject}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-muted-foreground">
                      {formatDistanceToNow(new Date(template.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-muted-foreground">
                      {formatDistanceToNow(new Date(template.updated_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(template)}
                            disabled={isDuplicating === template.id}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setTemplateToDelete(template)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Template name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="Email body content"
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => setIsDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button size="sm" className="h-9" onClick={handleCreateTemplate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!templateToDelete}
        onOpenChange={(open) => !open && setTemplateToDelete(null)}
        onConfirm={handleDelete}
        title="Delete template"
        description={`Are you sure you want to delete "${templateToDelete?.name}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </>
  );
}
