import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type Language = "Python" | "Node.js" | "Java" | ".NET" | "PHP" | "Ruby" | "Go" | "Rust";

const sendEmailExamples: Record<Language, string> = {
  "Node.js": `import { MonoSend } from 'monosend';

const monosend = new MonoSend('mono_xxxxxxxxx');

monosend.emails.send({
  from: 'Brand <welcome@monosend.io>',
  to: ['customer@gmail.com'],
  subject: 'Welcome to MonoSend!',
  html: '<p>it works!</p>',
  reply_to: 'support@monosend.io'
});`,
  "PHP": `$monosend = MonoSend::client('mono_xxxxxxxxx');

$monosend->emails->send([
  'from' => 'Brand <welcome@monosend.io>',
  'to' => ['customer@gmail.com'],
  'subject' => 'Welcome to MonoSend!',
  'html' => '<p>it works!</p>',
  'reply_to' => 'support@monosend.io'
]);`,
  "Python": `import monosend

monosend.api_key = "mono_xxxxxxxxx"

monosend.Emails.send({
  "from": "Brand <welcome@monosend.io>",
  "to": ["customer@gmail.com"],
  "subject": "Welcome to MonoSend!",
  "html": "<p>it works!</p>",
  "reply_to": "support@monosend.io"
})`,
  "Ruby": `require 'monosend'

MonoSend.api_key = 'mono_xxxxxxxxx'

MonoSend::Emails.send({
  from: 'Brand <welcome@monosend.io>',
  to: ['customer@gmail.com'],
  subject: 'Welcome to MonoSend!',
  html: '<p>it works!</p>',
  reply_to: 'support@monosend.io'
})`,
  "Go": `package main

import "github.com/monosend/monosend-go/v2"

func main() {
  client := monosend.NewClient("mono_xxxxxxxxx")
  
  params := &monosend.SendEmailRequest{
    From:    "Brand <welcome@monosend.io>",
    To:      []string{"customer@gmail.com"},
    Subject: "Welcome to MonoSend!",
    Html:    "<p>it works!</p>",
    ReplyTo: "support@monosend.io",
  }
  client.Emails.Send(params)
}`,
  "Rust": `use monosend_rs::{MonoSend, CreateEmailOptions};

#[tokio::main]
async fn main() {
  let monosend = MonoSend::new("mono_xxxxxxxxx");
  
  let email = CreateEmailOptions::new(
    "Brand <welcome@monosend.io>",
    ["customer@gmail.com"],
    "Welcome to MonoSend!",
  ).with_html("<p>it works!</p>");
  
  monosend.emails.send(email).await;
}`,
  "Java": `import com.monosend.*;

public class Main {
  public static void main(String[] args) {
    MonoSend monosend = new MonoSend("mono_xxxxxxxxx");
    
    SendEmailRequest request = SendEmailRequest.builder()
      .from("Brand <welcome@monosend.io>")
      .to("customer@gmail.com")
      .subject("Welcome to MonoSend!")
      .html("<p>it works!</p>")
      .replyTo("support@monosend.io")
      .build();
      
    monosend.emails().send(request);
  }
}`,
  ".NET": `using MonoSend;

var client = new MonoSendClient("mono_xxxxxxxxx");

await client.EmailSendAsync(new EmailMessage {
  From = "Brand <welcome@monosend.io>",
  To = "customer@gmail.com",
  Subject = "Welcome to MonoSend!",
  HtmlBody = "<p>it works!</p>",
  ReplyTo = "support@monosend.io"
});`
};

