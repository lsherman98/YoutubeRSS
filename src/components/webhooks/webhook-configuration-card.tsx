import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WebhookForm } from "@/components/webhooks/webhook-form";
import { WebhookDetails } from "./webhook-details";
import { Plus, Webhook } from "lucide-react";
import { useGetUsage, useGetWebhook } from "@/lib/api/queries";

export function WebhookConfigurationCard() {
  const { data: usage } = useGetUsage();
  const { data: webhook, isPending } = useGetWebhook();

  const tierLookupKey = usage?.expand?.tier.lookup_key;
  const webhooksDisabled =
    tierLookupKey === "free" || tierLookupKey === "basic_monthly" || tierLookupKey === "basic_yearly";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>Set up a webhook URL to receive job event notifications</CardDescription>
          </div>
          {webhook && <WebhookForm webhook={webhook} trigger={<Button variant="outline">Edit Webhook</Button>} />}
        </div>
      </CardHeader>
      <CardContent>
        {isPending && (
          <div className="flex items-center justify-center py-10">
            <span className="loading-indicator" />
          </div>
        )}
        {!webhook && !isPending && (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Webhook Configured</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Create a webhook to start receiving job event notifications at your specified URL.
            </p>
            <WebhookForm
              webhook={webhook}
              trigger={
                <Button disabled={webhooksDisabled}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Webhook
                </Button>
              }
            />
          </div>
        )}
        {webhook && !isPending && <WebhookDetails webhook={webhook} />}
      </CardContent>
    </Card>
  );
}
