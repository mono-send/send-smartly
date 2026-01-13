import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Check, MoreVertical, Key, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ApiKeyDialog, ApiKeyData } from "@/components/dialogs/ApiKeyDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  permission: string;
  last_used_at: string | null;
  created_at: string;
}

const permissionLabels: Record<string, string> = {
  full_access: "Full access",
  sending_access: "Sending access",
  read_only: "Read only",
};

export default function ApiKeysPage() {
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeyItem | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setIsLoading(true);
      const response = await api("/api_keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRevoke = (key: ApiKeyItem) => {
    setKeyToRevoke(key);
    setRevokeDialogOpen(true);
  };

  const handleConfirmRevoke = async () => {
    if (!keyToRevoke) return;

    try {
      setIsRevoking(true);
      const response = await api(`/api_keys/${keyToRevoke.id}`, { method: "DELETE" });

      if (response.ok) {
        toast.success("API key revoked successfully");
        setApiKeys((prev) => prev.filter((k) => k.id !== keyToRevoke.id));
      } else if (response.status === 404) {
        toast.error("API key not found");
      } else {
        toast.error("Failed to revoke API key");
      }
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      toast.error("Failed to revoke API key");
    } finally {
      setIsRevoking(false);
      setRevokeDialogOpen(false);
      setKeyToRevoke(null);
    }
  };

  const handleOpenCreate = () => {
    setDialogMode("create");
    setEditingKeyId(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (key: ApiKeyItem) => {
    setDialogMode("edit");
    setEditingKeyId(key.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: ApiKeyData) => {
    try {
      setIsSubmitting(true);

      if (dialogMode === "create") {
        const response = await api("/api_keys", {
          method: "POST",
          body: {
            name: data.name,
            permission: data.permission,
            domain: data.domain,
          },
        });

        if (response.ok) {
          const result = await response.json();
          toast.success("API key created successfully");
          if (result.token) {
            navigator.clipboard.writeText(result.token);
            toast.info("Full token copied to clipboard - save it now, it won't be shown again!");
          }
          setIsDialogOpen(false);
          fetchApiKeys();
        } else {
          const error = await response.json().catch(() => ({}));
          toast.error(error.detail || "Failed to create API key");
        }
      } else {
        // Edit mode - PUT request
        const response = await api(`/api_keys/${editingKeyId}`, {
          method: "PUT",
          body: {
            name: data.name,
            permission: data.permission,
            domain: data.domain,
          },
        });

        if (response.ok) {
          toast.success("API key updated successfully");
          setIsDialogOpen(false);
          fetchApiKeys();
        } else {
          const error = await response.json().catch(() => ({}));
          toast.error(error.detail || "Failed to update API key");
        }
      }
    } catch (error) {
      console.error("Failed to save API key:", error);
      toast.error(`Failed to ${dialogMode === "create" ? "create" : "update"} API key`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (id: string, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  return (
    <>
      <TopBar
        title="API Keys"
        subtitle="Manage your API keys for authentication"
        action={{
          label: "Create API key",
          onClick: handleOpenCreate,
        }}
      />

      <div className="p-6">
        {/* Info card */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Key className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-card-foreground">Keep your API keys secure</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Never share your API keys in public repositories or client-side code. Use environment variables instead.
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="uppercase text-xs">
                <TableHead className="h-10 rounded-tl-2xl">Name</TableHead>
                <TableHead className="h-10">Token</TableHead>
                <TableHead className="h-10">Permission</TableHead>
                <TableHead className="h-10">Last used</TableHead>
                <TableHead className="h-10">Created</TableHead>
                <TableHead className="w-[50px] h-10 rounded-tr-2xl"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : apiKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Key className="h-10 w-10 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No API keys yet</p>
                      <p className="text-sm text-muted-foreground/70">Create your first API key to get started</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map((key) => (
                  <TableRow
                    key={key.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/api-keys/${key.id}`)}
                  >
                    <TableCell className="font-medium px-4 py-2">{key.name}</TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                          {key.key}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(key.id, key.key);
                          }}
                        >
                          {copiedId === key.id ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge variant="secondary">
                        {permissionLabels[key.permission] || key.permission}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground px-4 py-2">
                      {formatDate(key.last_used_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground px-4 py-2">
                      {formatDate(key.created_at)}
                    </TableCell>
                    <TableCell className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(key)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Will be implemented soon")}>
                            Roll key
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleOpenRevoke(key)}
                          >
                            Revoke
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ApiKeyDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={dialogMode}
        editingKeyId={editingKeyId}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the API key "{keyToRevoke?.name}"? This action cannot be undone and any applications using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking} className="h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRevoke}
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9"
            >
              {isRevoking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