const batchEmailExamples: Record<Language, string> = {
  "Node.js": `import { MonoSend } from 'monosend';

const monosend = new MonoSend('mono_xxxxxxxxx');

await monosend.batch.send([
  {
    from: 'Brand <welcome@monosend.io>',
    to: ['customer1@gmail.com'],
    subject: 'Welcome to MonoSend!',
    html: '<p>it works!</p>',
  },
  {
    from: 'Brand <welcome@monosend.io>',
    to: ['customer2@gmail.com'],
    subject: 'Welcome to MonoSend!',
    html: '<p>it works!</p>',
  },
]);`,
  "PHP": `$monosend = MonoSend::client('mono_xxxxxxxxx');

$monosend->batch->send([
  [
    'from' => 'Brand <welcome@monosend.io>',
    'to' => ['customer1@gmail.com'],
    'subject' => 'Welcome to MonoSend!',
    'html' => '<p>it works!</p>',
  ],
  [
    'from' => 'Brand <welcome@monosend.io>',
    'to' => ['customer2@gmail.com'],
    'subject' => 'Welcome to MonoSend!',
    'html' => '<p>it works!</p>',
  ],
]);`,
  "Python": `import monosend

monosend.api_key = "mono_xxxxxxxxx"

monosend.Batch.send([
  {
    "from": "Brand <welcome@monosend.io>",
    "to": ["customer1@gmail.com"],
    "subject": "Welcome to MonoSend!",
    "html": "<p>it works!</p>",
  },
  {
    "from": "Brand <welcome@monosend.io>",
    "to": ["customer2@gmail.com"],
    "subject": "Welcome to MonoSend!",
    "html": "<p>it works!</p>",
  },
])`,
  "Ruby": `require 'monosend'

MonoSend.api_key = 'mono_xxxxxxxxx'

MonoSend::Batch.send([
  {
    from: 'Brand <welcome@monosend.io>',
    to: ['customer1@gmail.com'],
    subject: 'Welcome to MonoSend!',
    html: '<p>it works!</p>',
  },
  {
    from: 'Brand <welcome@monosend.io>',
    to: ['customer2@gmail.com'],
    subject: 'Welcome to MonoSend!',
    html: '<p>it works!</p>',
  },
])`,
  "Go": `package main

import "github.com/monosend/monosend-go/v2"

func main() {
  client := monosend.NewClient("mono_xxxxxxxxx")
  
  emails := []*monosend.SendEmailRequest{
    {
      From:    "Brand <welcome@monosend.io>",
      To:      []string{"customer1@gmail.com"},
      Subject: "Welcome to MonoSend!",
      Html:    "<p>it works!</p>",
    },
    {
      From:    "Brand <welcome@monosend.io>",
      To:      []string{"customer2@gmail.com"},
      Subject: "Welcome to MonoSend!",
      Html:    "<p>it works!</p>",
    },
  }
  client.Batch.Send(emails)
}`,
  "Rust": `use monosend_rs::{MonoSend, CreateEmailOptions};

#[tokio::main]
async fn main() {
  let monosend = MonoSend::new("mono_xxxxxxxxx");
  
  let emails = vec![
    CreateEmailOptions::new(
      "Brand <welcome@monosend.io>",
      ["customer1@gmail.com"],
      "Welcome to MonoSend!",
    ).with_html("<p>it works!</p>"),
    CreateEmailOptions::new(
      "Brand <welcome@monosend.io>",
      ["customer2@gmail.com"],
      "Welcome to MonoSend!",
    ).with_html("<p>it works!</p>"),
  ];
  
  monosend.batch.send(emails).await;
}`,
  "Java": `import com.monosend.*;
import java.util.List;

public class Main {
  public static void main(String[] args) {
    MonoSend monosend = new MonoSend("mono_xxxxxxxxx");
    
    List<SendEmailRequest> emails = List.of(
      SendEmailRequest.builder()
        .from("Brand <welcome@monosend.io>")
        .to("customer1@gmail.com")
        .subject("Welcome to MonoSend!")
        .html("<p>it works!</p>")
        .build(),
      SendEmailRequest.builder()
        .from("Brand <welcome@monosend.io>")
        .to("customer2@gmail.com")
        .subject("Welcome to MonoSend!")
        .html("<p>it works!</p>")
        .build()
    );
      
    monosend.batch().send(emails);
  }
}`,
  ".NET": `using MonoSend;

var client = new MonoSendClient("mono_xxxxxxxxx");

var emails = new[] {
  new EmailMessage {
    From = "Brand <welcome@monosend.io>",
    To = "customer1@gmail.com",
    Subject = "Welcome to MonoSend!",
    HtmlBody = "<p>it works!</p>",
  },
  new EmailMessage {
    From = "Brand <welcome@monosend.io>",
    To = "customer2@gmail.com",
    Subject = "Welcome to MonoSend!",
    HtmlBody = "<p>it works!</p>",
  },
};

await client.BatchSendAsync(emails);`
};

const languages: Language[] = ["Python", "Node.js", "Java", ".NET", "PHP", "Ruby", "Go", "Rust"];

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

interface APISectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function APISection({ isOpen, onClose }: APISectionProps) {
  const [activeLanguage, setActiveLanguage] = useState<Language>("Node.js");
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

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
            <h2 className="text-xl font-semibold">API Reference</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Language Tabs - Sticky */}
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

          {/* Send Email Section */}
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-medium">Send Email</h3>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Send Email Code Block */}
          <div className="bg-[#1a1a2e] dark:bg-[#0d0d1a] rounded-lg overflow-hidden">
            <div className="flex items-center justify-end px-2 py-1 border-b border-white/10">
              <TooltipProvider>
                <Tooltip open={codeCopied}>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => handleCopyCode(sendEmailExamples[activeLanguage])}
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
            <pre className="p-4 text-sm overflow-x-auto max-h-[400px]">
              <code className="text-white/90 font-mono whitespace-pre">{sendEmailExamples[activeLanguage]}</code>
            </pre>
          </div>

          {/* Response */}
          <div className="mt-4">
            <CodeBlock 
              title="Response" 
              code={`{
  "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794"
}`}
            />
          </div>

          {/* Send Batch Emails Section */}
          <div className="flex items-center gap-2 mt-8 mb-3">
            <h3 className="text-base font-medium">Send Batch Emails</h3>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Batch Email Code Block */}
          <div className="bg-[#1a1a2e] dark:bg-[#0d0d1a] rounded-lg overflow-hidden">
            <div className="flex items-center justify-end px-2 py-1 border-b border-white/10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => handleCopyCode(batchEmailExamples[activeLanguage])}
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
              <code className="text-white/90 font-mono whitespace-pre">{batchEmailExamples[activeLanguage]}</code>
            </pre>
          </div>

          {/* Batch Response */}
          <div className="mt-4">
            <CodeBlock 
              title="Response" 
              code={`[
  {
    "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794"
  },
  {
    "id": "58a3999c-1cr0-3ef3-1bf8-afcd6dc2e323"
  }
]`}
            />
          </div>
        </div>
      </div>
    </>
  );
}
