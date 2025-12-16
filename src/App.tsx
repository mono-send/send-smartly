import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import EmailsPage from "./pages/EmailsPage";
import DomainsPage from "./pages/DomainsPage";
import ApiKeysPage from "./pages/ApiKeysPage";
import LogsPage from "./pages/LogsPage";
import MetricsPage from "./pages/MetricsPage";
import OnboardingPage from "./pages/OnboardingPage";
import BroadcastsPage from "./pages/BroadcastsPage";
import TemplatesPage from "./pages/TemplatesPage";
import AudiencePage from "./pages/AudiencePage";
import WebhooksPage from "./pages/WebhooksPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/emails" replace />} />
          <Route path="/emails" element={<EmailsPage />} />
          <Route path="/broadcasts" element={<BroadcastsPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/audience" element={<AudiencePage />} />
          <Route path="/metrics" element={<MetricsPage />} />
          <Route path="/domains" element={<DomainsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/api-keys" element={<ApiKeysPage />} />
          <Route path="/webhooks" element={<WebhooksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
