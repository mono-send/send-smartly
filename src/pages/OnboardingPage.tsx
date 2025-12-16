import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy, Eye, EyeOff, Globe, TestTube, Lightbulb, ArrowRight, Send } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const codeExamples: Record<string, string> = {
  nodejs: `import { MonoSend } from 'monosend';

const monosend = new MonoSend('ms_live_xxxxx');

await monosend.emails.send({
  from: 'hello@example.com',
  to: 'user@email.com',
  subject: 'Hello from MonoSend',
  html: '<p>Welcome to MonoSend!</p>'
});`,
  python: `from monosend import MonoSend

client = MonoSend(api_key="ms_live_xxxxx")

client.emails.send(
    from_email="hello@example.com",
    to="user@email.com",
    subject="Hello from MonoSend",
    html="<p>Welcome to MonoSend!</p>"
)`,
  curl: `curl -X POST 'https://api.monosend.co/emails' \\
  -H 'Authorization: Bearer ms_live_xxxxx' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "from": "hello@example.com",
    "to": "user@email.com",
    "subject": "Hello from MonoSend",
    "html": "<p>Welcome to MonoSend!</p>"
  }'`,
  go: `package main

import "github.com/monosend/monosend-go"

func main() {
    client := monosend.NewClient("ms_live_xxxxx")
    
    _, err := client.Emails.Send(&monosend.SendEmailRequest{
        From:    "hello@example.com",
        To:      []string{"user@email.com"},
        Subject: "Hello from MonoSend",
        Html:    "<p>Welcome to MonoSend!</p>",
    })
}`,
  php: `<?php

use MonoSend\\MonoSend;

$monosend = new MonoSend('ms_live_xxxxx');

$monosend->emails->send([
    'from' => 'hello@example.com',
    'to' => 'user@email.com',
    'subject' => 'Hello from MonoSend',
    'html' => '<p>Welcome to MonoSend!</p>'
]);`,
};

export default function OnboardingPage() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const apiKey = "ms_live_a1b2c3d4e5f6g7h8i9j0";

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <TopBar title="Get Started" subtitle="Send your first email in minutes" />
      
      <div className="mx-auto max-w-4xl p-6 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
            <Send className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Send your first email</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Get started with MonoSend in just two steps. Add your API key and send a test email.
          </p>
        </div>

        {/* Step 1: API Key */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </div>
              <div>
                <CardTitle className="text-lg">Add your API key</CardTitle>
                <CardDescription>Use this key to authenticate your requests</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    readOnly
                    className="pr-20 font-mono"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button variant="outline" onClick={handleCopyKey}>
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
              <Check className="h-4 w-4" />
              API key ready to use
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Send Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </div>
              <div>
                <CardTitle className="text-lg">Send an email</CardTitle>
                <CardDescription>Choose your language and send a test email</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="nodejs">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="go">Go</TabsTrigger>
                <TabsTrigger value="php">PHP</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>
              {Object.entries(codeExamples).map(([lang, code]) => (
                <TabsContent key={lang} value={lang} className="mt-4">
                  <CodeBlock code={code} language={lang} showLineNumbers />
                </TabsContent>
              ))}
            </Tabs>
            <Button className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Send test email
            </Button>
          </CardContent>
        </Card>

        {/* Explore More */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <Globe className="h-5 w-5 text-info" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Add a domain</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure your sending domain for better deliverability
                  </p>
                  <Button variant="link" className="px-0 mt-2">
                    Get started <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <TestTube className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Test emails</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Preview and test your emails before sending
                  </p>
                  <Button variant="link" className="px-0 mt-2">
                    Learn more <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Lightbulb className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Deliverability tips</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Best practices to maximize email delivery
                  </p>
                  <Button variant="link" className="px-0 mt-2">
                    Read guide <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
