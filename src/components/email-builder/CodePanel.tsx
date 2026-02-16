import { useState } from "react";
import { Copy, Check, Search, Sparkles, PanelRight, PanelBottom } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodePanelProps {
  emailHtml: string | null;
  onEmailHtmlChange?: (value: string) => void;
  historyIndex?: number;
  historyTotal?: number;
  layoutMode: "bottom" | "right";
  onToggleLayoutMode: () => void;
  isLayoutToggleDisabled?: boolean;
}

function beautifyHTML(html: string): string {
  const INDENT = "  ";
  const VOID_ELEMENTS = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
  ]);
  const INLINE_ELEMENTS = new Set([
    "a", "abbr", "b", "bdo", "br", "cite", "code", "dfn", "em", "i",
    "img", "kbd", "q", "samp", "small", "span", "strong", "sub", "sup",
    "time", "var",
  ]);
  const PRESERVE_CONTENT_TAGS = new Set(["script", "style"]);

  const result = html.trim();
  const tokens: { type: "tag" | "text" | "comment"; content: string; tagName?: string; isClosing?: boolean; isSelfClosing?: boolean }[] = [];
  const tagRegex = /(<\/?[a-zA-Z][^>]*\/?>|<!--[\s\S]*?-->)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(result)) !== null) {
    if (match.index > lastIndex) {
      const text = result.slice(lastIndex, match.index);
      if (text.trim()) {
        tokens.push({ type: "text", content: text.trim() });
      }
    }

    const tag = match[1];
    if (tag.startsWith("<!--")) {
      tokens.push({ type: "comment", content: tag });
    } else {
      const tagName = tag.replace(/<\/?(\w+).*/, "$1").toLowerCase();
      const isClosing = tag.startsWith("</");
      const isSelfClosing = tag.endsWith("/>") || VOID_ELEMENTS.has(tagName);
      tokens.push({ type: "tag", content: tag, tagName, isClosing, isSelfClosing });
    }

    lastIndex = tagRegex.lastIndex;
  }

  if (lastIndex < result.length) {
    const text = result.slice(lastIndex);
    if (text.trim()) {
      tokens.push({ type: "text", content: text.trim() });
    }
  }

  let output = "";
  let indentLevel = 0;
  let preserveTagDepth = 0;

  for (const token of tokens) {
    const indent = INDENT.repeat(indentLevel);

    if (token.type === "comment") {
      output += indent + token.content + "\n";
      continue;
    }

    if (token.type === "text") {
      if (preserveTagDepth > 0) {
        output += token.content + "\n";
      } else {
        output += indent + token.content + "\n";
      }
      continue;
    }

    const isInline = token.tagName ? INLINE_ELEMENTS.has(token.tagName) : false;
    if (token.isClosing) {
      if (token.tagName && PRESERVE_CONTENT_TAGS.has(token.tagName)) {
        preserveTagDepth = Math.max(0, preserveTagDepth - 1);
      }
      indentLevel = Math.max(0, indentLevel - 1);
      output += INDENT.repeat(indentLevel) + token.content + "\n";
      continue;
    }

    output += indent + token.content + "\n";
    if (!token.isSelfClosing && !isInline) {
      indentLevel++;
      if (token.tagName && PRESERVE_CONTENT_TAGS.has(token.tagName)) {
        preserveTagDepth++;
      }
    }
  }

  return output.trim();
}

export function CodePanel({
  emailHtml,
  onEmailHtmlChange,
  historyIndex,
  historyTotal,
  layoutMode,
  onToggleLayoutMode,
  isLayoutToggleDisabled,
}: CodePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!emailHtml) return;
    await navigator.clipboard.writeText(emailHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    if (!emailHtml || !onEmailHtmlChange) return;
    onEmailHtmlChange(beautifyHTML(emailHtml));
  };

  const lines = emailHtml ? emailHtml.split("\n") : [];
  const toggleLabel = layoutMode === "bottom" ? "Move code panel to right" : "Move code panel to bottom";

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        layoutMode === "bottom" ? "border-t border-border" : "border-l border-border"
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleFormat}
            disabled={!emailHtml}
          >
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
        <div className="flex items-center gap-2">
          {historyTotal != null && historyTotal > 0 && (
            <span className="text-xs text-muted-foreground">
              History: {historyIndex ?? historyTotal}/{historyTotal}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={onToggleLayoutMode}
            disabled={isLayoutToggleDisabled}
            aria-label={toggleLabel}
            title={toggleLabel}
          >
            {layoutMode === "bottom" ? (
              <PanelRight className="h-3.5 w-3.5" />
            ) : (
              <PanelBottom className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
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
