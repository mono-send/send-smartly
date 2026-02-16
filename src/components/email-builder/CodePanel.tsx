import { useState, useEffect, useRef, useCallback } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
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
  const [hasNavigated, setHasNavigated] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const codeValue = emailHtml ?? "";
  const lines = codeValue.split("\n");
  const toggleLabel =
    layoutMode === "bottom" ? "Move code panel to right" : "Move code panel to bottom";

  const handleCopy = async () => {
    if (!codeValue) return;
    await navigator.clipboard.writeText(codeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    if (!codeValue || !onEmailHtmlChange) return;
    onEmailHtmlChange(beautifyHTML(codeValue));
  };

  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const getHighlightedCode = useCallback((code: string) => {
    let highlighted = Prism.highlight(code, Prism.languages.markup, "markup");

    highlighted = highlighted.replace(
      /\{\{(\w+)\}\}/g,
      '<span class="token template-variable">{{$1}}</span>'
    );

    if (searchQuery.trim() && searchMatches.length > 0) {
      const escapeRegex = (str: string) =>
        str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escapeRegex(searchQuery)})`, "gi");
      highlighted = highlighted.replace(regex, '<span class="search-highlight">$1</span>');
    }

    return highlighted;
  }, [searchQuery, searchMatches.length]);

  const closeSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchMatches([]);
    setCurrentMatchIndex(0);
    setHasNavigated(false);
    if (textareaRef.current) {
      textareaRef.current.setSelectionRange(0, 0);
    }
  }, []);

  const toggleSearch = useCallback(() => {
    setShowSearch((prev) => {
      if (!prev) {
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || !codeValue) {
      setSearchMatches([]);
      setCurrentMatchIndex(0);
      setHasNavigated(false);
      return;
    }

    const matches: { start: number; end: number }[] = [];
    const lowerValue = codeValue.toLowerCase();
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
    setHasNavigated(false);
  }, [searchQuery, codeValue]);

  const goToMatch = useCallback((index: number) => {
    if (!textareaRef.current || searchMatches.length === 0 || !codeValue) return;
    const match = searchMatches[index];
    if (!match) return;

    textareaRef.current.setSelectionRange(match.start, match.end);
    textareaRef.current.focus();

    const linesBefore = codeValue.slice(0, match.start).split("\n");
    const lineIndex = linesBefore.length - 1;
    const lineHeight = 20;
    textareaRef.current.scrollTop = Math.max(0, lineIndex * lineHeight - 80);
    handleScroll();
  }, [searchMatches, codeValue, handleScroll]);

  const goToNextMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const nextIndex = hasNavigated
      ? (currentMatchIndex + 1) % searchMatches.length
      : currentMatchIndex;
    setCurrentMatchIndex(nextIndex);
    setHasNavigated(true);
    goToMatch(nextIndex);
  }, [searchMatches.length, hasNavigated, currentMatchIndex, goToMatch]);

  const goToPrevMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const prevIndex = hasNavigated
      ? (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length
      : searchMatches.length - 1;
    setCurrentMatchIndex(prevIndex);
    setHasNavigated(true);
    goToMatch(prevIndex);
  }, [searchMatches.length, hasNavigated, currentMatchIndex, goToMatch]);

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

  useEffect(() => {
    if (isCompact && showSearch) {
      closeSearch();
    }
  }, [isCompact, showSearch, closeSearch]);

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        layoutMode === "bottom" ? "border-t border-border" : "border-l border-border"
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleFormat}
            disabled={!codeValue}
          >
            <Sparkles className="h-3 w-3" />
            Format
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleCopy}
            disabled={!codeValue}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
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

      {!isCompact && (
        <div className="flex-1 overflow-auto bg-background">
          {codeValue ? (
            <div className="flex-1 flex overflow-hidden text-xs font-mono">
              <div className="w-10 bg-muted/30 border-r border-border py-3 text-right pr-2 select-none overflow-hidden shrink-0">
                {lines.map((_, i) => (
                  <div key={i} className="text-muted-foreground leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>

              <div className="flex-1 relative overflow-hidden">
                <pre
                  ref={highlightRef}
                  className="absolute inset-0 py-3 px-4 leading-5 pointer-events-none overflow-auto whitespace-pre m-0"
                  aria-hidden="true"
                >
                  <code
                    className="language-markup"
                    dangerouslySetInnerHTML={{ __html: getHighlightedCode(codeValue) + "\n" }}
                  />
                </pre>

                <textarea
                  ref={textareaRef}
                  value={codeValue}
                  readOnly
                  onScroll={handleScroll}
                  className="absolute inset-0 py-3 px-4 bg-transparent resize-none leading-5 focus:outline-none overflow-auto text-transparent caret-foreground whitespace-pre"
                  spellCheck={false}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Generated HTML code will appear here
            </div>
          )}
        </div>
      )}

      <style>{`
        .token.tag { color: hsl(var(--chart-1)); }
        .token.attr-name { color: hsl(var(--chart-2)); }
        .token.attr-value { color: hsl(var(--chart-3)); }
        .token.punctuation { color: hsl(var(--muted-foreground)); }
        .token.comment { color: hsl(var(--muted-foreground)); font-style: italic; }
        .token.template-variable {
          color: hsl(var(--chart-4));
          background: hsl(var(--chart-4) / 0.1);
          border-radius: 2px;
          padding: 0 2px;
        }
        .search-highlight {
          background: hsl(var(--chart-2) / 0.4);
          border-radius: 2px;
          padding: 0 1px;
        }
      `}</style>
    </div>
  );
}
