import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import MagicLinkConfirmPage from "./pages/MagicLinkConfirmPage";
import EmailsPage from "./pages/EmailsPage";
import EmailDetailsPage from "./pages/EmailDetailsPage";
import DomainsPage from "./pages/DomainsPage";
import AddDomainPage from "./pages/AddDomainPage";
import DomainDetailsPage from "./pages/DomainDetailsPage";
import ApiKeysPage from "./pages/ApiKeysPage";
import ApiKeyDetailsPage from "./pages/ApiKeyDetailsPage";
import LogsPage from "./pages/LogsPage";
import LogDetailsPage from "./pages/LogDetailsPage";
import MetricsPage from "./pages/MetricsPage";
import OnboardingPage from "./pages/OnboardingPage";
import BroadcastsPage from "./pages/BroadcastsPage";
import TemplatesPage from "./pages/TemplatesPage";
import AudiencePage from "./pages/AudiencePage";
import ImportContactsPage from "./pages/ImportContactsPage";
import WebhooksPage from "./pages/WebhooksPage";
import SettingsPage from "./pages/SettingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import NotificationPreferencesPage from "./pages/NotificationPreferencesPage";
import AutomationsPage from "./pages/AutomationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Index />} />
          </Route>
          <Route element={<DashboardLayout />}>
            <Route path="/emails" element={<EmailsPage />} />
            <Route path="/emails/:id" element={<EmailDetailsPage />} />
            <Route path="/broadcasts" element={<BroadcastsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/audience" element={<AudiencePage />} />
            <Route path="/audience/import" element={<ImportContactsPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/domains" element={<DomainsPage />} />
            <Route path="/domains/new" element={<AddDomainPage />} />
            <Route path="/domains/:id" element={<DomainDetailsPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/logs/:id" element={<LogDetailsPage />} />
            <Route path="/api-keys" element={<ApiKeysPage />} />
            <Route path="/api-keys/:id" element={<ApiKeyDetailsPage />} />
            <Route path="/webhooks" element={<WebhooksPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/notifications/preferences" element={<NotificationPreferencesPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>
          <Route path="/automations" element={<AutomationsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/magic" element={<MagicLinkConfirmPage />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Analytics />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
