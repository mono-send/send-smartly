import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const GitHubCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setAuth } = useAuth();
    const processedRef = useRef(false);

    useEffect(() => {
        const code = searchParams.get("code");

        if (!code) {
            toast.error("No authorization code received from GitHub");
            navigate("/login");
            return;
        }

        if (processedRef.current) return;
        processedRef.current = true;

        const exchangeCodeForToken = async () => {
            try {
                // Determine API URL - preferring env var if available, otherwise fallback or from context?
                // The existing LoginForm uses "https://internal-api.monosend.io".
                // The requirements say: POST to ${VITE_API_URL}/auth/github
                // Since I can't read .env easily without looking for it, I'll assume usage of import.meta.env.VITE_API_URL
                // However, LoginForm hardcoded "https://internal-api.monosend.io".
                // Let's use the env var if possible, but fallback to the hardcoded one from LoginForm pattern if standard practices apply,
                // OR check how other files do it. I'll stick to VITE_API_URL as requested in prompt, 
                // but if that fails I should be aware.
                // Wait, requirements said: `POST to ${VITE_API_URL}/auth/github`.
                // I will use import.meta.env.VITE_API_URL.

                const apiUrl = import.meta.env.VITE_API_URL || "https://internal-api.monosend.io";

                const response = await fetch(`${apiUrl}/auth/github`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ code }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || "Failed to authenticate with GitHub");
                }

                const data = await response.json();

                // Response format:
                // {
                //   "access_token": "jwt_token",
                //   "token_type": "bearer",
                //   "user": { ... }
                // }

                setAuth(data.access_token, data.user);
                toast.success("Successfully logged in with GitHub");
                navigate("/"); // Redirect to dashboard
            } catch (error) {
                console.error("GitHub auth error:", error);
                toast.error(error instanceof Error ? error.message : "GitHub authentication failed");
                navigate("/login");
            }
        };

        exchangeCodeForToken();
    }, [searchParams, navigate, setAuth]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Authenticating with GitHub...</p>
            </div>
        </div>
    );
};

export default GitHubCallback;
