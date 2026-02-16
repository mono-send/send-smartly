import { useState, useEffect, useRef, useCallback } from "react";
import {
  Copy,
  Check,
  Search,
  Sparkles,
  PanelRight,
  PanelBottom,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CodePanelProps {
  emailHtml: string | null;
  onEmailHtmlChange?: (value: string) => void;
  historyIndex?: number;
  historyTotal?: number;
  layoutMode: "bottom" | "right";
  onToggleLayoutMode: () => void;
  isLayoutToggleDisabled?: boolean;
  isCompact?: boolean;
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
  isCompact = false,
}: CodePanelProps) {
  const [copied, setCopied] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState<{ start: number; end: number }[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const codeContainerRef = useRef<HTMLPreElement>(null);
  const codeTextRef = useRef<HTMLElement>(null);

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

  const toggleSearch = useCallback(() => {
    setShowSearch((prev) => {
      if (!prev) {
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || !emailHtml) {
      setSearchMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const matches: { start: number; end: number }[] = [];
    const lowerValue = emailHtml.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    let startIndex = 0;

    while (true) {
      const index = lowerValue.indexOf(lowerQuery, startIndex);
      if (index === -1) break;
      matches.push({ start: index, end: index + searchQuery.length });
      startIndex = index + 1;
    }

    setSearchMatches(matches);
    setCurrentMatchIndex((prev) => (matches.length === 0 ? 0 : Math.min(prev, matches.length - 1)));
  }, [searchQuery, emailHtml]);

  const goToMatch = useCallback((index: number) => {
    if (!emailHtml || searchMatches.length === 0) return;
    const match = searchMatches[index];
    const codeEl = codeTextRef.current;
    const containerEl = codeContainerRef.current;
    if (!match || !codeEl || !containerEl || !codeEl.firstChild) return;

    const range = document.createRange();
    range.setStart(codeEl.firstChild, match.start);
    range.setEnd(codeEl.firstChild, match.end);

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const lines = emailHtml.slice(0, match.start).split("\n");
    const lineIndex = lines.length - 1;
    const lineHeight = 20;
    containerEl.scrollTop = Math.max(0, lineIndex * lineHeight - 80);
  }, [emailHtml, searchMatches]);

  const goToNextMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIndex);
    goToMatch(nextIndex);
  }, [currentMatchIndex, searchMatches.length, goToMatch]);

  const goToPrevMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIndex);
    goToMatch(prevIndex);
  }, [currentMatchIndex, searchMatches.length, goToMatch]);

  const closeSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchMatches([]);
    setCurrentMatchIndex(0);
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      closeSearch();
    } else if (e.key === "Enter") {
      if (e.shiftKey) {
        goToPrevMatch();
      } else {
        goToNextMatch();
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      if (modKey && e.key.toLowerCase() === "f" && !isCompact) {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCompact]);

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
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 gap-1.5 text-xs", showSearch && "bg-muted")}
            onClick={toggleSearch}
          >
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

      {showSearch && !isCompact && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/20">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search..."
            className="h-7 w-64 text-sm"
          />
          {searchMatches.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {currentMatchIndex + 1} of {searchMatches.length}
            </span>
          )}
          {searchQuery && searchMatches.length === 0 && (
            <span className="text-xs text-muted-foreground">No results</span>
          )}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={goToPrevMatch}
              disabled={searchMatches.length === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={goToNextMatch}
              disabled={searchMatches.length === 0}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={closeSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Code view */}
      {!isCompact && (
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
              <pre
                ref={codeContainerRef}
                className="flex-1 py-3 px-4 overflow-x-auto whitespace-pre"
              >
                <code ref={codeTextRef}>{emailHtml}</code>
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Generated HTML code will appear here
            </div>
          )}
        </div>
      )}
    </div>
  );
}
