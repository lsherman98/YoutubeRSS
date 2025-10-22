import { createFileRoute } from "@tanstack/react-router";
import { AccountInfoCard } from "@/components/settings/account-info-card";
import { SubscriptionCard } from "@/components/settings/subscription-card";
import { DangerZoneCard } from "@/components/settings/danger-zone-card";

export const Route = createFileRoute("/_app/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="h-full flex flex-col p-6 overflow-auto">
      <div className="max-w-7xl w-full mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <AccountInfoCard />
          <SubscriptionCard />
        </div>
        <div className="md:w-1/2 pr-3">
          <DangerZoneCard />
        </div>
      </div>
    </div>
  );
}
