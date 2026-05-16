import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { FeatureFlagsTable } from "@/components/admin/feature-flags-table"
import { CreateFeatureFlagDialog } from "@/components/admin/create-feature-flag-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function FeatureFlagsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has developer or admin role
  const { data: systemRoles } = await supabase
    .from("user_system_roles")
    .select(`
      system_roles (
        name
      )
    `)
    .eq("user_id", user.id)

  const hasPermission = systemRoles?.some((role: any) =>
    ["super_admin", "platform_admin", "developer"].includes(role.system_roles?.name),
  )

  if (!hasPermission) {
    redirect("/dashboard")
  }

  // Fetch all feature flags
  const { data: flags } = await supabase.from("feature_flags").select("*").order("created_at", { ascending: false })

  // Fetch all companies for the enabled_for_companies dropdown
  const { data: companies } = await supabase.from("companies").select("id, name").order("name")

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
            <p className="text-muted-foreground">Control feature rollout across the platform</p>
          </div>
          <CreateFeatureFlagDialog companies={companies || []}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Flag
            </Button>
          </CreateFeatureFlagDialog>
        </div>

        <FeatureFlagsTable flags={flags || []} companies={companies || []} />
      </main>
    </div>
  )
}
