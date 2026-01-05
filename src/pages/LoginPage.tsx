import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Zap, Shield, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

type GoogleCredentialResponse = {
  credential?: string;
  clientId?: string;
  select_by?: string;
  error?: string;
  error_description?: string;
};

type GooglePromptNotification = {
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  getSkippedReason: () => string;
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            ux_mode?: "popup" | "redirect";
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: GooglePromptNotification) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = "435311949966-8tqfu9fr1uubrm96fhgm6fge254ed6j1.apps.googleusercontent.com";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const handleGoogleCallback = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (response.error) {
        setIsGoogleLoading(false);
        toast.error(response.error_description || "Google authentication failed");
        return;
      }

      const credential = response.credential;

      if (!credential) {
        setIsGoogleLoading(false);
        toast.error("No authorization credential received from Google.");
        return;
      }

      try {
        const apiResponse = await fetch("https://internal-api.monosend.io/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential,
            id_token: credential,
          }),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to authenticate with Google");
        }

        const data = await apiResponse.json();
        setAuth(data.access_token, data.user);
        toast.success("Signed in with Google");
        navigate("/");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Google login failed");
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [navigate, setAuth]
  );

  const initializeGoogleClient = useCallback(() => {
    if (isGoogleReady || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCallback,
      ux_mode: "popup",
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    setIsGoogleReady(true);
  }, [handleGoogleCallback, isGoogleReady]);

  useEffect(() => {
    const scriptId = "google-identity-services";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existingScript) {
      if (window.google?.accounts?.id || existingScript.dataset.loaded === "true") {
        initializeGoogleClient();
      } else {
        existingScript.addEventListener("load", initializeGoogleClient);
      }

      return () => {
        existingScript.removeEventListener("load", initializeGoogleClient);
      };
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      initializeGoogleClient();
    };

    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [initializeGoogleClient]);

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("https://internal-api.monosend.io/v1.0/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send magic link");
      }
      
      toast.success("Magic link sent! Check your inbox.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send magic link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!window.google?.accounts?.id) {
      toast.error("Google authentication is not ready. Please try again.");
      return;
    }

    setIsGoogleLoading(true);
    window.google.accounts.id.prompt((notification) => {
      if (
        notification.isNotDisplayed() ||
        notification.isSkippedMoment() ||
        notification.isDismissedMoment()
      ) {
        setIsGoogleLoading(false);
        const reason =
          notification.getNotDisplayedReason?.() ||
          notification.getSkippedReason?.() ||
          notification.getDismissedReason?.() ||
          "Google authentication was cancelled. Please try again.";
        toast.error(reason);
      }
    });
  };

  const handleGithubLogin = () => {
    toast.info("GitHub authentication requires backend integration");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24 bg-background">
        <div className="w-full max-w-[350px] mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <img src="/favicon-48x48.png" alt="Logo" className="h-12" />
            <img src="/logo.png" alt="Logo" className="h-12" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-8">Log in</h1>
          {/* <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1> */}
          {/* <p className="text-muted-foreground mb-8">
            Sign in to your account to continue
          </p> */}

          {/* Google Login Button */}
          <Button
            variant="outline"
            className="w-full mb-3"
            onClick={handleGoogleLogin}
            disabled={!isGoogleReady || isGoogleLoading}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
          </Button>
          <Button
            variant="outline"
            className="w-full mb-6"
            onClick={handleGithubLogin}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.53.1.72-.23.72-.5v-1.74c-2.95.64-3.57-1.42-3.57-1.42-.48-1.22-1.17-1.55-1.17-1.55-.95-.64.07-.63.07-.63 1.05.07 1.6 1.07 1.6 1.07.93 1.6 2.45 1.14 3.05.87.09-.67.36-1.13.65-1.39-2.36-.27-4.85-1.18-4.85-5.25 0-1.16.42-2.1 1.1-2.84-.11-.27-.48-1.35.1-2.82 0 0 .9-.29 2.95 1.08a10.2 10.2 0 0 1 5.37 0c2.05-1.37 2.95-1.08 2.95-1.08.58 1.47.21 2.55.1 2.82.68.74 1.1 1.68 1.1 2.84 0 4.08-2.5 4.97-4.87 5.24.37.32.7.94.7 1.9v2.82c0 .27.18.6.73.5A10.5 10.5 0 0 0 12 1.5Z"
                clipRule="evenodd"
              />
            </svg>
            Continue with GitHub
          </Button>

          <div className="relative mb-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              OR
            </span>
          </div>

          {/* Magic Link Form */}
          <form onSubmit={handleMagicLinkLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className=""
              />
            </div>
            <Button
              type="submit"
              className="w-full "
              disabled={isLoading}
            >
              {isLoading ? (
                "Sending magic link..."
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send magic link
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Right Section - Infographic */}
      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-12">
        <div className="max-w-lg">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            The best way to reach humans instead of spam folders
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Lightning fast delivery</h3>
                <p className="text-muted-foreground text-sm">
                  Send transactional emails in milliseconds with our globally distributed infrastructure.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Enterprise-grade security</h3>
                <p className="text-muted-foreground text-sm">
                  SOC 2 compliant with end-to-end encryption and advanced threat protection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Global reach</h3>
                <p className="text-muted-foreground text-sm">
                  Deliver emails to any inbox worldwide with our optimized routing system.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-muted border-2 border-background"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Trusted by <span className="font-semibold text-foreground">50,000+</span> developers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
