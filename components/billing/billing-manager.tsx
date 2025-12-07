"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, CreditCard, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { STRIPE_PLANS } from "@/lib/stripe"

export function BillingManager({
  companyId,
  subscriptionStatus,
  subscriptionPlan,
  hasStripeCustomer,
}: {
  companyId: string
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  hasStripeCustomer: boolean
}) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSubscribe(planKey: string) {
    setLoading(planKey)

    try {
      const plan = STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS]
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.priceId,
          planName: planKey,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error("Failed to create checkout session")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  async function handleManageBilling() {
    setLoading("portal")

    try {
      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error("Failed to open billing portal")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  const isActive = subscriptionStatus === "active"

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link
            href="/dashboard"
            className="mr-4 flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex flex-1 items-center justify-end">
            <span className="font-bold">TidyForge</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-6 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
            <p className="text-muted-foreground">Manage your subscription and billing information</p>
          </div>

          {isActive && (
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Subscription</CardTitle>
                    <CardDescription>You are currently subscribed to the {subscriptionPlan} plan</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button onClick={handleManageBilling} disabled={loading === "portal"} variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  {loading === "portal" ? "Loading..." : "Manage Billing"}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="mb-4">
            <h2 className="text-2xl font-bold">Choose Your Plan</h2>
            <p className="text-muted-foreground">Select the perfect plan for your cleaning business</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {Object.entries(STRIPE_PLANS).map(([key, plan]) => {
              const isCurrentPlan = subscriptionPlan === key && isActive

              return (
                <Card key={key} className={isCurrentPlan ? "border-primary shadow-lg" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle>{plan.name}</CardTitle>
                      {isCurrentPlan && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          Current
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {!isCurrentPlan && (
                      <Button
                        className="w-full"
                        onClick={() => handleSubscribe(key)}
                        disabled={loading === key}
                        variant={key === "professional" ? "default" : "outline"}
                      >
                        {loading === key ? "Loading..." : isActive ? "Switch Plan" : "Get Started"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
