import { Check, Mic, Wifi, Zap, Key, Database, Infinity, CreditCard } from "lucide-react";
import type { PricingTier } from "./pricing-types";

export const pricingTiers: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    icon: <Mic className="h-5 w-5" />,
    description: "Everything you need to get started.",
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      {
        icon: <Check className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "15 uploads each month",
      },
      {
        icon: <Check className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "500MB per month",
      },
      {
        icon: <Check className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "1 podcast",
      },
      {
        icon: <span className="h-4 w-4 flex-shrink-0" />,
        text: "No API access",
        disabled: true,
      },
    ],
    lookupKeys: ["free"],
  },
  {
    id: "basic",
    name: "Basic",
    icon: <Wifi className="h-5 w-5 text-blue-500" />,
    iconColor: "text-blue-500",
    description: "Usage limits that work for you.",
    price: {
      monthly: 8,
      yearly: 6.83,
    },
    features: [
      {
        icon: <Check className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "50 uploads each month",
      },
      {
        icon: <Check className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "2GB per month",
      },
      {
        icon: <Check className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "Unlimited podcasts",
      },
      {
        icon: <span className="h-4 w-4 flex-shrink-0" />,
        text: "No API access",
        disabled: true,
      },
    ],
    lookupKeys: ["basic_monthly", "basic_yearly"],
  },
  {
    id: "powerUser",
    name: "Power User",
    icon: <Zap className="h-5 w-5 text-yellow-500" />,
    iconColor: "text-yellow-500",
    description: "Add to your podcasts worry free and start converting videos with our API.",
    price: {
      monthly: 16,
      yearly: 13.67,
    },
    features: [
      {
        icon: <Infinity className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "Unlimited uploads",
        highlighted: true,
      },
      {
        icon: <Check className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "5GB per month",
      },
      {
        icon: <Check className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "Unlimited podcasts",
      },
      {
        icon: <Key className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "API Access",
        highlighted: true,
      },
    ],
    popular: true,
    lookupKeys: ["power_user_monthly", "power_user_yearly"],
  },
  {
    id: "professional",
    name: "Professional",
    icon: <Database className="h-5 w-5 text-purple-500" />,
    iconColor: "text-purple-500",
    description: "Recommended for large workloads using our API.",
    price: {
      monthly: 32,
      yearly: 27.17,
    },
    features: [
      {
        icon: <Infinity className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "Unlimited uploads",
        highlighted: true,
      },
      {
        icon: <Check className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "12GB per month",
      },
      {
        icon: <Check className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "Unlimited podcasts",
      },
      {
        icon: <Key className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "API Access",
        highlighted: true,
      },
      {
        icon: <Check className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "Unused bandwidth rolls over to the next month",
      },
      {
        icon: <CreditCard className="h-4 w-4 text-green-500 flex-shrink-0" />,
        text: "Pay as you go",
        highlighted: true,
        disabled: true,
      },
    ],
    lookupKeys: ["professional_monthly", "professional_yearly"],
  },
];
