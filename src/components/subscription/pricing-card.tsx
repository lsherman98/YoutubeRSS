import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PricingTier } from "./pricing-types";

interface PricingCardProps {
  tier: PricingTier;
  isYearly: boolean;
  currentTier: string;
  onUpgrade?: () => void;
  showActions?: boolean;
}

export function PricingCard({ tier, isYearly, currentTier, onUpgrade, showActions = true }: PricingCardProps) {
  const price = isYearly ? tier.price.yearly : tier.price.monthly;
  const yearlyTotal = tier.price.yearly * 12;
  const isCurrentTier = tier.lookupKeys.includes(currentTier);
  const isFree = tier.id === "free";

  const getButtonText = () => {
    if (!showActions) return null;
    if (isCurrentTier && !isFree) return "Manage Subscription";
    if (isCurrentTier && isFree) return "Current Plan";
    if (isFree) return "Downgrade to Free";
    return `Upgrade to ${tier.name}`;
  };

  const getButtonVariant = () => {
    return isCurrentTier ? "outline" : "default";
  };

  return (
    <Card className={`relative flex flex-col h-full ${tier.popular ? "border-primary" : ""}`}>
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tier.icon}
            <CardTitle>{tier.name}</CardTitle>
          </div>
          {isCurrentTier && <Badge variant="secondary">Current</Badge>}
        </div>
        <CardDescription className="min-h-10">{tier.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="mb-4 min-h-18">
          <div className="text-3xl font-bold">${price === 0 ? "0" : price.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">
            {isFree ? "forever" : isYearly ? "per month" : "per month"}
          </div>
          {isYearly && !isFree && (
            <div className="text-xs text-muted-foreground">Billed ${yearlyTotal.toFixed(0)}/year</div>
          )}
        </div>
        <ul className="space-y-3 mb-6 flex-1">
          {tier.features.map((feature, index) => (
            <li key={index} className={`flex items-center gap-2 ${feature.disabled ? "opacity-50" : ""}`}>
              {feature.icon}
              <span className={`text-sm ${feature.highlighted ? "font-medium" : ""}`}>
                {feature.text}
                {feature.disabled && feature.highlighted && (
                  <Badge className="ml-2" variant="secondary">
                    Coming Soon
                  </Badge>
                )}
              </span>
            </li>
          ))}
        </ul>
        {showActions && onUpgrade && (
          <Button
            className="w-full"
            variant={getButtonVariant()}
            disabled={isCurrentTier && isFree}
            onClick={onUpgrade}
          >
            {getButtonText()}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
