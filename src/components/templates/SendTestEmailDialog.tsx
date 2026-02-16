import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SendTestEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  domainId?: string | null;
  subject: string;
  body: string;
}

export function SendTestEmailDialog({
  open,
  onOpenChange,
  templateId,
  domainId,
  subject,
  body,
}: SendTestEmailDialogProps) {
  const [activeTab, setActiveTab] = useState<"emails" | "variables">("emails");
  const [emails, setEmails] = useState("");
  const [variablesJson, setVariablesJson] = useState("");
  const [isSending, setIsSending] = useState(false);

  const parseEmails = (input: string): string[] =>
    input
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

  const isValidEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const safeParseJson = (
    text: string
  ): { ok: true; value: unknown } | { ok: false } => {
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch {
      return { ok: false };
    }
  };

  // Extract variables from template body
  const extractVariables = (content: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.add(match[1]);
    }
    return Array.from(matches);
  };

  const variables = extractVariables(body + subject);

  const emailList = useMemo(() => parseEmails(emails), [emails]);
  const invalidEmails = useMemo(
    () => emailList.filter((email) => !isValidEmail(email)),
    [emailList]
  );
  const hasTooManyEmails = emailList.length > 10;

  const parsedVariablesResult = useMemo(() => {
    if (!variablesJson.trim()) {
      return { ok: true as const, value: {} as unknown };
    }
    return safeParseJson(variablesJson);
  }, [variablesJson]);

  const variablesObject = useMemo(() => {
    if (!parsedVariablesResult.ok) return null;
    const parsed = parsedVariablesResult.value;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
    return null;
  }, [parsedVariablesResult]);

  const missingVariables = useMemo(() => {
    if (variables.length === 0) return [] as string[];
    if (!variablesObject) return variables;

    return variables.filter((variable) => {
      if (!(variable in variablesObject)) return true;
      const value = variablesObject[variable];
      if (value == null) return true;
      if (typeof value === "string" && value.trim() === "") return true;
      return false;
    });
  }, [variables, variablesObject]);

  const isEmailValidForSend =
    emailList.length > 0 && !hasTooManyEmails && invalidEmails.length === 0;
  const isVariablesValidForSend =
    parsedVariablesResult.ok && variablesObject !== null && missingVariables.length === 0;
  const isSendDisabled = isSending || !isEmailValidForSend || !isVariablesValidForSend;

  useEffect(() => {
    if (open && variables.length > 0) {
      const initialVars: Record<string, string> = {};
      variables.forEach((v) => {
        initialVars[v] = "value";
      });
      setVariablesJson(JSON.stringify(initialVars, null, 2));
    }
  }, [open, body, subject]);

  const handleSendTest = async () => {
    if (emailList.length === 0) {
      toast.error("Please add at least one email address");
      return;
    }

    if (emailList.length > 10) {
      toast.error("Maximum 10 email addresses allowed");
      return;
    }

    if (invalidEmails.length > 0) {
      toast.error("Please enter valid email address(es)");
      setActiveTab("emails");
      return;
    }

    if (!parsedVariablesResult.ok) {
      toast.error("Invalid JSON in variables");
      setActiveTab("variables");
      return;
    }

    if (!variablesObject) {
      toast.error("Variables must be a JSON object");
      setActiveTab("variables");
      return;
    }

    if (missingVariables.length > 0) {
      toast.error("Please provide values for all template variables");
      setActiveTab("variables");
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        emails: emailList,
        variables: variablesObject as Record<string, unknown>,
        ...(domainId ? { domain_id: domainId } : {}),
      };
      const response = await api(`/templates/${templateId}/test`, {
        method: "POST",
        body: payload,
      });

      if (response.ok) {
        toast.success("Test email sent", {
          description: `Sent to ${emailList.length} recipient(s)`,
        });
        onOpenChange(false);
        setEmails("");
      } else {
        const error = await response.json();
        toast.error("Failed to send test email", {
          description: error.detail,
        });
      }
    } catch (error) {
      toast.error("Failed to send test email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-normal">
            Send Test Email
          </DialogTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Send a test email to see if your email template looks good in your
            inbox.
          </p>
        </DialogHeader>

        <div className="py-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "emails" | "variables")}
          >
            <TabsList className="grid w-fit grid-cols-2 mb-4">
              <TabsTrigger value="emails" className="uppercase text-xs px-4">
                Add Emails
              </TabsTrigger>
              <TabsTrigger value="variables" className="uppercase text-xs px-4 gap-2">
                Variables
                {variables.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {variables.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="emails" className="space-y-2">
              <Textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="email@example.com"
                className="min-h-[140px] resize-none"
              />
              {invalidEmails.length > 0 && (
                <p className="text-sm text-destructive">
                  {invalidEmails.length} invalid email(s). First: {invalidEmails[0]}
                </p>
              )}
              {hasTooManyEmails && (
                <p className="text-sm text-destructive">
                  Maximum 10 email addresses allowed.
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                You can add up to 10 email IDs separated by comma (,).
              </p>
            </TabsContent>

            <TabsContent value="variables" className="space-y-2">
              <p className="text-sm text-muted-foreground mb-2">
                Values added here will replace the variables in your test email.
              </p>
              <div className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm">
                <Textarea
                  value={variablesJson}
                  onChange={(e) => setVariablesJson(e.target.value)}
                  className="min-h-[120px] resize-none bg-transparent border-none p-0 focus-visible:ring-0 font-mono"
                  spellCheck={false}
                />
              </div>
              {!parsedVariablesResult.ok && (
                <p className="text-sm text-destructive">
                  Invalid JSON format.
                </p>
              )}
              {parsedVariablesResult.ok && variablesObject === null && (
                <p className="text-sm text-destructive">
                  Variables must be a JSON object.
                </p>
              )}
              {missingVariables.length > 0 && variablesObject !== null && (
                <p className="text-sm text-destructive">
                  Missing required variables: {missingVariables.join(", ")}
                </p>
              )}
              <a
                href="#"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                Learn more about variables
                <ExternalLink className="h-3 w-3" />
              </a>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="bg-muted/30 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSendTest}
            disabled={isSendDisabled}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Test"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
