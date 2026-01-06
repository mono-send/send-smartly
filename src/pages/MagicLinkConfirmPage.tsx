import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const MagicLinkConfirmPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const confirmMagicLink = async () => {
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      if (!token || !email) {
        setStatus("error");
        setErrorMessage("Invalid magic link. Missing token or email.");
        return;
      }

      try {
        const response = await fetch("https://internal-api.monosend.io/v1.0/signin/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, token }),
        });

        if (response.ok) {
          const data = await response.json();
          // Save auth token and user data
          setAuth(data.access_token, data.user);
          setStatus("success");
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          const data = await response.json();
          setStatus("error");
          setErrorMessage(data.message || "Failed to verify magic link.");
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage("An error occurred. Please try again.");
      }
    };

    confirmMagicLink();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">Verifying your magic link...</h1>
            <p className="text-muted-foreground">Please wait while we sign you in.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">Successfully signed in!</h1>
            <p className="text-muted-foreground">Redirecting you to the dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">Verification failed</h1>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <button
              onClick={() => navigate("/login")}
              className="text-primary hover:underline"
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MagicLinkConfirmPage;
