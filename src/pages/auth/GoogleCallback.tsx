import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setAuth } = useAuth();
    const processedRef = useRef(false);

    useEffect(() => {
        // Google OAuth redirect returns the authorization code
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            toast.error(`Google authentication failed: ${error}`);
            navigate("/login");
            return;
        }

        if (!code) {
            toast.error("No authorization code received from Google");
            navigate("/login");
            return;
        }

        if (processedRef.current) return;
        processedRef.current = true;

        const exchangeCodeForToken = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || "https://internal-api.monosend.io/v1.0";

                // Exchange the authorization code for tokens via backend
                const response = await fetch(`${apiUrl}/auth/google/code`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        code,
                        redirect_uri: `${window.location.origin}/auth/google/callback`
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || "Failed to authenticate with Google");
                }

                const data = await response.json();

                setAuth(data.access_token, data.user);
                toast.success("Successfully logged in with Google");
                navigate("/");
            } catch (error) {
                console.error("Google auth error:", error);
                toast.error(error instanceof Error ? error.message : "Google authentication failed");
                navigate("/login");
            }
        };

        exchangeCodeForToken();
    }, [searchParams, navigate, setAuth]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Authenticating with Google...</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
