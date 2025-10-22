import { Switch } from "@/components/ui/switch";

interface PricingToggleProps {
  isYearly: boolean;
  onToggle: (checked: boolean) => void;
}

export function PricingToggle({ isYearly, onToggle }: PricingToggleProps) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <span className={`text-sm ${!isYearly ? "font-bold" : ""}`}>Monthly</span>
      <Switch checked={isYearly} onCheckedChange={onToggle} />
      <span className={`text-sm ${isYearly ? "font-bold" : ""}`}>
        Yearly <span className="text-green-600">(Save 15%)</span>
      </span>
    </div>
  );
}
