import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { AuditLogTable } from "@/components/admin/audit-log-table"
import { AuditLogFilters } from "@/components/admin/audit-log-filters"

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { action?: string; dateFrom?: string; dateTo?: string; adminEmail?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Build query
  let query = supabase.from("platform_audit_log").select(
    `
      id,
      action,
      resource_type,
      resource_id,
      previous_value,
      new_value,
      created_at,
      ip_address,
      users!platform_audit_log_admin_user_id_fkey (
        email
      ),
      companies (
        name
      )
    `,
    { count: "exact" },
  )

  // Apply filters
  if (searchParams.action) {
    query = query.ilike("action", `%${searchParams.action}%`)
  }

  if (searchParams.dateFrom) {
    query = query.gte("created_at", searchParams.dateFrom)
  }

  if (searchParams.dateTo) {
    query = query.lte("created_at", searchParams.dateTo)
  }

  const { data: logs, count } = await query.order("created_at", { ascending: false }).limit(100)

  // Filter by admin email if provided (client-side filter since we can't do nested filters easily)
  let filteredLogs = logs || []
  if (searchParams.adminEmail) {
    filteredLogs = filteredLogs.filter((log: any) =>
      log.users?.email?.toLowerCase().includes(searchParams.adminEmail!.toLowerCase()),
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">Complete history of platform administration actions</p>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {count || 0} total
          </div>
        </div>

        <AuditLogFilters />

        <AuditLogTable logs={filteredLogs} />
      </main>
    </div>
  )
}
