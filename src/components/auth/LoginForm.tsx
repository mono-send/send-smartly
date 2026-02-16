import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GitHubAuthButton } from "./GitHubAuthButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail } from "lucide-react";
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
                        login_uri?: string;
                    }) => void;
                    prompt: (momentListener?: (notification: GooglePromptNotification) => void) => void;
                    cancel: () => void;
                    renderButton?: (parent: HTMLElement, options: {
                        type?: "standard" | "icon";
                        theme?: "outline" | "filled_blue" | "filled_black";
                        size?: "large" | "medium" | "small";
                        text?: "signin_with" | "signup_with" | "continue_with" | "signin";
                        shape?: "rectangular" | "pill" | "circle" | "square";
                        width?: string;
                    }) => void;
                };
                oauth2?: {
                    initCodeClient: (options: {
                        client_id: string;
                        scope: string;
                        callback: (response: { code?: string; error?: string }) => void;
                        ux_mode?: "popup" | "redirect";
                        redirect_uri?: string;
                    }) => {
                        requestCode: () => void;
                    };
                };
            };
        };
    }
}

const GOOGLE_CLIENT_ID = "435311949966-8tqfu9fr1uubrm96fhgm6fge254ed6j1.apps.googleusercontent.com";

export const LoginForm = () => {
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
                const apiResponse = await fetch("https://internal-api.monosend.io/v1.0/auth/google", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        credential,
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

    const handleGoogleLoginFallback = () => {
        // Fallback to OAuth redirect flow when One Tap is not available
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        const scope = "openid email profile";
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scope)}` +
            `&access_type=online` +
            `&prompt=select_account`;

        window.location.href = authUrl;
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
                const reason =
                    notification.getNotDisplayedReason?.() ||
                    notification.getSkippedReason?.() ||
                    notification.getDismissedReason?.();

                // Don't show error or stop loading for credential_returned as it's not an error
                if (reason === "credential_returned") {
                    return;
                }

                setIsGoogleLoading(false);

                // Handle different error cases with user-friendly messages
                if (reason === "opt_out_or_no_session") {
                    // User has no active Google session or opted out of One Tap
                    // Fallback to redirect-based OAuth flow
                    toast.info("Redirecting to Google sign-in...");
                    setTimeout(() => {
                        handleGoogleLoginFallback();
                    }, 500);
                } else if (reason === "user_cancel" || reason === "tap_outside") {
                    // User dismissed the prompt - no error needed
                    return;
                } else if (reason === "suppressed_by_user") {
                    toast.error("Google One Tap has been disabled. Please use the standard sign-in flow.");
                    setTimeout(() => {
                        handleGoogleLoginFallback();
                    }, 1500);
                } else if (reason) {
                    // Other errors - show user-friendly message and offer fallback
                    toast.error("Unable to show Google One Tap. Trying alternative sign-in...");
                    setTimeout(() => {
                        handleGoogleLoginFallback();
                    }, 1000);
                }
            }
        });
    };



    return (
        <div className="w-full max-w-[350px] mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
                <img src="/favicon-48x48.png" alt="Logo" className="h-12" />
                <img src="/logo.png" alt="Logo" className="h-12" />
            </div>

            <h1 className="text-xl font-bold text-foreground mb-8">Log in</h1>

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
            <GitHubAuthButton />

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
    );
};
