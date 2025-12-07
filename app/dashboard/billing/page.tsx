import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { BillingManager } from "@/components/billing/billing-manager"

export default async function BillingPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("company_id, role").eq("id", user.id).single()

  if (!userData?.company_id) {
    redirect("/onboarding")
  }

  if (userData.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: companyData } = await supabase
    .from("companies")
    .select("subscription_status, subscription_plan, stripe_customer_id")
    .eq("id", userData.company_id)
    .single()

  return (
    <BillingManager
      companyId={userData.company_id}
      subscriptionStatus={companyData?.subscription_status || null}
      subscriptionPlan={companyData?.subscription_plan || null}
      hasStripeCustomer={!!companyData?.stripe_customer_id}
    />
  )
}
