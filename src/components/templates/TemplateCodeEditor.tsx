import { useRef, useState, useCallback, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import { cn } from "@/lib/utils";
import { Undo2, Redo2, RotateCcw, Sparkles, Copy, Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface TemplateCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Common template variables
const COMMON_VARIABLES = [
  "firstName",
  "lastName",
  "email",
  "name",
  "unsubscribeLink",
  "verificationLink",
  "resetPasswordLink",
  "companyName",
  "websiteUrl",
  "supportEmail",
];

interface HistoryEntry {
  value: string;
  cursorPos: number;
}

const MAX_HISTORY_SIZE = 100;

// Simple HTML beautifier
function beautifyHTML(html: string): string {
  const INDENT = "  ";
  const VOID_ELEMENTS = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr"
  ]);
  const INLINE_ELEMENTS = new Set([
    "a", "abbr", "b", "bdo", "br", "cite", "code", "dfn", "em", "i",
    "img", "kbd", "q", "samp", "small", "span", "strong", "sub", "sup",
    "time", "var"
  ]);

  // Normalize whitespace first
  let result = html.trim();
  
  // Simple tokenization
  const tokens: { type: "tag" | "text" | "comment"; content: string; tagName?: string; isClosing?: boolean; isSelfClosing?: boolean }[] = [];
  const tagRegex = /(<\/?[a-zA-Z][^>]*\/?>|<!--[\s\S]*?-->)/g;
  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(result)) !== null) {
    // Text before this tag
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
      const isClosing = tag.startsWith("</");
      const isSelfClosing = tag.endsWith("/>") || VOID_ELEMENTS.has(tag.replace(/<\/?(\w+).*/, "$1").toLowerCase());
      const tagName = tag.replace(/<\/?(\w+).*/, "$1").toLowerCase();
      tokens.push({ type: "tag", content: tag, tagName, isClosing, isSelfClosing });
    }

    lastIndex = tagRegex.lastIndex;
  }

  // Remaining text
  if (lastIndex < result.length) {
    const text = result.slice(lastIndex);
    if (text.trim()) {
      tokens.push({ type: "text", content: text.trim() });
    }
  }

  // Build formatted output
  let output = "";
  let indentLevel = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const indent = INDENT.repeat(indentLevel);

    if (token.type === "comment") {
      output += indent + token.content + "\n";
    } else if (token.type === "text") {
      output += indent + token.content + "\n";
    } else if (token.type === "tag") {
      const isInline = token.tagName && INLINE_ELEMENTS.has(token.tagName);
      
      if (token.isClosing) {
        indentLevel = Math.max(0, indentLevel - 1);
        const newIndent = INDENT.repeat(indentLevel);
        output += newIndent + token.content + "\n";
      } else if (token.isSelfClosing) {
        output += indent + token.content + "\n";
      } else {
        output += indent + token.content + "\n";
        if (!isInline) {
          indentLevel++;
        }
      }
    }
  }

  return output.trim();
}

