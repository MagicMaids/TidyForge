import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { TeamPerformance } from "@/components/dashboard/team-performance"
import { getActiveImpersonation } from "@/lib/actions/impersonation"
import { ImpersonationBanner } from "@/components/admin/impersonation-banner"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const impersonationSession = await getActiveImpersonation()

  const { data: systemRoles } = await supabase
    .from("user_system_roles")
    .select(`
      system_roles (
        name
      )
    `)
    .eq("user_id", user.id)

  const hasAdminRole = systemRoles?.some((role: any) =>
    ["super_admin", "platform_admin", "developer", "support", "analyst"].includes(role.system_roles?.name),
  )

  if (hasAdminRole && !impersonationSession) {
    redirect("/admin")
  }

  let companyId = impersonationSession?.target_company_id
  let userData = null

  if (!companyId) {
    const { data } = await supabase.from("users").select("company_id, role, full_name").eq("id", user.id).maybeSingle()

    userData = data
    companyId = data?.company_id

    if (!userData) {
      redirect("/onboarding")
    }

    if (!companyId) {
      redirect("/onboarding")
    }

    if (userData.role === "cleaner") {
      redirect("/mobile")
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

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-[1600px] space-y-8">
          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {userData.full_name.split(" ")[0]}</p>
          </div>

          {/* Key Metrics */}
          <DashboardStats companyId={companyId} />

          {/* Quick Actions */}
          <QuickActions userRole={userData.role} />

          <DashboardContent companyId={companyId} userRole={userData.role} />

          {/* Team Performance */}
          <TeamPerformance companyId={companyId} />
        </div>
      </main>
    </div>
  )
}
