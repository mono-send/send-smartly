import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HintCards } from "./HintCards";
import { MessageBubble } from "./MessageBubble";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatPanelProps {
  messages: Message[];
  isGenerating: boolean;
  onSendPrompt: (prompt: string) => void;
  onClearConversation?: () => void;
}

export function ChatPanel({
  messages,
  isGenerating,
  onSendPrompt,
  onClearConversation,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    onSendPrompt(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-sm font-medium">AI Email Assistant</span>
        </div>
        {hasMessages && onClearConversation && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClearConversation}
            disabled={isGenerating}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasMessages && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-purple-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-base">
                Start Building Your Email
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Describe the email template you want to create, and I'll
                generate the HTML code for you.
              </p>
            </div>
            <HintCards onSelect={onSendPrompt} disabled={isGenerating} />
          </div>
        )}

        {hasMessages && (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
              />
            ))}
          </>
        )}

        {isGenerating && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            className="min-h-[60px] max-h-[120px] pr-12 resize-none bg-background"
            disabled={isGenerating}
            rows={2}
          />
          <Button
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8 rounded-full"
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
