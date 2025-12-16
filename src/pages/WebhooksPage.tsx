import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TopBar } from "@/components/layout/TopBar";
import { EmptyState } from "@/components/ui/empty-state";
import { Webhook } from "lucide-react";

export default function WebhooksPage() {
  return (
    <DashboardLayout>
      <TopBar 
        title="Webhooks" 
        subtitle="Receive real-time updates about email events"
        action={{
          label: "Add webhook",
          onClick: () => {},
        }}
      />
      
      <div className="p-6">
        <EmptyState
          icon={Webhook}
          title="No webhooks yet"
          description="Configure webhooks to receive real-time updates when emails are delivered, opened, clicked, or bounced."
          action={{
            label: "Add webhook",
            onClick: () => {},
          }}
        />
      </div>
    </DashboardLayout>
  );
}
