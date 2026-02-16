import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MoreVertical, Loader2, Send } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatPanel } from "@/components/email-builder/ChatPanel";
import { PreviewPanel } from "@/components/email-builder/PreviewPanel";
import { CodePanel } from "@/components/email-builder/CodePanel";
import { SendTestEmailDialog } from "@/components/templates/SendTestEmailDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface EBTemplate {
  id: string;
  name: string;
  subject: string | null;
  description: string | null;
  category: string;
  preview_html: string | null;
  email_html: string | null;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

type CodePanelLayoutMode = "bottom" | "right";
const CODE_PANEL_LAYOUT_STORAGE_KEY = "emailBuilder.codePanelLayoutMode";

export default function EmailBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [template, setTemplate] = useState<EBTemplate | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [subject, setSubject] = useState("");
  const [name, setName] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [emailHtml, setEmailHtml] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingSubject, setIsSavingSubject] = useState(false);
  const [isHeaderUpdated, setIsHeaderUpdated] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSendTestDialog, setShowSendTestDialog] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [codePanelLayoutMode, setCodePanelLayoutMode] =
    useState<CodePanelLayoutMode>(() => {
      const saved = localStorage.getItem(CODE_PANEL_LAYOUT_STORAGE_KEY);
      return saved === "right" ? "right" : "bottom";
    });
  const nameInputRef = useRef<HTMLInputElement>(null);
  const effectiveLayoutMode: CodePanelLayoutMode = isMobile
    ? "bottom"
    : codePanelLayoutMode;
  const hasUnsavedChanges =
    !!template &&
    (subject !== (template.subject || "") ||
      previewHtml !== template.preview_html ||
      emailHtml !== template.email_html);
  const legacyTemplateId = template?.template_id ?? null;
  const hasLegacyTemplate = Boolean(legacyTemplateId);

  // Fetch template and conversation on mount
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [templateRes, conversationRes] = await Promise.all([
          api(`/email-builder/templates/${id}`),
          api(`/email-builder/templates/${id}/conversation`),
        ]);

        if (templateRes.ok) {
          const t = await templateRes.json();
          setTemplate(t);
          setName(t.name || "");
          setSubject(t.subject || "");
          setPreviewHtml(t.preview_html);
          setEmailHtml(t.email_html);
        } else {
          toast.error("Error", {
            description: "Template not found",
          });
          navigate("/templates");
          return;
        }

        if (conversationRes.ok) {
          const conv = await conversationRes.json();
          setMessages(
            (conv.messages || []).filter(
              (m: Message) => m.role === "user" || m.role === "assistant"
            )
          );
          setGenerationCount(
            (conv.messages || []).filter((m: Message) => m.role === "assistant")
              .length
          );
        }
      } catch {
        toast.error("Error", {
          description: "Failed to load template",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    localStorage.setItem(CODE_PANEL_LAYOUT_STORAGE_KEY, codePanelLayoutMode);
  }, [codePanelLayoutMode]);

  // Send prompt to AI
  const handleSendPrompt = useCallback(
    async (prompt: string) => {
      if (!id || isGenerating) return;

      // Optimistically add user message
      const tempUserMsg: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: prompt,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      setIsGenerating(true);

      try {
        const response = await api(`/email-builder/templates/${id}/generate`, {
          method: "POST",
          body: { prompt },
        });

        if (response.ok) {
          const result = await response.json();

          // Add assistant message
          const assistantMsg: Message = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: result.assistant_message,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);

          // Update preview and code
          setPreviewHtml(result.preview_html);
          setEmailHtml(result.email_html);
          setGenerationCount((prev) => prev + 1);

          // Update subject if returned
          if (result.subject) {
            setSubject(result.subject);
          }
        } else {
          let errorDescription = "Failed to generate template";
          try {
            const err = await response.json();
            if (err?.detail && typeof err.detail === "string") {
              errorDescription = err.detail;
            } else if (err?.message && typeof err.message === "string") {
              errorDescription = err.message;
            }
          } catch {
            // Keep fallback description when the error response is not JSON.
          }

          toast.error("Generation failed", {
            description: errorDescription,
          });
          // Remove optimistic user message
          setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        }
      } catch {
        toast.error("Error", {
          description: "Failed to connect to AI service",
        });
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      } finally {
        setIsGenerating(false);
      }
    },
    [id, isGenerating, toast]
  );

  // Keep UPDATE behavior aligned with Export to Templates.
  const handleUpdate = async () => {
    if (isUpdating || (!hasUnsavedChanges && !isHeaderUpdated)) return;
    setIsUpdating(true);
    try {
      await handleExport();
      setTemplate((prev) =>
        prev
          ? {
              ...prev,
              subject,
              preview_html: previewHtml,
              email_html: emailHtml,
            }
          : prev
      );
      setIsHeaderUpdated(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSaveName();
      return;
    }

    if (e.key === "Escape") {
      setName(template?.name || "");
      setIsEditingName(false);
    }
  };

  const handleSaveName = useCallback(async () => {
    if (!id || !template || isSavingName) {
      setIsEditingName(false);
      return;
    }

    const nextName = name.trim();
    const currentName = template.name || "";

    // Ignore empty/whitespace-only values.
    if (!nextName) {
      setName(currentName);
      setIsEditingName(false);
      return;
    }

    // No-op when the name hasn't changed.
    if (nextName === currentName) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      const response = await api(`/email-builder/templates/${id}`, {
        method: "PATCH",
        body: { name: nextName },
      });

      if (!response.ok) {
        throw new Error("Failed to update template name");
      }

      setTemplate((prev) => (prev ? { ...prev, name: nextName } : prev));
      setName(nextName);
      setIsHeaderUpdated(true);
    } catch {
      setName(currentName);
      toast.error("Error", {
        description: "Failed to update template name",
      });
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
    }
  }, [id, template, name, isSavingName]);

  const handleSaveSubject = useCallback(async () => {
    if (!id || !template || isSavingSubject) {
      return;
    }

    const nextSubject = subject.trim();
    const currentSubject = template.subject || "";

    // Ignore empty/whitespace-only values.
    if (!nextSubject) {
      setSubject(currentSubject);
      return;
    }

    // No-op when the subject hasn't changed.
    if (nextSubject === currentSubject) {
      setSubject(currentSubject);
      return;
    }

    setIsSavingSubject(true);
    try {
      const response = await api(`/email-builder/templates/${id}`, {
        method: "PATCH",
        body: { subject: nextSubject },
      });

      if (!response.ok) {
        throw new Error("Failed to update template subject");
      }

      setTemplate((prev) => (prev ? { ...prev, subject: nextSubject } : prev));
      setSubject(nextSubject);
      setIsHeaderUpdated(true);
    } catch {
      setSubject(currentSubject);
      toast.error("Error", {
        description: "Failed to update template subject",
      });
    } finally {
      setIsSavingSubject(false);
    }
  }, [id, template, subject, isSavingSubject]);

  // Export to legacy template system
  const handleExport = async () => {
    if (!id) return;

    try {
      const response = await api(`/email-builder/templates/${id}/export`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Template exported", {
          description:
            "Your template has been exported to the templates library.",
        });
      } else {
        toast.error("Error", {
          description: "Failed to export template",
        });
      }
    } catch {
      toast.error("Error", {
        description: "Failed to export template",
      });
    }
  };

  const handleDuplicate = async () => {
    if (!legacyTemplateId || isDuplicating) return;

    setIsDuplicating(true);
    try {
      const response = await api(`/templates/${legacyTemplateId}/duplicate`, {
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
    } catch {
      toast.error("Failed to duplicate template");
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (!legacyTemplateId || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await api(`/templates/${legacyTemplateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Template deleted");
        navigate("/templates");
      } else {
        const error = await response.json();
        toast.error("Failed to delete", { description: error.detail });
      }
    } catch {
      toast.error("Failed to delete template");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("/templates")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            {isEditingName ? (
              <Input
                ref={nameInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => {
                  void handleSaveName();
                }}
                onKeyDown={handleNameKeyDown}
                className="h-7 w-64 px-1 text-sm font-semibold"
              />
            ) : (
              <h1
                className="text-sm font-semibold cursor-pointer hover:text-muted-foreground transition-colors"
                onClick={() => setIsEditingName(true)}
              >
                {name || "Untitled Template"}
              </h1>
            )}
            <p className="text-xs text-muted-foreground">
              Template ID: {id?.slice(0, 8)}...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Subject
            </span>
            <span className="text-red-500">*</span>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onBlur={() => {
                void handleSaveSubject();
              }}
              placeholder="Email subject line"
              className="w-64 h-8 text-sm"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDuplicate}
                disabled={!hasLegacyTemplate || isDuplicating}
              >
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowSendTestDialog(true)}
                disabled={!hasLegacyTemplate}
              >
                <Send className="h-4 w-4" />
                Test email
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={!hasLegacyTemplate || isDeleting}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            className="h-8"
            onClick={handleUpdate}
            disabled={isUpdating || (!hasUnsavedChanges && !isHeaderUpdated)}
          >
            {isUpdating ? (
              <span className="flex items-center gap-0.5">
                <span>◔ ◡ ◔</span>
                <span className="inline-flex">
                  <span className="animate-bounce [animation-delay:0ms]">.</span>
                  <span className="animate-bounce [animation-delay:150ms]">.</span>
                  <span className="animate-bounce [animation-delay:300ms]">.</span>
                </span>
              </span>
            ) : (
              "UPDATE"
            )}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Left: Chat Panel */}
        <ResizablePanel defaultSize={35} minSize={20} maxSize={60}>
          <ChatPanel
            messages={messages}
            isGenerating={isGenerating}
            onSendPrompt={handleSendPrompt}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Preview + Code */}
        <ResizablePanel defaultSize={65} minSize={30}>
          <div className="h-full flex flex-col overflow-hidden">
            {effectiveLayoutMode === "bottom" ? (
              <ResizablePanelGroup direction="vertical" className="h-full">
                {/* Preview area */}
                <ResizablePanel defaultSize={65} minSize={30}>
                  <PreviewPanel previewHtml={previewHtml} />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Code area */}
                <ResizablePanel defaultSize={35} minSize={20}>
                  <CodePanel
                    emailHtml={emailHtml}
                    onEmailHtmlChange={(value) => setEmailHtml(value)}
                    historyIndex={generationCount}
                    historyTotal={generationCount}
                    layoutMode={effectiveLayoutMode}
                    onToggleLayoutMode={() =>
                      setCodePanelLayoutMode((prev) =>
                        prev === "bottom" ? "right" : "bottom"
                      )
                    }
                    isLayoutToggleDisabled={isMobile}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* Preview area */}
                <ResizablePanel defaultSize={65} minSize={30}>
                  <PreviewPanel previewHtml={previewHtml} />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Code area */}
                <ResizablePanel defaultSize={35} minSize={25}>
                  <CodePanel
                    emailHtml={emailHtml}
                    onEmailHtmlChange={(value) => setEmailHtml(value)}
                    historyIndex={generationCount}
                    historyTotal={generationCount}
                    layoutMode={effectiveLayoutMode}
                    onToggleLayoutMode={() =>
                      setCodePanelLayoutMode((prev) =>
                        prev === "bottom" ? "right" : "bottom"
                      )
                    }
                    isLayoutToggleDisabled={isMobile}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {legacyTemplateId && (
        <SendTestEmailDialog
          open={showSendTestDialog}
          onOpenChange={setShowSendTestDialog}
          templateId={legacyTemplateId}
          domainId={null}
          subject={subject}
          body={emailHtml || previewHtml || ""}
        />
      )}
    </div>
  );
}
