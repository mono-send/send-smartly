import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export interface ApiKeyData {
  name: string;
  permission: string;
  domain: string | null;
}

interface Domain {
  id: string;
  domain: string;
  name?: string;
}

interface DomainApiResponse {
  id: string;
  domain?: string;
  name?: string;
}

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  editingKeyId?: string | null;
  onSubmit: (data: ApiKeyData) => void;
  isSubmitting?: boolean;
}

const permissionValueMap: Record<string, string> = {
  "Full access": "full_access",
  "Sending access": "sending_access",
  "Read only": "read_only",
};

const permissionLabelMap: Record<string, string> = {
  full_access: "Full access",
  sending_access: "Sending access",
  read_only: "Read only",
};

export function ApiKeyDialog({
  open,
  onOpenChange,
  mode,
  editingKeyId,
  onSubmit,
  isSubmitting = false,
}: ApiKeyDialogProps) {
  const [name, setName] = useState("");
  const [permission, setPermission] = useState("full_access");
  const [domainType, setDomainType] = useState<"all" | "specific">("all");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const [isLoadingKey, setIsLoadingKey] = useState(false);

  // Fetch API key details when editing
  useEffect(() => {
    if (open && mode === "edit" && editingKeyId) {
      fetchKeyDetails(editingKeyId);
    } else if (open && mode === "create") {
      setName("");
      setPermission("full_access");
      setDomainType("all");
      setSelectedDomain(null);
    }
  }, [open, mode, editingKeyId]);

  const fetchKeyDetails = async (keyId: string) => {
    try {
      setIsLoadingKey(true);
      const response = await api(`/api_keys/${keyId}`);
      if (response.ok) {
        const data = await response.json();
        setName(data.name || "");
        setPermission(data.permission || "full_access");
        if (data.domain) {
          setDomainType("specific");
          setSelectedDomain(data.domain);
        } else {
          setDomainType("all");
          setSelectedDomain(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch API key details:", error);
    } finally {
      setIsLoadingKey(false);
    }
  };

  useEffect(() => {
    if (open && domainType === "specific" && domains.length === 0) {
      fetchDomains();
    }
  }, [open, domainType, domains.length]);

  const fetchDomains = async () => {
    try {
      setIsLoadingDomains(true);
      const response = await api("/domains");
      if (response.ok) {
        const data = await response.json();
        const domainItems: DomainApiResponse[] = Array.isArray(data) ? data : data.items || [];
        const normalizedDomains = domainItems
          .map((domain) => {
            const domainString = domain.domain || domain.name || "";

            return {
              id: domain.id,
              domain: domainString,
              name: domain.name,
            };
          })
          .filter((domain) => domain.domain);
        setDomains(normalizedDomains);
      }
    } catch (error) {
      console.error("Failed to fetch domains:", error);
    } finally {
      setIsLoadingDomains(false);
    }
  };

  const handleDomainTypeChange = (value: string) => {
    setDomainType(value as "all" | "specific");
    if (value === "all") {
      setSelectedDomain(null);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      name,
      permission,
      domain: domainType === "specific" ? selectedDomain : null,
    });
  };

  const isEdit = mode === "edit";
  const isFormValid = name.trim() !== "" && (domainType === "all" || selectedDomain);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit API key" : "Create API key"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the settings for this API key."
              : "Create a new API key to authenticate your requests."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoadingKey ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="keyName">Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

          <div className="space-y-2">
            <Label htmlFor="permission">Permission</Label>
            <Select value={permission} onValueChange={setPermission}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_access">Full access</SelectItem>
                <SelectItem value="sending_access">Sending access</SelectItem>
                <SelectItem value="read_only">Read only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Domain access</Label>
            <Select value={domainType} onValueChange={handleDomainTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All domains</SelectItem>
                <SelectItem value="specific">Specific domain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {domainType === "specific" && (
            <div className="space-y-2">
              <Label>Select domain</Label>
              {isLoadingDomains ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading domains...
                </div>
              ) : domains.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No domains available</p>
              ) : (
                <Select value={selectedDomain || ""} onValueChange={setSelectedDomain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((domain) => (
                      <SelectItem key={domain.id || domain.domain} value={domain.domain}>
                        {domain.domain || domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            )}
          </>
        )}
        </div>

        <DialogFooter>
          <Button className="h-9" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button className="h-9" onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Saving..." : "Creating..."}
              </>
            ) : (
              isEdit ? "Save changes" : "Create key"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
