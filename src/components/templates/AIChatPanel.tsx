import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Trash2, Sparkles, Plus, ArrowUp } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { ChatMessage } from "./ChatMessage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AIChatPanelProps {
  onCodeGenerated?: (code: string) => void;
  currentCode?: string;
}

const SUGGESTED_PROMPTS = [
  "Create a welcome email template with a header and CTA button",
  "Design a password reset email with a verification link",
  "Build a promotional email with product showcase",
  "Generate a newsletter template with multiple sections",
];

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  onCodeGenerated,
  currentCode = "",
}) => {
  const { messages, isLoading, addMessage, clearMessages, setIsLoading } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    addMessage("user", userMessage);
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call to your AI service
      // For now, this is a mock implementation
      await simulateAIResponse(userMessage, currentCode);
    } catch (error) {
      addMessage(
        "assistant",
        "I apologize, but I encountered an error. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Mock AI response - Replace this with actual API integration
  const simulateAIResponse = async (userMessage: string, existingCode: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let responseText = "";
    let generatedCode = "";

    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("welcome") || lowerMessage.includes("greeting")) {
      responseText =
        "I've created a welcome email template with a clean header, personalized greeting, and a prominent call-to-action button. The design uses a modern color scheme and is fully mobile-responsive with optimized spacing and touch-friendly buttons.";
      generatedCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome Email</title>
  <style type="text/css">
    /* Reset styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
    }

    /* Mobile-specific styles */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }

      .mobile-padding {
        padding: 20px !important;
      }

      .mobile-header-padding {
        padding: 30px 20px !important;
      }

      .mobile-font-size-h1 {
        font-size: 24px !important;
        line-height: 1.3 !important;
      }

      .mobile-font-size-p {
        font-size: 16px !important;
      }

      .mobile-button {
        padding: 14px 30px !important;
        font-size: 16px !important;
        min-height: 48px !important;
        display: block !important;
        width: auto !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <!--[if mso]>
        <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
        <td>
        <![endif]-->
        <table class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td class="mobile-header-padding" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 class="mobile-font-size-h1" style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; line-height: 1.2;">Welcome to {{companyName}}!</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px;">
              <p class="mobile-font-size-p" style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi {{firstName}},
              </p>
              <p class="mobile-font-size-p" style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We're thrilled to have you on board! Your account has been successfully created, and you're all set to explore everything we have to offer.
              </p>
              <p class="mobile-font-size-p" style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                To get started, click the button below to verify your email address and complete your setup.
              </p>
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{verificationLink}}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="10%" stroke="f" fillcolor="#667eea">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Verify Email Address</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="{{verificationLink}}" class="mobile-button" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: bold; font-size: 16px; min-height: 48px; line-height: 1.5; text-align: center; mso-hide: all;">
                      Verify Email Address
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                If you have any questions, feel free to reach out to us at <a href="mailto:{{supportEmail}}" style="color: #667eea; text-decoration: none;">{{supportEmail}}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="color: #999999; font-size: 12px; margin: 0; line-height: 1.5;">
                &copy; 2024 {{companyName}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
    } else if (
      lowerMessage.includes("password") ||
      lowerMessage.includes("reset")
    ) {
      responseText =
        "I've created a password reset email template with clear instructions and a secure verification link. The design is straightforward, focuses on the action the user needs to take, and is fully optimized for mobile devices.";
      generatedCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style type="text/css">
    /* Reset styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
    }

    /* Mobile-specific styles */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }

      .mobile-padding {
        padding: 20px !important;
      }

      .mobile-font-size-h1 {
        font-size: 22px !important;
        line-height: 1.3 !important;
      }

      .mobile-font-size-p {
        font-size: 16px !important;
      }

      .mobile-button {
        padding: 14px 30px !important;
        font-size: 16px !important;
        min-height: 48px !important;
        display: block !important;
        width: auto !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <!--[if mso]>
        <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
        <td>
        <![endif]-->
        <table class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td class="mobile-padding" style="padding: 40px;">
              <h1 class="mobile-font-size-h1" style="color: #333333; margin: 0 0 20px 0; font-size: 24px; font-weight: bold; line-height: 1.3;">Password Reset Request</h1>
              <p class="mobile-font-size-p" style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi {{firstName}},
              </p>
              <p class="mobile-font-size-p" style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{resetPasswordLink}}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="10%" stroke="f" fillcolor="#4f46e5">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Reset Password</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="{{resetPasswordLink}}" class="mobile-button" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; min-height: 48px; line-height: 1.5; text-align: center; mso-hide: all;">
                      Reset Password
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                This link will expire in 24 hours for security reasons.
              </p>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
    } else if (
      lowerMessage.includes("promotional") ||
      lowerMessage.includes("product")
    ) {
      responseText =
        "I've designed a promotional email template with an eye-catching header, product showcase section, and a strong call-to-action. Perfect for marketing campaigns! Fully optimized for mobile devices with responsive design and touch-friendly elements.";
      generatedCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Offer</title>
  <style type="text/css">
    /* Reset styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
    }

    /* Mobile-specific styles */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }

      .mobile-padding {
        padding: 20px !important;
      }

      .mobile-header-padding {
        padding: 25px 20px !important;
      }

      .mobile-font-size-h1 {
        font-size: 28px !important;
        line-height: 1.2 !important;
      }

      .mobile-font-size-h2 {
        font-size: 20px !important;
        line-height: 1.3 !important;
      }

      .mobile-font-size-p {
        font-size: 16px !important;
      }

      .mobile-button {
        padding: 14px 30px !important;
        font-size: 16px !important;
        min-height: 48px !important;
        display: block !important;
        width: auto !important;
      }

      .mobile-showcase-padding {
        padding: 15px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <!--[if mso]>
        <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
        <td>
        <![endif]-->
        <table class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td class="mobile-header-padding" style="background-color: #ff6b6b; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 class="mobile-font-size-h1" style="color: #ffffff; margin: 0; font-size: 36px; font-weight: bold; line-height: 1.2;">Special Offer!</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px; line-height: 1.4;">Limited Time Only</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px;">
              <p class="mobile-font-size-p" style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi {{firstName}},
              </p>
              <p class="mobile-font-size-p" style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Don't miss out on our exclusive offer! Get 30% off on all products for the next 48 hours.
              </p>
              <!-- Product Showcase -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 30px 0;">
                <tr>
                  <td class="mobile-showcase-padding" align="center" style="padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                    <h2 class="mobile-font-size-h2" style="color: #333333; margin: 0 0 10px 0; font-size: 24px; font-weight: bold; line-height: 1.3;">Featured Products</h2>
                    <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.5;">Handpicked just for you</p>
                  </td>
                </tr>
              </table>
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{websiteUrl}}" style="height:48px;v-text-anchor:middle;width:180px;" arcsize="10%" stroke="f" fillcolor="#ff6b6b">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Shop Now</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="{{websiteUrl}}" class="mobile-button" style="display: inline-block; background-color: #ff6b6b; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: bold; font-size: 16px; min-height: 48px; line-height: 1.5; text-align: center; mso-hide: all;">
                      Shop Now
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="color: #999999; font-size: 12px; margin: 0; line-height: 1.5;">
                <a href="{{unsubscribeLink}}" style="color: #999999; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
    } else if (existingCode) {
      responseText =
        "I can help you modify the existing template. Please be more specific about what changes you'd like to make (e.g., change colors, add sections, update text, etc.)";
    } else {
      responseText =
        "I can help you create or modify email templates! Try asking me to create a welcome email, password reset, promotional campaign, or newsletter template.";
    }

    addMessage("assistant", responseText, generatedCode);

    // If code was generated, pass it to the parent component
    if (generatedCode && onCodeGenerated) {
      onCodeGenerated(generatedCode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-background border-b border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 h-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Email Assistant</h3>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Start Building Your Email
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Describe the email template you want to create, and I'll generate
              the HTML code for you.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-md">
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="text-left px-4 py-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-colors text-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                codeGenerated={message.codeGenerated}
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Generating...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-muted/30 p-4">
        <div className="bg-background rounded-2xl border border-border shadow-sm">
          {/* Textarea */}
          <div className="px-4 pt-4 pb-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="How can I help you today?"
              className={cn(
                "w-full resize-none bg-transparent text-sm",
                "focus-visible:outline-none",
                "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
                "min-h-[24px] max-h-[120px]"
              )}
              rows={1}
              disabled={isLoading}
            />
          </div>
          {/* Bottom row with plus and send buttons */}
          <div className="flex items-center justify-between px-3 pb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              <Plus className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-9 w-9 rounded-lg bg-primary/80 hover:bg-primary text-primary-foreground"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
