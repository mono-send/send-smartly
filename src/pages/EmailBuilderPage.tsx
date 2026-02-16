import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MoreVertical, Loader2 } from "lucide-react";
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

export default function EmailBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<EBTemplate | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [subject, setSubject] = useState("");
  const [name, setName] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [emailHtml, setEmailHtml] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

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

  // Update template metadata
  const handleUpdate = async () => {
    if (!id || isUpdating) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Name is required", {
        description: "Please enter a template name.",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const response = await api(`/email-builder/templates/${id}`, {
        method: "PUT",
        body: { subject, name: trimmedName },
      });

      if (response.ok) {
        let updatedTemplate: EBTemplate | null = null;
        try {
          updatedTemplate = await response.json();
        } catch {
          // Some backends return an empty success response for updates.
        }

        if (updatedTemplate) {
          setTemplate(updatedTemplate);
          setName(updatedTemplate.name || trimmedName);
          setSubject(updatedTemplate.subject || subject);
        } else {
          setTemplate((prev) =>
            prev
              ? {
                  ...prev,
                  name: trimmedName,
                  subject,
                }
              : prev
          );
          setName(trimmedName);
        }

        toast.success("Template updated", {
          description: "Subject and metadata saved.",
        });
      } else {
        toast.error("Error", {
          description: "Failed to update template",
        });
      }
    } catch {
      toast.error("Error", {
        description: "Failed to update template",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditingName(false);
      return;
    }

    if (e.key === "Escape") {
      setName(template?.name || "");
      setIsEditingName(false);
    }
  };

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
                onBlur={() => setIsEditingName(false)}
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
              placeholder="Email subject line"
              className="w-64 h-8 text-sm"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport}>
                Export to Templates
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            className="h-8"
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? "Saving..." : "UPDATE"}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat Panel */}
        <div className="w-[520px] flex-shrink-0">
          <ChatPanel
            messages={messages}
            isGenerating={isGenerating}
            onSendPrompt={handleSendPrompt}
          />
        </div>

        {/* Right: Preview + Code */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview area */}
          <div className="flex-1 overflow-hidden">
            <PreviewPanel previewHtml={previewHtml} />
          </div>

          {/* Code area (collapsible bottom section) */}
          <div className="h-[280px] flex-shrink-0 overflow-hidden">
            <CodePanel
              emailHtml={emailHtml}
              historyIndex={generationCount}
              historyTotal={generationCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
