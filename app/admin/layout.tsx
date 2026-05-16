import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

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
    ["super_admin", "platform_admin", "support", "developer", "analyst"].includes(role.system_roles?.name),
  )

  if (!hasAdminRole) {
    redirect("/dashboard")
  }

  return <>{children}</>
}
