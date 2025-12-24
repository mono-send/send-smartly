import { TopBar } from "@/components/layout/TopBar";
import { EmptyState } from "@/components/ui/empty-state";
import { Megaphone } from "lucide-react";

export default function BroadcastsPage() {
  return (
    <>
      <TopBar 
        title="Broadcasts" 
        subtitle="Send campaigns to your audience"
        action={{
          label: "Create broadcast",
          onClick: () => {},
        }}
      />
      
      <div className="p-6">
        <EmptyState
          icon={Megaphone}
          title="No broadcasts yet"
          description="Create your first broadcast to send marketing emails to your audience."
          action={{
            label: "Create broadcast",
            onClick: () => {},
          }}
        />
      </div>
    </>
  );
}
