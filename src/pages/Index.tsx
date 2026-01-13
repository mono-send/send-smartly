import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/ui/code-block";
import { Key, Send, Globe, FlaskConical, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";

const languages = ["Node.js", "PHP", "Python", "Ruby", "Go", "Rust", "Elixir", "Java", ".NET", "cURL"] as const;
type Language = typeof languages[number];

const sendEmailExamples: Record<Language, string> = {
  "Node.js": `import { MonoSend } from 'monosend';

const monosend = new MonoSend('mono_xxxxxxxxx');

monosend.emails.send({
  from: 'onboarding@monosend.dev',
  to: 'hi@example.co',
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
});`,
  "PHP": `<?php
require 'vendor/autoload.php';

$monosend = new MonoSend('mono_xxxxxxxxx');

$monosend->emails->send([
  'from' => 'onboarding@monosend.dev',
  'to' => 'hi@example.co',
  'subject' => 'Hello World',
  'html' => '<p>Congrats on sending your <strong>first email</strong>!</p>'
]);`,
  "Python": `import monosend

monosend.api_key = "mono_xxxxxxxxx"

monosend.Emails.send({
  "from": "onboarding@monosend.dev",
  "to": "hi@example.co",
  "subject": "Hello World",
  "html": "<p>Congrats on sending your <strong>first email</strong>!</p>"
})`,
  "Ruby": `require 'monosend'

monosend = MonoSend.new('mono_xxxxxxxxx')

monosend.emails.send({
  from: 'onboarding@monosend.dev',
  to: 'hi@example.co',
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
})`,
  "Go": `package main

import "github.com/monosend/monosend-go"

func main() {
  client := monosend.NewClient("mono_xxxxxxxxx")
  
  client.Emails.Send(&monosend.SendEmailRequest{
    From:    "onboarding@monosend.dev",
    To:      "hi@example.co",
    Subject: "Hello World",
    Html:    "<p>Congrats on sending your <strong>first email</strong>!</p>",
  })
}`,
  "Rust": `use monosend::MonoSend;

#[tokio::main]
async fn main() {
  let client = MonoSend::new("mono_xxxxxxxxx");
  
  client.emails().send(SendEmailRequest {
    from: "onboarding@monosend.dev",
    to: "hi@example.co",
    subject: "Hello World",
    html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
  }).await;
}`,
  "Elixir": `{:ok, _} = MonoSend.Emails.send(%{
  from: "onboarding@monosend.dev",
  to: "hi@example.co",
  subject: "Hello World",
  html: "<p>Congrats on sending your <strong>first email</strong>!</p>"
}, api_key: "mono_xxxxxxxxx")`,
  "Java": `import com.monosend.MonoSend;

MonoSend client = new MonoSend("mono_xxxxxxxxx");

client.emails().send(SendEmailRequest.builder()
  .from("onboarding@monosend.dev")
  .to("hi@example.co")
  .subject("Hello World")
  .html("<p>Congrats on sending your <strong>first email</strong>!</p>")
  .build());`,
  ".NET": `using MonoSend;

var client = new MonoSendClient("mono_xxxxxxxxx");

await client.Emails.SendAsync(new SendEmailRequest {
  From = "onboarding@monosend.dev",
  To = "hi@example.co",
  Subject = "Hello World",
  Html = "<p>Congrats on sending your <strong>first email</strong>!</p>"
});`,
  "cURL": `curl -X POST 'https://api.monosend.com/emails' \\
  -H 'Authorization: Bearer mono_xxxxxxxxx' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "from": "onboarding@monosend.dev",
    "to": "hi@example.co",
    "subject": "Hello World",
    "html": "<p>Congrats on sending your <strong>first email</strong>!</p>"
  }'`
};

interface OnboardingData {
  plan: string | null;
  is_api_key: boolean;
  domain: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [activeLanguage, setActiveLanguage] = useState<Language>("Node.js");
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);

  useEffect(() => {
    fetchOnboardingData();
  }, []);

  const fetchOnboardingData = async () => {
    try {
      setIsLoadingOnboarding(true);
      const response = await api("/onboarding");
      if (response.ok) {
        const data = await response.json();
        setOnboardingData(data);
      }
    } catch (error) {
      console.error("Failed to fetch onboarding data:", error);
    } finally {
      setIsLoadingOnboarding(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  };

  const handleSendEmail = () => {
    toast.success("Email sent successfully!");
  };

  const handleAddApiKey = async () => {
    try {
      const response = await api("/api_keys", {
        method: "POST",
        body: {
          name: "Onboarding",
          permission: "sending_access",
          domain: null
        }
      });
      if (response.ok) {
        toast.success("API Key created successfully!");
        // Refresh onboarding data to update the UI
        fetchOnboardingData();
      } else {
        toast.error("Failed to create API Key");
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
      toast.error("Failed to create API Key");
    }
  };

  const isSectionsDisabled = onboardingData?.is_api_key === false;

  return (
    <>
      {/* <TopBar title="Get Started" subtitle="Follow the steps to send your first email" /> */}
      <TopBar title="Get Started" subtitle="" />
      
      <div className="p-6 max-w-4xl">
        <h1 className="text-xl font-semibold text-foreground mb-2">Hey Cooper, let's get started</h1>
        <p className="text-muted-foreground mb-8">Follow these steps to set up your project and start sending emails with the MonoSend API.</p>

        {/* Steps */}
        <div className="space-y-8">
          {/* Step 1: Add API Key */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-foreground">
                <div className="h-2 w-2 rounded-full bg-foreground" />
              </div>
              <div className="flex-1 w-px bg-border mt-2" />
            </div>
            <div className="flex-1 pb-8">
              <h2 className="text-lg font-semibold text-foreground mb-1">Add an API Key</h2>
              <p className="text-muted-foreground text-sm mb-4">Use the following generated key to authenticate requests</p>
              <Button
                className="gap-2 h-9"
                onClick={handleAddApiKey}
              >
                <Key className="h-4 w-4" />
                Add API Key
              </Button>
            </div>
          </div>

          {/* Step 2: Send Email */}
          <div className={`flex gap-4 ${isSectionsDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex flex-col items-center">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-foreground">
                <div className="h-2 w-2 rounded-full bg-foreground" />
              </div>
              <div className="flex-1 w-px bg-border mt-2" />
            </div>
            <div className="flex-1 pb-8">
              <h2 className="text-lg font-semibold text-foreground mb-1">Send an email</h2>
              <p className="text-muted-foreground text-sm mb-4">Implement or run the code below to send your first email</p>
              
              <Card className="overflow-hidden">
                <div className="border-b border-border bg-muted/30 px-4 pt-2 pb-0 flex items-center justify-between">
                  <Tabs value={activeLanguage} onValueChange={(v) => setActiveLanguage(v as Language)}>
                    <TabsList className="h-auto bg-transparent p-0 gap-0">
                      {languages.map((lang) => (
                        <TabsTrigger
                          key={lang}
                          value={lang}
                          className="rounded-none border-b-2 border-transparent px-3 py-2 text-sm data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                          {lang}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopyCode(sendEmailExamples[activeLanguage])}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </Button>
                </div>
                <CardContent className="p-0">
                  <CodeBlock 
                    code={sendEmailExamples[activeLanguage]} 
                    className="rounded-none" 
                    showHeader={false} 
                  />
                </CardContent>
                <div className="border-t border-border p-4">
                  <Button 
                    className="gap-2"
                    onClick={handleSendEmail}
                  >
                    <Send className="h-4 w-4" />
                    Send email
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Step 3: Add Domain */}
          <div className={`flex gap-4 ${isSectionsDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex flex-col items-center">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-foreground">
                <div className="h-2 w-2 rounded-full bg-foreground" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-foreground">Add a domain</h2>
                <Badge variant="secondary">Recommended</Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-4">Improve deliverability by proving to inbox providers that you own the domain you're sending from.</p>
              <Button
                className="gap-2 h-9"
                onClick={() => navigate("/domains/new")}
                disabled={isSectionsDisabled}
              >
                <Globe className="h-4 w-4" />
                Add domain
              </Button>
            </div>
          </div>
        </div>

        {/* Explore More */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">Explore more</h2>
          <p className="text-muted-foreground text-sm mb-6">Continue unlocking MonoSend's full capabilities and setup</p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col">
              <CardContent className="flex-1 p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-foreground">Test emails</h3>
                  <FlaskConical className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">Simulate different events without damaging your domain reputation.</p>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => navigate("/emails")}
                >
                  Learn more
                </Button>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardContent className="flex-1 p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-foreground">Deliverability Tips</h3>
                  <Navigation className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">Avoiding the spam folder and reaching the inbox.</p>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => navigate("/settings")}
                >
                  Learn more
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
