import { useEffect, useRef, useState, useCallback } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import { cn } from "@/lib/utils";

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

  // Highlight code with Prism
  const getHighlightedCode = useCallback((code: string) => {
    // First highlight HTML
    let highlighted = Prism.highlight(code, Prism.languages.markup, "markup");
    
    // Then highlight template variables {{variable}}
    highlighted = highlighted.replace(
      /\{\{(\w+)\}\}/g,
      '<span class="token template-variable">{{$1}}</span>'
    );
    
    return highlighted;
  }, []);

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

  const lineNumbers = value.split("\n").map((_, i) => i + 1);

  return (
    <div ref={containerRef} className={cn("flex-1 flex overflow-hidden relative", className)}>
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
          onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
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
      `}</style>
    </div>
  );
}
