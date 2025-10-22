import { CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useGetUsage } from "@/lib/api/queries";
import { formatFileSize } from "@/lib/utils";

export function SubscriptionCard() {
  const { data: usage } = useGetUsage();

  const currentTier = usage?.expand?.tier?.title;
  const tierLookupKey = usage?.expand?.tier?.lookup_key;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
        <CardDescription>Your current subscription tier and usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Current Plan</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {tierLookupKey === "free"
                ? "Free tier"
                : tierLookupKey?.includes("monthly")
                ? "Billed monthly"
                : "Billed yearly"}
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {currentTier}
          </Badge>
        </div>
        {usage?.limit && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Usage</span>
              <span className="font-medium">
                {formatFileSize(usage.usage)} / {formatFileSize(usage.limit)}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(((usage.usage || 0) / usage.limit) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}
        <Button variant="outline" className="w-full" asChild>
          <a href="/subscriptions">Manage Subscription</a>
        </Button>
      </CardContent>
    </Card>
  );
}
