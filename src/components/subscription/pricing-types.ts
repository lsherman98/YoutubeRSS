export interface PricingFeature {
    icon: React.ReactNode;
    text: string;
    highlighted?: boolean;
    disabled?: boolean;
}

export interface PricingPrice {
    monthly: number;
    yearly: number;
}

export interface PricingTier {
    id: string;
    name: string;
    icon: React.ReactNode;
    iconColor?: string;
    description: string;
    price: PricingPrice;
    features: PricingFeature[];
    popular?: boolean;
    lookupKeys: string[];
}
