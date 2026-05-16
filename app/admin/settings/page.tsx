import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { PlatformSettingsManager } from "@/components/admin/platform-settings-manager"

export default async function PlatformSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is super admin (only super admins can modify settings)
  const { data: systemRoles } = await supabase
    .from("user_system_roles")
    .select(`
      system_roles (
        name
      )
    `)
    .eq("user_id", user.id)

  const isSuperAdmin = systemRoles?.some((role: any) => role.system_roles?.name === "super_admin")

  if (!isSuperAdmin) {
    redirect("/admin")
  }

  // Fetch all platform settings
  const { data: settings } = await supabase.from("platform_settings").select("*").order("key")

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
          <p className="text-muted-foreground">Manage global platform configuration (Super Admin Only)</p>
        </div>

        <PlatformSettingsManager initialSettings={settings || []} />
      </main>
    </div>
  )
}
