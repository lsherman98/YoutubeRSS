import { createFileRoute } from "@tanstack/react-router";
import { useGetWebhookEvents } from "@/lib/api/queries";
import { WebhookConfigurationCard } from "../../../components/webhooks/webhook-configuration-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WebhookEventsTable } from "@/components/webhooks/webhook-events-table";

export const Route = createFileRoute("/_app/webhooks/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: webhookEvents } = useGetWebhookEvents();

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground">Configure webhooks to receive real-time notifications about job events</p>
      </div>
      <WebhookConfigurationCard />
      <Card className="flex flex-col flex-1 min-h-0">
        <CardHeader>
          <CardTitle>Webhook Events</CardTitle>
          <CardDescription>Recent webhook delivery attempts and their status</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <WebhookEventsTable events={webhookEvents || []} />
        </CardContent>
      </Card>
    </div>
  );
}
