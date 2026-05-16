import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { UsersTable } from "@/components/admin/users-table"
import { UsersSearch } from "@/components/admin/users-search"

export default async function UsersPage({ searchParams }: { searchParams: { search?: string; role?: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Build query
  let query = supabase.from("users").select(
    `
      id,
      email,
      role,
      created_at,
      company_id,
      companies (
        name
      )
    `,
    { count: "exact" },
  )

  // Apply search filter
  if (searchParams.search) {
    query = query.ilike("email", `%${searchParams.search}%`)
  }

  // Apply role filter
  if (searchParams.role && searchParams.role !== "all") {
    query = query.eq("role", searchParams.role)
  }

  const { data: users, count } = await query.order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">Manage all users across the platform</p>
          </div>
          <div className="text-sm text-muted-foreground">Total: {count || 0}</div>
        </div>

        <UsersSearch />

        <UsersTable users={users || []} />
      </main>
    </div>
  )
}
