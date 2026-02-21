import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Copy, Loader2, Monitor, Smartphone, Send, MoreVertical, GripVertical, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TemplateCodeEditor } from "@/components/templates/TemplateCodeEditor";
import { SendTestEmailDialog } from "@/components/templates/SendTestEmailDialog";
import { AIChatPanel } from "@/components/templates/AIChatPanel";
import { ChatProvider, useChat } from "@/contexts/ChatContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
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

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
}

function TemplateDetailsPageContent() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isOpen: isAIChatOpen, togglePanel } = useChat();

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showSendTestDialog, setShowSendTestDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Track if there are unsaved changes
  const hasChanges = template
    ? name !== template.name || subject !== template.subject || body !== template.body
    : false;

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) {
      return;
    }

    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>("a[href]"));
    links.forEach((link) => {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    });
  }, [body]);

  // Browser beforeunload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate("/templates");
    }
  }, [hasChanges, navigate]);

  const handleConfirmLeave = () => {
    setShowUnsavedDialog(false);
    navigate("/templates");
  };

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
          navigate(`/templates/legacy/${duplicated.id}`);
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
            onClick={handleClose}
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
          <Button
            variant={isAIChatOpen ? "default" : "outline"}
            size="sm"
            className="h-9"
            onClick={togglePanel}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Try Mono
          </Button>
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
            disabled={isSaving || !hasChanges}
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

      {/* Main Content with Resizable Panels */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Left Panel - AI Chat + Code Editor */}
        <ResizablePanel defaultSize={50} minSize={30}>
          {isAIChatOpen ? (
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* AI Chat Panel */}
              <ResizablePanel defaultSize={70} minSize={30} maxSize={80}>
                <AIChatPanel
                  onCodeGenerated={setBody}
                  currentCode={body}
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Code Editor */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <TemplateCodeEditor value={body} onChange={setBody} />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="h-full flex flex-col">
              {/* Code Editor with Syntax Highlighting and Undo/Redo */}
              <TemplateCodeEditor value={body} onChange={setBody} />
            </div>
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Preview */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col">
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
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto">
              <div
                className={cn(
                  "bg-white mx-auto min-h-full",
                  previewMode === "desktop" ? "max-w-full" : "max-w-[375px]"
                )}
              >
                <div
                  className="p-4"
                  ref={previewContainerRef}
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Send Test Email Dialog */}
      {template && (
        <SendTestEmailDialog
          open={showSendTestDialog}
          onOpenChange={setShowSendTestDialog}
          templateId={template.id}
          subject={subject}
          body={body}
        />
      )}

      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Leave without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TemplateDetailsPage() {
  return (
    <ChatProvider>
      <TemplateDetailsPageContent />
    </ChatProvider>
  );
}
