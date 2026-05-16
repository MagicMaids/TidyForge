"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { BillingManager } from "@/components/billing/billing-manager"

export default function BillingPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [companyData, setCompanyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkUser() {
      const supabase = createBrowserClient()
      const user = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data } = await supabase.from("users").select("company_id, role").eq("id", user.id).single()

      if (!data?.company_id) {
        router.push("/onboarding")
        return
      }

      if (data.role !== "admin") {
        router.push("/dashboard")
        return
      }

      const { data: company } = await supabase
        .from("companies")
        .select("subscription_status, subscription_plan, stripe_customer_id")
        .eq("id", data.company_id)
        .single()

      setUserData(data)
      setCompanyData(company)
      setLoading(false)
    }

    checkUser()
  }, [router])

  if (loading || !userData || !companyData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <BillingManager
      companyId={userData.company_id}
      subscriptionStatus={companyData?.subscription_status || null}
      subscriptionPlan={companyData?.subscription_plan || null}
      hasStripeCustomer={!!companyData?.stripe_customer_id}
    />
  )
}
