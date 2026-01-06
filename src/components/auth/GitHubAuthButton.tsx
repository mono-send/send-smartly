import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

const GITHUB_CLIENT_ID = "Ov23liV2QXlsmiv746gR"; // From requirements
const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";

export const GitHubAuthButton = () => {
    const handleGithubLogin = () => {
        const params = new URLSearchParams({
            client_id: GITHUB_CLIENT_ID,
            scope: "user:email",
            // redirect_uri is optional if configured in GitHub App settings, 
            // but good practice to rely on default or set explicitly if needed.
            // Requirement didn't specify a specific redirect_uri to send, 
            // implying the GitHub App is configured to default to the callback we implement.
            // We will let GitHub use the registered callback URL.
        });

        window.location.href = `${GITHUB_AUTH_URL}?${params.toString()}`;
    };

    return (
        <Button
            variant="outline"
            className="w-full mb-6"
            onClick={handleGithubLogin}
        >
            <Github className="mr-2 h-5 w-5" />
            Continue with GitHub
        </Button>
    );
};
