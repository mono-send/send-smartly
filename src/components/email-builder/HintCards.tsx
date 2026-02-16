interface HintCardsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const hints = [
  "Create a welcome email template with a header and CTA button",
  "Design a password reset email with a verification link",
  "Build a promotional email with product showcase",
  "Generate a newsletter template with multiple sections",
];

export function HintCards({ onSelect, disabled }: HintCardsProps) {
  return (
    <div className="space-y-3 px-2">
      {hints.map((hint) => (
        <button
          key={hint}
          onClick={() => onSelect(hint)}
          disabled={disabled}
          className="w-full text-left p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-sm text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hint}
        </button>
      ))}
    </div>
  );
}
