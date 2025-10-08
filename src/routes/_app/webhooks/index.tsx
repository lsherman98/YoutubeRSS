import { createFileRoute } from "@tanstack/react-router";
import { useGetWebhook, useGetWebhookEvents } from "@/lib/api/queries";
import { useCreateWebhook, useUpdateWebhook, useDeleteWebhook } from "@/lib/api/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WebhookForm } from "@/components/webhooks/webhook-form";
import { toast } from "sonner";
import { type WebhooksRecord } from "@/lib/pocketbase-types";
import { Webhook, Plus } from "lucide-react";
import { WebhookEventsTable } from "@/components/webhooks/webhook-events-table";

export const Route = createFileRoute("/_app/webhooks/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: webhook } = useGetWebhook();
  const { data: webhookEvents } = useGetWebhookEvents();
  const createWebhookMutation = useCreateWebhook();
  const updateWebhookMutation = useUpdateWebhook();
  const deleteWebhookMutation = useDeleteWebhook();

  const handleCreateWebhook = async (data: Partial<WebhooksRecord>) => {
    try {
      await createWebhookMutation.mutateAsync(data);
      toast.success("Webhook created successfully");
    } catch (error) {
      toast.error("Failed to create webhook");
    }
  };

  const handleUpdateWebhook = async (data: Partial<WebhooksRecord>) => {
    if (!webhook) return;
    try {
      await updateWebhookMutation.mutateAsync({ id: webhook.id, data });
      toast.success("Webhook updated successfully");
    } catch (error) {
      toast.error("Failed to update webhook");
    }
  };

  const handleDeleteWebhook = async () => {
    if (!webhook) return;
    try {
      await deleteWebhookMutation.mutateAsync(webhook.id);
      toast.success("Webhook deleted successfully");
    } catch (error) {
      toast.error("Failed to delete webhook");
    }
  };

  const handleToggleWebhook = async (enabled: boolean) => {
    if (!webhook) return;
    try {
      await updateWebhookMutation.mutateAsync({
        id: webhook.id,
        data: { enabled },
      });
      toast.success(`Webhook ${enabled ? "enabled" : "disabled"} successfully`);
    } catch (error) {
      toast.error("Failed to update webhook status");
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground">Configure webhooks to receive real-time notifications about job events</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>Set up a webhook URL to receive job event notifications</CardDescription>
            </div>
            {webhook && (
              <WebhookForm
                webhook={webhook}
                onSubmit={handleUpdateWebhook}
                onDelete={handleDeleteWebhook}
                isPending={updateWebhookMutation.isPending}
                trigger={<Button variant="outline">Edit Webhook</Button>}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!webhook ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Webhook Configured</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Create a webhook to start receiving job event notifications at your specified URL.
              </p>
              <WebhookForm
                onSubmit={handleCreateWebhook}
                isPending={createWebhookMutation.isPending}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Webhook
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Label htmlFor="webhook-enabled" className="text-sm font-medium">
                    Status
                  </Label>
                  <Badge variant={webhook.enabled ? "default" : "secondary"}>
                    {webhook.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="webhook-enabled"
                    checked={webhook.enabled}
                    onCheckedChange={handleToggleWebhook}
                    disabled={updateWebhookMutation.isPending}
                  />
                  <Label htmlFor="webhook-enabled" className="text-sm text-muted-foreground cursor-pointer">
                    {webhook.enabled ? "Enabled" : "Disabled"}
                  </Label>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex-1 min-w-0">
                  <label className="text-sm font-medium">Webhook URL</label>
                  <p className="text-sm text-muted-foreground break-all">{webhook.url}</p>
                </div>
                <div className="flex-shrink-0">
                  <label className="text-sm font-medium">Subscribed Events</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="secondary" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {webhookEvents && (
        <Card className="flex flex-col flex-1 min-h-0">
          <CardHeader>
            <CardTitle>Webhook Events</CardTitle>
            <CardDescription>Recent webhook delivery attempts and their status</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <WebhookEventsTable events={webhookEvents || []} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
