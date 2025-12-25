import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type Language = "Python" | "Node.js";

const createContactExamples: Record<Language, string> = {
  "Python": `import monosend

monosend.api_key = "mono_xxxxxxxxx"

params: monosend.Contacts.CreateParams = {
  "email": "customer1@gmail.com",
  "first_name": "John",
  "last_name": "Down",
  "unsubscribed": False,
}

monosend.Contacts.create(params)`,
  "Node.js": `import { MonoSend } from 'monosend';

const monosend = new MonoSend('mono_xxxxxxxxx');

const { data, error } = await monosend.contacts.create({
  email: 'customer1@gmail.com',
  firstName: 'John',
  lastName: 'Down',
  unsubscribed: false
});`
};

const getContactExamples: Record<Language, string> = {
  "Python": `import monosend

monosend.api_key = "mono_xxxxxxxxx"

# Get by contact id
monosend.Contacts.get(
  id="38a1a5f2-1820-4fcb-9bb4-383b79ef60b4",
)

# Get by contact email
monosend.Contacts.get(
  email="customer1@gmail.com",
)`,
  "Node.js": `import { MonoSend } from 'monosend';

const monosend = new MonoSend('mono_xxxxxxxxx');

// Get by contact id
await monosend.contacts.get('38a1a5f2-1820-4fcb-9bb4-383b79ef60b4');

// Get by contact email
await monosend.contacts.get({
  email: 'customer1@gmail.com'
});`
};

const updateContactExamples: Record<Language, string> = {
  "Python": `import monosend

monosend.api_key = "mono_xxxxxxxxx"

# Update by contact id
monosend: resend.Contacts.UpdateParams = {
  "id": "38a1a5f2-1820-4fcb-9bb4-383b79ef60b4",
  "unsubscribed": True
}

monosend.Contacts.update(params)

# Update by contact email
monosend: resend.Contacts.UpdateParams = {
  "email": "customer1@gmail.com",
  "unsubscribed": True
}

monosend.Contacts.update(params)`,
  "Node.js": `import { MonoSend } from 'monosend';

const monosend = new MonoSend('mono_xxxxxxxxx');

// Update by contact id
await monosend.contacts.update({
  id: '38a1a5f2-1820-4fcb-9bb4-383b79ef60b4',
  firstName: 'John',
  unsubscribed: true
});

// Update by contact email
await monosend.contacts.update({
  email: 'customer1@gmail.com',
  firstName: 'John',
  unsubscribed: true
});`
};

const deleteContactExamples: Record<Language, string> = {
  "Python": `import monosend

monosend.api_key = "mono_xxxxxxxxx"

# Delete by contact id
monosend.Contacts.remove(
  id="38a1a5f2-1820-4fcb-9bb4-383b79ef60b4"
)

# Delete by contact email
monosend.Contacts.remove(
  email="customer1@gmail.com"
)`,
  "Node.js": `import { MonoSend } from 'monosend';

const monosend = new MonoSend('mono_xxxxxxxxx');

// Delete by contact id
await monosend.contacts.remove('38a1a5f2-1820-4fcb-9bb4-383b79ef60b4');

// Delete by contact email
await monosend.contacts.remove({
  email: 'customer1@gmail.com',
});`
};

const listContactsExamples: Record<Language, string> = {
  "Python": `import monosend

monosend.api_key = "mono_xxxxxxxxx"

monosend.Contacts.list()`,
  "Node.js": `import { MonoSend } from 'monosend';

const monosend = new MonoSend('mono_xxxxxxxxx');

await monosend.contacts.list({
  limit: 10
});`
};

const languages: Language[] = ["Python", "Node.js"];

interface CodeBlockProps {
  code: string;
  title?: string;
}

const CodeBlock = ({ code, title }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#1a1a2e] dark:bg-[#0d0d1a] rounded-lg overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <span className="text-sm text-white/70">{title}</span>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip open={copied}>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-white/50" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copied</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
      <pre className="p-4 text-sm overflow-x-auto">
        <code className="text-white/90 font-mono">{code}</code>
      </pre>
    </div>
  );
};

interface ContactsAPISectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactsAPISection({ isOpen, onClose }: ContactsAPISectionProps) {
  const [activeLanguage, setActiveLanguage] = useState<Language>("Python");
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const renderCodeSection = (title: string, examples: Record<Language, string>) => (
    <>
      <div className="flex items-center gap-2 mt-8 mb-3 first:mt-0">
        <h3 className="text-base font-medium">{title}</h3>
        <a href="#" className="text-muted-foreground hover:text-foreground">
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <div className="bg-[#1a1a2e] dark:bg-[#0d0d1a] rounded-lg overflow-hidden">
        <div className="flex items-center justify-end px-2 py-1 border-b border-white/10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => handleCopyCode(examples[activeLanguage])}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                >
                  <Copy className="w-4 h-4 text-white/50" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <pre className="p-4 text-sm overflow-x-auto max-h-[400px]">
          <code className="text-white/90 font-mono whitespace-pre">{examples[activeLanguage]}</code>
        </pre>
      </div>
    </>
  );

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-lg bg-background border-l border-border z-50 shadow-xl transition-transform duration-300 ease-out overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Contacts API Reference</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Language Tabs */}
          <div className="bg-[#1a1a2e] dark:bg-[#0d0d1a] rounded-lg overflow-hidden mb-6">
            <div className="flex items-center border-b border-white/10 overflow-x-auto">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLanguage(lang)}
                  className={cn(
                    "px-3 py-2 text-sm whitespace-nowrap transition-colors",
                    activeLanguage === lang
                      ? "text-white border-b-2 border-primary"
                      : "text-white/50 hover:text-white/70"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Create Contact */}
          {renderCodeSection("Create Contact", createContactExamples)}

          {/* Get Contact */}
          {renderCodeSection("Get Contact", getContactExamples)}

          {/* Update Contact */}
          {renderCodeSection("Update Contact", updateContactExamples)}

          {/* Delete Contact */}
          {renderCodeSection("Delete Contact", deleteContactExamples)}

          {/* List Contacts */}
          {renderCodeSection("List Contacts", listContactsExamples)}
        </div>
      </div>
    </>
  );
}
