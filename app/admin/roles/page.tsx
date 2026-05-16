import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { RolesOverview } from "@/components/admin/roles-overview"
import { RoleAssignments } from "@/components/admin/role-assignments"
import { GrantRoleDialog } from "@/components/admin/grant-role-dialog"

export default async function RolesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is super admin (only super admins can manage roles)
  const { data: userRoles } = await supabase
    .from("user_system_roles")
    .select(
      `
      system_roles (
        name
      )
    `,
    )
    .eq("user_id", user.id)

  const isSuperAdmin = userRoles?.some((role: any) => role.system_roles?.name === "super_admin")

  if (!isSuperAdmin) {
    redirect("/admin")
  }

  // Fetch all system roles
  const { data: systemRoles } = await supabase.from("system_roles").select("*").order("name")

  // Fetch all role assignments with user details
  const { data: roleAssignments } = await supabase
    .from("user_system_roles")
    .select(
      `
      id,
      user_id,
      granted_at,
      expires_at,
      granted_by,
      users!user_system_roles_user_id_fkey (
        email,
        companies (
          name
        )
      ),
      system_roles (
        id,
        name,
        description
      ),
      granted_by_user:users!user_system_roles_granted_by_fkey (
        email
      )
    `,
    )
    .order("granted_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Roles</h1>
            <p className="text-muted-foreground">Manage platform administration roles and permissions</p>
          </div>
          <GrantRoleDialog systemRoles={systemRoles || []} />
        </div>

        <RolesOverview roles={systemRoles || []} />

        <RoleAssignments assignments={roleAssignments || []} />
      </main>
    </div>
  )
}
