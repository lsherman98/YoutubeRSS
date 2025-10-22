import { PricingCard } from "./pricing-card";
import { pricingTiers } from "./pricing-data";

interface PricingPlansProps {
  isYearly: boolean;
  currentTier?: string;
  onUpgrade?: (planId: string) => void;
  showActions?: boolean;
}

export function PricingPlans({ isYearly, currentTier = "free", onUpgrade, showActions = true }: PricingPlansProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
      {pricingTiers.map((tier) => (
        <PricingCard
          key={tier.id}
          tier={tier}
          isYearly={isYearly}
          currentTier={currentTier}
          onUpgrade={onUpgrade ? () => onUpgrade(tier.id) : undefined}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