export function TemplateCodeEditor({
  value,
  onChange,
  className,
}: TemplateCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [autocompleteFilter, setAutocompleteFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Undo/Redo history
  const historyRef = useRef<HistoryEntry[]>([{ value: "", cursorPos: 0 }]);
  const historyIndexRef = useRef(0);
  const isUndoRedoRef = useRef(false);
  const lastValueRef = useRef(value);
  const initialValueRef = useRef(value);

  // Initialize history with initial value
  if (historyRef.current.length === 1 && historyRef.current[0].value === "" && value !== "") {
    historyRef.current = [{ value, cursorPos: value.length }];
    lastValueRef.current = value;
  }

  // Push to history (called on meaningful changes)
  const pushToHistory = useCallback((newValue: string, cursorPos: number) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    // Don't push if value hasn't changed
    if (history[currentIndex]?.value === newValue) return;

    // Remove any redo history
    historyRef.current = history.slice(0, currentIndex + 1);

    // Add new entry
    historyRef.current.push({ value: newValue, cursorPos });

    // Limit history size
    if (historyRef.current.length > MAX_HISTORY_SIZE) {
      historyRef.current = historyRef.current.slice(-MAX_HISTORY_SIZE);
    }

    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  // Undo function
  const handleUndo = useCallback(() => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex > 0) {
      isUndoRedoRef.current = true;
      historyIndexRef.current = currentIndex - 1;
      const entry = historyRef.current[historyIndexRef.current];
      onChange(entry.value);
      lastValueRef.current = entry.value;

      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(entry.cursorPos, entry.cursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  }, [onChange]);

  // Redo function
  const handleRedo = useCallback(() => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex < historyRef.current.length - 1) {
      isUndoRedoRef.current = true;
      historyIndexRef.current = currentIndex + 1;
      const entry = historyRef.current[historyIndexRef.current];
      onChange(entry.value);
      lastValueRef.current = entry.value;

      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(entry.cursorPos, entry.cursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  }, [onChange]);

  // Format HTML function
  const formatHTML = useCallback(() => {
    const formatted = beautifyHTML(value);
    if (formatted !== value) {
      onChange(formatted);
      pushToHistory(formatted, 0);
      lastValueRef.current = formatted;
    }
  }, [value, onChange, pushToHistory]);

  const handleRevert = useCallback(() => {
    const initialValue = initialValueRef.current;
    if (value === initialValue) return;

    onChange(initialValue);
    pushToHistory(initialValue, 0);
    lastValueRef.current = initialValue;

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(0, 0);
        textareaRef.current.focus();
      }
    }, 0);
  }, [value, onChange, pushToHistory]);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState<{ start: number; end: number }[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Copy HTML to clipboard
  const handleCopyHTML = useCallback(() => {
    navigator.clipboard.writeText(value);
    toast.success("HTML copied to clipboard");
  }, [value]);

  // Toggle search
  const toggleSearch = useCallback(() => {
    setShowSearch((prev) => {
      if (!prev) {
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      return !prev;
    });
  }, []);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const matches: { start: number; end: number }[] = [];
    const lowerValue = value.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    let startIndex = 0;

    while (true) {
      const index = lowerValue.indexOf(lowerQuery, startIndex);
      if (index === -1) break;
      matches.push({ start: index, end: index + searchQuery.length });
      startIndex = index + 1;
    }

    setSearchMatches(matches);
    if (matches.length > 0 && currentMatchIndex >= matches.length) {
      setCurrentMatchIndex(0);
    }
  }, [searchQuery, value]);

  // Navigate to match
  const goToMatch = useCallback((index: number) => {
    if (searchMatches.length === 0) return;
    const match = searchMatches[index];
    if (textareaRef.current && match) {
      textareaRef.current.setSelectionRange(match.start, match.end);
      textareaRef.current.focus();
      
      // Scroll to match position
      const lines = value.slice(0, match.start).split("\n");
      const lineIndex = lines.length - 1;
      const lineHeight = 24;
      textareaRef.current.scrollTop = lineIndex * lineHeight - 100;
    }
  }, [searchMatches, value]);

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

  // Close search on Escape
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowSearch(false);
      setSearchQuery("");
    } else if (e.key === "Enter") {
      if (e.shiftKey) {
        goToPrevMatch();
      } else {
        goToNextMatch();
      }
    }
  };

  // Highlight code with Prism and search matches
  const getHighlightedCode = useCallback((code: string) => {
    // First highlight HTML
    let highlighted = Prism.highlight(code, Prism.languages.markup, "markup");
    
    // Then highlight template variables {{variable}}
    highlighted = highlighted.replace(
      /\{\{(\w+)\}\}/g,
      '<span class="token template-variable">{{$1}}</span>'
    );

    // If searching, highlight search matches
    if (searchQuery.trim() && searchMatches.length > 0) {
      const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi');
      highlighted = highlighted.replace(regex, '<span class="search-highlight">$1</span>');
    }
    
    return highlighted;
  }, [searchQuery, searchMatches.length]);

  // Sync scroll between textarea and highlight overlay
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Detect if we're typing a variable
  const detectVariableTyping = (text: string, cursorPos: number) => {
    const beforeCursor = text.slice(0, cursorPos);
    const match = beforeCursor.match(/\{\{(\w*)$/);
    return match ? match[1] : null;
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);

    // Push to history on significant changes (debounced via space, newline, or after typing stops)
    const lastValue = lastValueRef.current;
    const addedChar = newValue.length === lastValue.length + 1 
      ? newValue[cursorPos - 1] 
      : null;
    
    // Push to history on space, newline, or significant deletion
    if (
      addedChar === " " || 
      addedChar === "\n" || 
      newValue.length < lastValue.length - 1 ||
      Math.abs(newValue.length - lastValue.length) > 5
    ) {
      pushToHistory(newValue, cursorPos);
    }
    lastValueRef.current = newValue;

    // Check for variable autocomplete
    const variablePrefix = detectVariableTyping(newValue, cursorPos);
    
    if (variablePrefix !== null) {
      setAutocompleteFilter(variablePrefix);
      setSelectedIndex(0);
      
      // Calculate position for autocomplete dropdown
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const textBeforeCursor = newValue.slice(0, cursorPos);
        const lines = textBeforeCursor.split("\n");
        const currentLineIndex = lines.length - 1;
        const currentLineLength = lines[currentLineIndex].length;
        
        // Approximate position (this is simplified)
        const lineHeight = 24; // leading-6
        const charWidth = 8.4; // approximate for monospace
        
        setAutocompletePosition({
          top: (currentLineIndex + 1) * lineHeight + 16,
          left: Math.min(currentLineLength * charWidth + 40, 400),
        });
      }
      
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  };

  const filteredVariables = COMMON_VARIABLES.filter((v) =>
    v.toLowerCase().startsWith(autocompleteFilter.toLowerCase())
  );

  const insertVariable = (variable: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const text = value;
    
    // Find the start of the current {{
    const beforeCursor = text.slice(0, cursorPos);
    const startMatch = beforeCursor.match(/\{\{(\w*)$/);
    
    if (startMatch) {
      const startPos = cursorPos - startMatch[0].length;
      const newValue =
        text.slice(0, startPos) + `{{${variable}}}` + text.slice(cursorPos);
      
      onChange(newValue);
      pushToHistory(newValue, startPos + variable.length + 4);
      lastValueRef.current = newValue;
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        const newPos = startPos + variable.length + 4;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();
      }, 0);
    }
    
    setShowAutocomplete(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle undo/redo keyboard shortcuts
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    if (modKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }

    if ((modKey && e.shiftKey && e.key === 'z') || (modKey && e.key === 'y')) {
      e.preventDefault();
      handleRedo();
      return;
    }

    if (!showAutocomplete || filteredVariables.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredVariables.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredVariables.length - 1
      );
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertVariable(filteredVariables[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowAutocomplete(false);
    }
  };

  // Push to history when user pauses typing (blur event)
  const handleBlur = () => {
    if (value !== historyRef.current[historyIndexRef.current]?.value) {
      pushToHistory(value, textareaRef.current?.selectionStart || 0);
    }
    setTimeout(() => setShowAutocomplete(false), 150);
  };

  const lineNumbers = value.split("\n").map((_, i) => i + 1);

  // Toolbar component
  const EditorToolbar = () => (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
      </Tooltip>
      <div className="w-px h-5 bg-border mx-1" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={formatHTML}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Format
          </Button>
        </TooltipTrigger>
        <TooltipContent>Auto-format HTML</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleRevert}
            disabled={value === initialValueRef.current}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Revert
          </Button>
        </TooltipTrigger>
        <TooltipContent>Revert to original content</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleCopyHTML}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy HTML to clipboard</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 gap-1.5 text-xs", showSearch && "bg-muted")}
            onClick={toggleSearch}
          >
            <Search className="h-3.5 w-3.5" />
            Search
          </Button>
        </TooltipTrigger>
        <TooltipContent>Search in editor (Ctrl+F)</TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <div ref={containerRef} className={cn("flex-1 flex flex-col overflow-hidden relative", className)}>
      {/* Editor Toolbar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-2 bg-muted/20 shrink-0">
        <EditorToolbar />
        <span className="text-xs text-muted-foreground">
          {canUndo || canRedo ? `History: ${historyIndexRef.current + 1}/${historyRef.current.length}` : ''}
        </span>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="h-10 border-b border-border flex items-center gap-2 px-2 bg-muted/30 shrink-0">
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
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex-1 flex overflow-hidden">
      {/* Line Numbers */}
      <div className="w-10 bg-muted/30 border-r border-border py-4 text-right pr-2 select-none overflow-hidden shrink-0">
        {lineNumbers.map((num) => (
          <div
            key={num}
            className="text-xs text-muted-foreground leading-6 font-mono"
          >
            {num}
          </div>
        ))}
      </div>

      {/* Editor Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Syntax Highlighted Overlay */}
        <pre
          ref={highlightRef}
          className="absolute inset-0 p-4 font-mono text-sm leading-6 pointer-events-none overflow-auto whitespace-pre-wrap break-words m-0"
          aria-hidden="true"
        >
          <code
            className="language-markup"
            dangerouslySetInnerHTML={{
              __html: getHighlightedCode(value) + "\n",
            }}
          />
        </pre>

        {/* Actual Textarea (invisible but interactive) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="absolute inset-0 p-4 bg-transparent resize-none font-mono text-sm leading-6 focus:outline-none overflow-auto text-transparent caret-foreground whitespace-pre-wrap break-words"
          spellCheck={false}
        />

        {/* Autocomplete Dropdown */}
        {showAutocomplete && filteredVariables.length > 0 && (
          <div
            className="absolute z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[200px] max-h-[200px] overflow-auto"
            style={{
              top: autocompletePosition.top,
              left: autocompletePosition.left,
            }}
          >
            <div className="px-2 py-1 text-xs text-muted-foreground border-b border-border mb-1">
              Template Variables
            </div>
            {filteredVariables.map((variable, index) => (
              <button
                key={variable}
                className={cn(
                  "w-full px-3 py-1.5 text-left text-sm font-mono hover:bg-muted/50 flex items-center gap-2",
                  index === selectedIndex && "bg-muted"
                )}
                onClick={() => insertVariable(variable)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="text-primary">{`{{`}</span>
                <span>{variable}</span>
                <span className="text-primary">{`}}`}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* Prism CSS for syntax highlighting */}
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
