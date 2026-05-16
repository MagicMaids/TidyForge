import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { CompaniesTable } from "@/components/admin/companies-table"
import { CompaniesSearch } from "@/components/admin/companies-search"

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Build query
  let query = supabase.from("companies").select(
    `
      id,
      name,
      subscription_status,
      subscription_plan,
      created_at,
      users!inner (
        id
      )
    `,
    { count: "exact" },
  )

  // Apply search filter
  if (searchParams.search) {
    query = query.ilike("name", `%${searchParams.search}%`)
  }

  // Apply status filter
  if (searchParams.status && searchParams.status !== "all") {
    query = query.eq("subscription_status", searchParams.status)
  }

  const { data: companies, count } = await query.order("created_at", { ascending: false })

  // Count users per company
  const companiesWithUserCounts = await Promise.all(
    (companies || []).map(async (company: any) => {
      const { count: userCount } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company.id)

      return {
        ...company,
        userCount: userCount || 0,
      }
    }),
  )

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground">Manage all companies on the platform</p>
          </div>
          <div className="text-sm text-muted-foreground">Total: {count || 0}</div>
        </div>

        <CompaniesSearch />

        <CompaniesTable companies={companiesWithUserCounts} />
      </main>
    </div>
  )
}
