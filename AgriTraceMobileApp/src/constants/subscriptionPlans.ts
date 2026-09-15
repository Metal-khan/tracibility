// Single source of truth for what each subscription plan grants.
// Previously duplicated — SubscriptionScreen.tsx defined this list inline,
// and SubscriptionManagement.tsx separately hardcoded 'of 3' (assuming
// every free-trial user's quota was always 3) or the literal string
// 'Your Plan Limit' for every paid plan, which was never actually a number.
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  products: number | 'Unlimited';
  icon: string;
  color: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: 'FREE_TRIAL_3', name: 'Free Trial', price: 0.00, products: 3, icon: 'account-star-outline', color: '#007bff' },
  { id: 'BASIC_5', name: '5 Product Pack', price: 49.99, products: 5, icon: 'numeric-5-box-outline', color: '#28a745' },
  { id: 'STANDARD_10', name: '10 Product Pack', price: 89.99, products: 10, icon: 'numeric-10-box-outline', color: '#ffc107' },
  { id: 'PREMIUM_25', name: '25 Product Pack', price: 199.99, products: 25, icon: 'numeric-9-plus-box-outline', color: '#dc3545' },
  { id: 'UNLIMITED', name: 'Unlimited Annual', price: 499.99, products: 'Unlimited', icon: 'infinity', color: '#800080' },
];

// The quota a plan grants when first purchased — this is what "remaining
// products" should be shown out of. Falls back to null (caller should
// display something like "your plan limit" without pretending to know a
// number) for a plan id that isn't in the list above, e.g. one added via
// the admin panel that hasn't been mirrored here yet.
export function getPlanQuota(planId: string | null | undefined): number | 'Unlimited' | null {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  return plan ? plan.products : null;
}
