import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Copy, Loader2, Monitor, Smartphone, Send, MoreVertical } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TemplateCodeEditor } from "@/components/templates/TemplateCodeEditor";
import { SendTestEmailDialog } from "@/components/templates/SendTestEmailDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
}

interface Domain {
  id: string;
  domain: string;
  name?: string;
}

export default function TemplateDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showSendTestDialog, setShowSendTestDialog] = useState(false);
  const [defaultDomainId, setDefaultDomainId] = useState<string | null>(null);
  
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const fetchTemplate = async () => {
    setIsLoading(true);
    try {
      const response = await api(`/templates/${id}`);
      if (response.ok) {
        const data: Template = await response.json();
        setTemplate(data);
        setName(data.name);
        setSubject(data.subject);
        setBody(data.body);
      } else if (response.status === 404) {
        toast.error("Template not found");
        navigate("/templates");
      }
    } catch (error) {
      console.error("Failed to fetch template:", error);
      toast.error("Failed to load template");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await api("/domains");
      if (response.ok) {
        const data = await response.json();
        const domainItems = Array.isArray(data) ? data : data.items || [];
        const normalizedDomains = domainItems
          .map((domain: Domain) => ({
            id: domain.id,
            domain: domain.domain || domain.name || "",
            name: domain.name,
          }))
          .filter((domain: Domain) => domain.domain);
        setDefaultDomainId(normalizedDomains.length === 1 ? normalizedDomains[0].id : null);
      }
    } catch (error) {
      console.error("Failed to fetch domains:", error);
    }
  };

  const handleUpdate = async () => {
    if (!template) return;
    
    setIsSaving(true);
    try {
      const response = await api(`/templates/${template.id}`, {
        method: "PUT",
        body: { name, subject, body },
      });

      if (response.ok) {
        const updated = await response.json();
        setTemplate(updated);
        toast.success("Template updated");
      } else {
        const error = await response.json();
        toast.error("Failed to update", { description: error.detail });
      }
    } catch (error) {
      toast.error("Failed to update template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!template) return;
    try {
      const response = await api(`/templates/${template.id}/duplicate`, {
        method: "POST",
      });

      if (response.ok) {
        const duplicated = await response.json();
        toast.success("Template duplicated");
        if (duplicated?.id) {
          navigate(`/templates/${duplicated.id}`);
        }
      } else {
        const error = await response.json();
        toast.error("Failed to duplicate", { description: error.detail });
      }
    } catch (error) {
      toast.error("Failed to duplicate template");
    }
  };

  const handleDelete = async () => {
    if (!template) return;
    try {
      const response = await api(`/templates/${template.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Template deleted");
        navigate("/templates");
      } else {
        const error = await response.json();
        toast.error("Failed to delete", { description: error.detail });
      }
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  const handleCopyId = () => {
    if (template) {
      navigator.clipboard.writeText(template.id);
      toast.success("Template ID copied");
    }
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(body);
    toast.success("Template body copied");
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditingName(false);
    } else if (e.key === "Escape") {
      setName(template?.name || "");
      setIsEditingName(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="h-14 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-9 w-24" />
        </header>
        <div className="flex-1 flex">
          <div className="flex-1 p-4">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="flex-1 p-4">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("/templates")}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex flex-col">
            {isEditingName ? (
              <Input
                ref={nameInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={handleNameKeyDown}
                className="h-7 text-lg font-semibold px-1 border-none focus-visible:ring-1"
              />
            ) : (
              <h1
                className="text-lg font-semibold cursor-pointer hover:text-muted-foreground transition-colors"
                onClick={() => setIsEditingName(true)}
              >
                {name}
              </h1>
            )}
            <button
              onClick={handleCopyId}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Template ID: {template?.id}
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDuplicate}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSendTestDialog(true)}>
                <Send className="h-4 w-4" />
                Test email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            onClick={handleUpdate} 
            disabled={isSaving}
            className="h-9"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                SAVING...
              </>
            ) : (
              "UPDATE"
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Code Editor */}
        <div className="flex-1 flex flex-col border-r border-border min-w-0">
          {/* Code Editor with Syntax Highlighting and Undo/Redo */}
          <TemplateCodeEditor
            value={body}
            onChange={setBody}
          />
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Preview Header */}
          <div className="h-12 border-b border-border flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Subject</span>
              <span className="text-destructive">*</span>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-8 w-64 text-sm bg-white"
                placeholder="Email subject"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", previewMode === "desktop" && "bg-muted")}
                onClick={() => setPreviewMode("desktop")}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", previewMode === "mobile" && "bg-muted")}
                onClick={() => setPreviewMode("mobile")}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
              {/* <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-2"
                onClick={() => setShowSendTestDialog(true)}
              >
                <Send className="h-4 w-4" />
                SEND TEST
              </Button> */}
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto p-4 bg-muted/20">
            <div
              className={cn(
                "bg-white mx-auto shadow-sm border border-border min-h-full",
                previewMode === "desktop" ? "max-w-full" : "max-w-[375px]"
              )}
            >
              <div
                className="p-4"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Send Test Email Dialog */}
      {template && (
        <SendTestEmailDialog
          open={showSendTestDialog}
          onOpenChange={setShowSendTestDialog}
          templateId={template.id}
          domainId={defaultDomainId}
          subject={subject}
          body={body}
        />
      )}
    </div>
  );
}
