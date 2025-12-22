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

export interface ApiKeyData {
  name: string;
  permission: string;
  domain: string;
}

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: ApiKeyData;
  onSubmit: (data: ApiKeyData) => void;
}

const permissionValueMap: Record<string, string> = {
  "Full access": "full",
  "Sending access": "sending",
  "Read only": "read",
};

const permissionLabelMap: Record<string, string> = {
  full: "Full access",
  sending: "Sending access",
  read: "Read only",
};

const domainValueMap: Record<string, string> = {
  "All domains": "all",
  "Specific domains": "specific",
};

const domainLabelMap: Record<string, string> = {
  all: "All domains",
  specific: "Specific domains",
};

export function ApiKeyDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
}: ApiKeyDialogProps) {
  const [name, setName] = useState("");
  const [permission, setPermission] = useState("full");
  const [domain, setDomain] = useState("all");

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name);
      setPermission(permissionValueMap[initialData.permission] || "full");
      setDomain(domainValueMap[initialData.domain] || "all");
    } else if (open && !initialData) {
      setName("");
      setPermission("full");
      setDomain("all");
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    onSubmit({
      name,
      permission: permissionLabelMap[permission],
      domain: domainLabelMap[domain],
    });
    onOpenChange(false);
  };

  const isEdit = mode === "edit";

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
                <SelectItem value="full">Full access</SelectItem>
                <SelectItem value="sending">Sending access</SelectItem>
                <SelectItem value="read">Read only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Domain access</Label>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All domains</SelectItem>
                <SelectItem value="specific">Specific domains</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEdit ? "Save changes" : "Create key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
