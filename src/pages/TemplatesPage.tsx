import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TopBar } from "@/components/layout/TopBar";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";

export default function TemplatesPage() {
  return (
    <DashboardLayout>
      <TopBar 
        title="Templates" 
        subtitle="Create and manage email templates"
        action={{
          label: "Create template",
          onClick: () => {},
        }}
      />
      
      <div className="p-6">
        <EmptyState
          icon={FileText}
          title="No templates yet"
          description="Create reusable email templates with React Email compatible syntax."
          action={{
            label: "Create template",
            onClick: () => {},
          }}
        />
      </div>
    </DashboardLayout>
  );
}
