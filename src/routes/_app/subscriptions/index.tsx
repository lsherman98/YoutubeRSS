import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Mic, Wifi, Key, Zap, Database, Infinity, CreditCard } from "lucide-react";
import { useCreateCheckoutSession, useCreatePortalSession } from "@/lib/api/mutations";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useGetUsage } from "@/lib/api/queries";

export const Route = createFileRoute("/_app/subscriptions/")({
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { data: usage } = useGetUsage();
  const checkoutMutation = useCreateCheckoutSession();
  const portalMutation = useCreatePortalSession();
  const [isYearly, setIsYearly] = useState(false);

  const currentTier = usage?.expand?.tier?.lookup_key || "free";
  const isPaidUser = currentTier !== "free";

  const handleUpgrade = async (plan: "basic" | "powerUser" | "professional") => {
    if (!isPaidUser || currentTier !== plan) {
      const interval = isYearly ? "Yearly" : "Monthly";
      const subscriptionType = `${plan}${interval}` as any;
      const res = await checkoutMutation.mutateAsync(subscriptionType);
      if (res?.url) window.location.href = res.url;
    } else {
      const res = await portalMutation.mutateAsync();
      if (res?.url) window.location.href = res.url;
    }
  };

  const handleManageSubscription = async () => {
    const res = await portalMutation.mutateAsync();
    if (res?.url) window.location.href = res.url;
  };

  return (
    <div className="h-full flex items-center justify-center w-full">
      <div className="max-w-7xl w-full p-6">
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <div className="flex items-center gap-2 justify-center">
            <span className={`text-sm ${!isYearly ? "font-bold" : ""}`}>Monthly</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={`text-sm ${isYearly ? "font-bold" : ""}`}>
              Yearly <span className="text-green-600">(Save 15%)</span>
            </span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <Card className="relative flex flex-col h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  <CardTitle>Free</CardTitle>
                </div>
                {currentTier === "free" && <Badge variant="secondary">Current</Badge>}
              </div>
              <CardDescription className="min-h-10">Everything you need to get started.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4 min-h-18">
                <div className="text-3xl font-bold">$0</div>
                <div className="text-sm text-muted-foreground">forever</div>
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">15 uploads each month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">500MB per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">1 podcast</span>
                </li>
                <li className="flex items-center gap-2 opacity-50">
                  <span className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">No API access</span>
                </li>
              </ul>
              <Button
                className="w-full"
                variant={currentTier === "free" ? "outline" : "default"}
                disabled={currentTier === "free"}
                onClick={handleManageSubscription}
              >
                {currentTier === "free" ? "Current Plan" : "Downgrade to Free"}
              </Button>
            </CardContent>
          </Card>
          <Card className="relative flex flex-col h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-blue-500" />
                  <CardTitle>Basic</CardTitle>
                </div>
                {(currentTier === "basic_monthly" || currentTier === "basic_yearly") && (
                  <Badge variant="secondary">Current</Badge>
                )}
              </div>
              <CardDescription className="min-h-10">Usage limits that work for you.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4 min-h-18">
                <div className="text-3xl font-bold">{isYearly ? "$10.20" : "$12"}</div>
                <div className="text-sm text-muted-foreground">{isYearly ? "per month" : "per month"}</div>
                {isYearly && <div className="text-xs text-muted-foreground">Billed $122/year</div>}
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">50 uploads each month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">2GB per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Unlimited podcasts</span>
                </li>
                <li className="flex items-center gap-2 opacity-50">
                  <span className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">No API access</span>
                </li>
              </ul>
              <Button
                onClick={() => {
                  currentTier === "free" ? handleUpgrade("basic") : handleManageSubscription();
                }}
                className="w-full"
                variant={currentTier === "basic_monthly" || currentTier === "basic_yearly" ? "outline" : "default"}
              >
                {currentTier === "basic_monthly" || currentTier === "basic_yearly"
                  ? "Manage Subscription"
                  : "Upgrade to Basic"}
              </Button>
            </CardContent>
          </Card>
          <Card className="relative border-primary flex flex-col h-full">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Power User</CardTitle>
                </div>
                {(currentTier === "power_user_monthly" || currentTier === "power_user_yearly") && (
                  <Badge variant="secondary">Current</Badge>
                )}
              </div>
              <CardDescription className="min-h-10">
                Add to your podcasts worry free and start converting videos with our API.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4 min-h-18">
                <div className="text-3xl font-bold">{isYearly ? "$20.40" : "$24"}</div>
                <div className="text-sm text-muted-foreground">{isYearly ? "per month" : "per month"}</div>
                {isYearly && <div className="text-xs text-muted-foreground">Billed $244/year</div>}
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-center gap-2">
                  <Infinity className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium">Unlimited uploads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">5GB per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Unlimited podcasts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium">API Access</span>
                </li>
              </ul>
              <Button
                onClick={() => {
                  currentTier === "free" ? handleUpgrade("powerUser") : handleManageSubscription();
                }}
                className="w-full"
                variant={
                  currentTier === "power_user_monthly" || currentTier === "power_user_yearly" ? "outline" : "default"
                }
              >
                {currentTier === "power_user_monthly" || currentTier === "power_user_yearly"
                  ? "Manage Subscription"
                  : "Upgrade to Power User"}
              </Button>
            </CardContent>
          </Card>
          <Card className="relative flex flex-col h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-500" />
                  <CardTitle>Professional</CardTitle>
                </div>
                {(currentTier === "professional_monthly" || currentTier === "professional_yearly") && (
                  <Badge variant="secondary">Current</Badge>
                )}
              </div>
              <CardDescription className="min-h-10">Recommended for large workloads using our API.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4 min-h-18">
                <div className="text-3xl font-bold">{isYearly ? "$40.80" : "$48"}</div>
                <div className="text-sm text-muted-foreground">{isYearly ? "per month" : "per month"}</div>
                {isYearly && <div className="text-xs text-muted-foreground">Billed $489/year</div>}
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-center gap-2">
                  <Infinity className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium">Unlimited uploads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">12GB per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Unlimited podcasts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium">API Access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Unused bandwidth rolls over to the next month</span>
                </li>
                <li className="flex items-center gap-2 opacity-50">
                  <CreditCard className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    Pay as you go <Badge className="ml-2">Coming Soon</Badge>
                  </span>
                </li>
              </ul>
              <Button
                onClick={() => {
                  currentTier === "free" ? handleUpgrade("professional") : handleManageSubscription();
                }}
                className="w-full"
                variant={
                  currentTier === "professional_monthly" || currentTier === "professional_yearly"
                    ? "outline"
                    : "default"
                }
              >
                {currentTier === "professional_monthly" || currentTier === "professional_yearly"
                  ? "Manage Subscription"
                  : "Upgrade to Professional"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
