import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, Mail, AlertCircle, CheckCircle, Info, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface NotificationPreference {
  id: string;
  type: "email" | "success" | "warning" | "info";
  label: string;
  description: string;
  enabled: boolean;
  emailEnabled: boolean;
}

const defaultPreferences: NotificationPreference[] = [
  {
    id: "email_delivery",
    type: "email",
    label: "Email Delivery",
    description: "Get notified when emails are delivered, bounced, or failed",
    enabled: true,
    emailEnabled: true,
  },
  {
    id: "broadcasts",
    type: "email",
    label: "Broadcast Updates",
    description: "Updates about your broadcast campaigns and completion status",
    enabled: true,
    emailEnabled: false,
  },
  {
    id: "warnings",
    type: "warning",
    label: "Warnings & Alerts",
    description: "Rate limits, bounce rate increases, and other important alerts",
    enabled: true,
    emailEnabled: true,
  },
  {
    id: "domain",
    type: "success",
    label: "Domain Verification",
    description: "Updates when domains are verified or require attention",
    enabled: true,
    emailEnabled: true,
  },
  {
    id: "product",
    type: "info",
    label: "Product Updates",
    description: "New features, improvements, and platform announcements",
    enabled: true,
    emailEnabled: false,
  },
  {
    id: "tips",
    type: "info",
    label: "Tips & Best Practices",
    description: "Helpful tips to improve your email deliverability",
    enabled: false,
    emailEnabled: false,
  },
];

function getIcon(type: NotificationPreference["type"]) {
  switch (type) {
    case "email":
      return <Mail className="h-5 w-5 text-primary" />;
    case "success":
      return <CheckCircle className="h-5 w-5 text-success" />;
    case "warning":
      return <AlertCircle className="h-5 w-5 text-warning" />;
    case "info":
    default:
      return <Info className="h-5 w-5 text-info" />;
  }
}

function getIconBg(type: NotificationPreference["type"]) {
  switch (type) {
    case "email":
      return "bg-primary/10";
    case "success":
      return "bg-success/10";
    case "warning":
      return "bg-warning/10";
    case "info":
    default:
      return "bg-info/10";
  }
}

export default function NotificationPreferencesPage() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState(defaultPreferences);

  const updatePreference = (id: string, field: "enabled" | "emailEnabled", value: boolean) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.id === id ? { ...pref, [field]: value } : pref
      )
    );
  };

  const handleSave = () => {
    toast.success("Notification preferences saved");
  };

  return (
    <>
      <TopBar 
        title="Notification Preferences" 
        subtitle="Control how you receive notifications"
      />
      
      <div className="p-6 max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => navigate("/notifications")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Notifications
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Notification Types</CardTitle>
                <CardDescription>Choose which notifications you want to receive</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Header Row */}
            <div className="flex items-center justify-end gap-8 text-sm font-medium text-muted-foreground border-b border-border pb-3">
              <span className="w-20 text-center">In-App</span>
              <span className="w-20 text-center">Email</span>
            </div>

            {/* Preference Items */}
            {preferences.map((pref) => (
              <div key={pref.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getIconBg(pref.type)}`}>
                    {getIcon(pref.type)}
                  </div>
                  <div>
                    <Label htmlFor={pref.id} className="font-medium cursor-pointer">
                      {pref.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {pref.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="w-20 flex justify-center">
                    <Switch
                      id={pref.id}
                      checked={pref.enabled}
                      onCheckedChange={(checked) => updatePreference(pref.id, "enabled", checked)}
                    />
                  </div>
                  <div className="w-20 flex justify-center">
                    <Switch
                      checked={pref.emailEnabled}
                      onCheckedChange={(checked) => updatePreference(pref.id, "emailEnabled", checked)}
                      disabled={!pref.enabled}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-border">
              <Button onClick={handleSave}>
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
