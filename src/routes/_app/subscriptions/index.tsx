import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCreateCheckoutSession, useCreatePortalSession } from "@/lib/api/mutations";
import { useGetUsage } from "@/lib/api/queries";
import { PricingToggle } from "@/components/subscription/pricing-toggle";
import { PricingPlans } from "@/components/subscription/pricing-plans";

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

  const handleUpgrade = async (planId: string) => {
    if (planId === "free") {
      const res = await portalMutation.mutateAsync();
      if (res?.url) window.location.href = res.url;
      return;
    }

    const planMap: Record<string, "basic" | "powerUser" | "professional"> = {
      basic: "basic",
      powerUser: "powerUser",
      professional: "professional",
    };

    const plan = planMap[planId];
    if (!plan) return;

    if (!isPaidUser || currentTier !== `${planId}_${isYearly ? "yearly" : "monthly"}`) {
      const interval = isYearly ? "Yearly" : "Monthly";
      const subscriptionType = `${plan}${interval}` as any;
      const res = await checkoutMutation.mutateAsync(subscriptionType);
      if (res?.url) window.location.href = res.url;
    } else {
      const res = await portalMutation.mutateAsync();
      if (res?.url) window.location.href = res.url;
    }
  };

  return (
    <div className="h-full flex items-center justify-center w-full">
      <div className="max-w-7xl w-full p-6">
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <PricingToggle isYearly={isYearly} onToggle={setIsYearly} />
        </div>
        <PricingPlans isYearly={isYearly} currentTier={currentTier} onUpgrade={handleUpgrade} showActions={true} />
      </div>
    </div>
  );
}
