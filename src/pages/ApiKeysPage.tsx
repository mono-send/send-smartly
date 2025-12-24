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
import { Copy, Check, MoreHorizontal, Key } from "lucide-react";
import { useState } from "react";
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

const mockApiKeys = [
  {
    id: "1",
    name: "Production",
    token: "ms_live_••••••••••••••••",
    permission: "Full access",
    lastUsed: "2 minutes ago",
    created: "1 month ago",
  },
  {
    id: "2",
    name: "Development",
    token: "ms_test_••••••••••••••••",
    permission: "Sending access",
    lastUsed: "1 hour ago",
    created: "2 weeks ago",
  },
  {
    id: "3",
    name: "Analytics",
    token: "ms_live_••••••••••••••••",
    permission: "Read only",
    lastUsed: "Never",
    created: "3 days ago",
  },
];

export default function ApiKeysPage() {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingKey, setEditingKey] = useState<ApiKeyData | undefined>(undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<typeof mockApiKeys[0] | null>(null);

  const handleOpenRevoke = (key: typeof mockApiKeys[0]) => {
    setKeyToRevoke(key);
    setRevokeDialogOpen(true);
  };

  const handleConfirmRevoke = () => {
    console.log("Revoked key:", keyToRevoke?.id);
    // In real app, would revoke key via backend
    setRevokeDialogOpen(false);
    setKeyToRevoke(null);
  };

  const handleOpenCreate = () => {
    setDialogMode("create");
    setEditingKey(undefined);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (key: typeof mockApiKeys[0]) => {
    setDialogMode("edit");
    setEditingKey({
      name: key.name,
      permission: key.permission,
      domain: "All domains",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: ApiKeyData) => {
    console.log("Submitted:", data);
    // In real app, would save to backend
  };

  const handleCopy = (id: string, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockApiKeys.map((key) => (
                <TableRow 
                  key={key.id} 
                  className="cursor-pointer"
                  onClick={() => navigate(`/api-keys/${key.id}`)}
                >
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                        {key.token}
                      </code>
                        <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(key.id, key.token);
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
                  <TableCell>
                    <Badge variant="secondary">{key.permission}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{key.lastUsed}</TableCell>
                  <TableCell className="text-muted-foreground">{key.created}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(key)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Roll key</DropdownMenuItem>
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ApiKeyDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={dialogMode}
        initialData={editingKey}
        onSubmit={handleSubmit}
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
