import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginRightSectionA } from "@/components/auth/LoginRightSectionA";
import { LoginRightSectionB } from "@/components/auth/LoginRightSectionB";
import { Button } from "@/components/ui/button";

const LoginPage = () => {
  const [variant, setVariant] = useState<'A' | 'B'>('B');

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-4 xl:px-4 bg-background">
        <LoginForm />
      </div>

      {/* Right Section - Variant A or B */}
      {variant === 'A' ? <LoginRightSectionA /> : <LoginRightSectionB />}

      {/* Dev Toggle for A/B Testing */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setVariant(v => v === 'A' ? 'B' : 'A')}
          className="opacity-50 hover:opacity-100 bg-background/50 backdrop-blur-sm border border-border"
        >
          Variant {variant} (Switch)
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;
