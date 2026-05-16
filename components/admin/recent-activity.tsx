import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export async function RecentActivity() {
  const supabase = await createClient()

  // Fetch recent audit logs
  const { data: logs } = await supabase
    .from("platform_audit_log")
    .select(`
      id,
      action,
      created_at,
      users!platform_audit_log_admin_user_id_fkey (
        email
      )
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest platform administration actions</CardDescription>
      </CardHeader>
      <CardContent>
        {!logs || logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log: any) => (
              <div key={log.id} className="flex items-start justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{log.action}</p>
                  <p className="text-xs text-muted-foreground">by {log.users?.email || "System"}</p>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
