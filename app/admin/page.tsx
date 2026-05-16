import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminStats } from "@/components/admin/admin-stats"
import { SystemHealth } from "@/components/admin/system-health"
import { RecentActivity } from "@/components/admin/recent-activity"

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has system role
  const { data: systemRoles } = await supabase
    .from("user_system_roles")
    .select(`
      system_roles (
        name
      )
    `)
    .eq("user_id", user.id)

  const hasAdminRole = systemRoles?.some((role: any) =>
    ["super_admin", "platform_admin"].includes(role.system_roles?.name),
  )

  if (!hasAdminRole) {
    redirect("/dashboard")
  }

  // Fetch platform-wide stats
  const [companiesResult, usersResult, jobsResult] = await Promise.all([
    supabase.from("companies").select("id, created_at", { count: "exact" }),
    supabase.from("users").select("id, created_at", { count: "exact" }),
    supabase.from("jobs").select("id, total_price, created_at"),
  ])

  const totalCompanies = companiesResult.count || 0
  const totalUsers = usersResult.count || 0
  const totalJobs = jobsResult.data?.length || 0

  // Calculate MRR (assuming $99/month per company for now)
  const mrr = totalCompanies * 99

  // Calculate growth rates (simplified - comparing last 30 days to previous 30 days)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const recentCompanies = companiesResult.data?.filter((c: any) => new Date(c.created_at) >= thirtyDaysAgo).length || 0
  const previousCompanies =
    companiesResult.data?.filter(
      (c: any) => new Date(c.created_at) >= sixtyDaysAgo && new Date(c.created_at) < thirtyDaysAgo,
    ).length || 0
  const companyGrowth = previousCompanies > 0 ? ((recentCompanies - previousCompanies) / previousCompanies) * 100 : 0

  const recentUsers = usersResult.data?.filter((u: any) => new Date(u.created_at) >= thirtyDaysAgo).length || 0
  const previousUsers =
    usersResult.data?.filter(
      (u: any) => new Date(u.created_at) >= sixtyDaysAgo && new Date(u.created_at) < thirtyDaysAgo,
    ).length || 0
  const userGrowth = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground">Monitor and manage the TidyForge platform</p>
        </div>

        <AdminStats
          totalCompanies={totalCompanies}
          companyGrowth={companyGrowth}
          totalUsers={totalUsers}
          userGrowth={userGrowth}
          mrr={mrr}
          totalJobs={totalJobs}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <SystemHealth />
          <RecentActivity />
        </div>
      </main>
    </div>
  )
}
