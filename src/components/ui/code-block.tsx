import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
  showHeader?: boolean;
}

export function CodeBlock({
  code,
  language = "javascript",
  className,
  showLineNumbers = false,
  showHeader = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  const copyButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={cn(
        "h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground",
        !showHeader && "bg-code/60"
      )}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </Button>
  );

  return (
    <div className={cn("relative rounded-lg bg-code border border-code-border", className)}>
      {showHeader ? (
        <div className="flex items-center justify-between border-b border-code-border px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">{language}</span>
          {copyButton}
        </div>
      ) : (
        <div className="absolute right-3 top-3">
          {copyButton}
        </div>
      )}
      <div className="overflow-x-auto p-4">
        <pre className={cn("text-sm", !showHeader && "pr-14")}>
          <code className="text-code-foreground font-mono">
            {showLineNumbers ? (
              lines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="mr-4 select-none text-muted-foreground/50 w-6 text-right">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </div>
              ))
            ) : (
              code
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}
