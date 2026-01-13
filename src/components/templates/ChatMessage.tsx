import React, { useState } from "react";
import { Copy, Check, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Prism from "prismjs";
import "prismjs/components/prism-markup";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  // timestamp: Date;
  codeGenerated?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  // timestamp,
  codeGenerated,
}) => {
  // const [showTimestamp, setShowTimestamp] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (codeGenerated) {
      await navigator.clipboard.writeText(codeGenerated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const highlightCode = (code: string) => {
    try {
      return Prism.highlight(code, Prism.languages.markup, "markup");
    } catch (e) {
      return code;
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        role === "user" ? "flex-row-reverse" : "flex-row"
      )}
      {/* onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)} */}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-purple-100 text-purple-600"
        )}
      >
        {role === "user" ? (
          <User className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col gap-2 max-w-[80%]",
          role === "user" ? "items-end" : "items-start"
        )}
      >
        {/* Message Bubble */}
        <div
          className={cn(
            "px-4 py-2 rounded-lg",
            role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        </div>

        {/* Code Block if present */}
        {codeGenerated && (
          <div className="w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
              <span className="text-xs text-slate-400 font-medium">
                Generated HTML
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3 overflow-x-auto max-h-[300px] overflow-y-auto">
              <pre className="text-xs text-slate-300">
                <code
                  className="language-html"
                  dangerouslySetInnerHTML={{
                    __html: highlightCode(codeGenerated),
                  }}
                />
              </pre>
            </div>
            <style>{`
              .language-html .token.tag { color: #7dd3fc; }
              .language-html .token.attr-name { color: #a5f3fc; }
              .language-html .token.attr-value { color: #fde047; }
              .language-html .token.punctuation { color: #94a3b8; }
              .language-html .token.comment { color: #64748b; font-style: italic; }
              .language-html .token.doctype { color: #f472b6; }
              .language-html .token { color: #e2e8f0; }
            `}</style>
          </div>
        )}

        {/* Timestamp */}
        /* {showTimestamp && (
          <span className="text-xs text-muted-foreground px-1">
            {formatTime(timestamp)}
          </span>
        )} */
      </div>
    </div>
  );
};
