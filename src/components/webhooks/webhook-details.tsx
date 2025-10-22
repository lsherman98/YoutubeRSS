import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { type WebhooksResponse } from "@/lib/pocketbase-types";
import { useUpdateWebhook } from "@/lib/api/mutations";
import { toast } from "sonner";

interface WebhookDetailsProps {
  webhook: WebhooksResponse;
}

export function WebhookDetails({ webhook }: WebhookDetailsProps) {
  const updateWebhookMutation = useUpdateWebhook();

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label htmlFor="webhook-enabled" className="text-sm font-medium">
            Status
          </Label>
          <Badge variant={webhook.enabled ? "default" : "secondary"}>{webhook.enabled ? "Enabled" : "Disabled"}</Badge>
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
            {webhook.events?.map((event) => (
              <Badge key={event} variant="secondary" className="text-xs">
                {event}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
