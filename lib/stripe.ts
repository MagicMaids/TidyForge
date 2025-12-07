import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
})

export const STRIPE_PLANS = {
  starter: {
    name: "Starter",
    description: "Perfect for small cleaning operations",
    price: 49,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "price_starter",
    features: [
      "Up to 5 team members",
      "Up to 20 properties",
      "100 jobs per month",
      "Basic support",
      "Mobile app access",
    ],
  },
  professional: {
    name: "Professional",
    description: "For growing cleaning businesses",
    price: 99,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || "price_professional",
    features: [
      "Up to 15 team members",
      "Up to 100 properties",
      "Unlimited jobs",
      "Priority support",
      "Mobile app access",
      "Client portal",
      "Custom checklists",
    ],
  },
  enterprise: {
    name: "Enterprise",
    description: "For large-scale operations",
    price: 199,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
    features: [
      "Unlimited team members",
      "Unlimited properties",
      "Unlimited jobs",
      "24/7 priority support",
      "Mobile app access",
      "Client portal",
      "Custom checklists",
      "API access",
      "Custom integrations",
    ],
  },
}
