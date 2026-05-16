import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { getActiveImpersonation } from "@/lib/actions/impersonation"
import { ImpersonationBanner } from "@/components/admin/impersonation-banner"
import { JobsPageContent } from "@/components/dashboard/jobs-page-content"

export default async function JobsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const impersonationSession = await getActiveImpersonation()

  let companyId = impersonationSession?.target_company_id
  let userData = null

  if (!companyId) {
    const { data } = await supabase.from("users").select("company_id, role, full_name").eq("id", user.id).maybeSingle()

    userData = data
    companyId = data?.company_id

    if (!userData || !companyId) {
      redirect("/onboarding")
    }
  } else {
    userData = { company_id: companyId, role: "owner", full_name: "Platform Admin" }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {impersonationSession && (
        <ImpersonationBanner
          companyName={impersonationSession.companies?.name || "Unknown Company"}
          startedAt={impersonationSession.started_at}
        />
      )}

      <DashboardHeader userName={userData.full_name} userRole={userData.role} />

      <JobsPageContent companyId={companyId} userRole={userData.role} />
    </div>
  )
}
