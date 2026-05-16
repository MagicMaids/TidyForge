"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { ClientsManager } from "@/components/clients/clients-manager"

export default function ClientsPage() {
  const router = useRouter()
  const [companyData, setCompanyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkUser() {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: impersonation } = await supabase
        .from("impersonation_sessions")
        .select("target_company_id, companies (name)")
        .eq("admin_user_id", user.id)
        .eq("is_active", true)
        .maybeSingle()

      if (impersonation?.target_company_id) {
        // Admin is impersonating
        setCompanyData({
          company_id: impersonation.target_company_id,
          role: "owner", // Give admin full permissions
        })
        setLoading(false)
        return
      }

      // Regular user flow
      const { data } = await supabase.from("users").select("company_id, role").eq("id", user.id).single()

      if (!data?.company_id) {
        router.push("/onboarding")
        return
      }

      setCompanyData(data)
      setLoading(false)
    }

    checkUser()
  }, [router])

  if (loading || !companyData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return <ClientsManager companyId={companyData.company_id} userRole={companyData.role} />
}
