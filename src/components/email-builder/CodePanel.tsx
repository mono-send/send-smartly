import { useState } from "react";
import { Copy, Check, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodePanelProps {
  emailHtml: string | null;
  historyIndex?: number;
  historyTotal?: number;
}

export function CodePanel({ emailHtml, historyIndex, historyTotal }: CodePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!emailHtml) return;
    await navigator.clipboard.writeText(emailHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = emailHtml ? emailHtml.split("\n") : [];

  return (
    <div className="flex flex-col h-full border-t border-border">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
            <Sparkles className="h-3 w-3" />
            Format
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleCopy}
            disabled={!emailHtml}
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            Copy
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
            <Search className="h-3 w-3" />
            Search
          </Button>
        </div>
        {historyTotal != null && historyTotal > 0 && (
          <span className="text-xs text-muted-foreground">
            History: {historyIndex ?? historyTotal}/{historyTotal}
          </span>
        )}
      </div>

      {/* Code view */}
      <div className="flex-1 overflow-auto bg-background">
        {emailHtml ? (
          <div className="flex text-xs font-mono leading-5">
            {/* Line numbers */}
            <div className="flex-shrink-0 py-3 px-3 text-right text-muted-foreground select-none border-r border-border bg-muted/30">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* Code */}
            <pre className="flex-1 py-3 px-4 overflow-x-auto whitespace-pre">
              <code>{emailHtml}</code>
            </pre>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Generated HTML code will appear here
          </div>
        )}
      </div>
    </div>
  );
}
