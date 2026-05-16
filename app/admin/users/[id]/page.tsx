import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Building2, Calendar, Shield } from "lucide-react"
import Link from "next/link"

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user details
  const { data: targetUser } = await supabase
    .from("users")
    .select(
      `
      *,
      companies (
        id,
        name,
        subscription_status
      )
    `,
    )
    .eq("id", params.id)
    .single()

  if (!targetUser) {
    notFound()
  }

  // Fetch user's system roles
  const { data: systemRoles } = await supabase
    .from("user_system_roles")
    .select(
      `
      granted_at,
      expires_at,
      system_roles (
        name,
        description
      )
    `,
    )
    .eq("user_id", params.id)

  // Fetch user activity (jobs assigned)
  const { data: jobs, count: jobCount } = await supabase
    .from("jobs")
    .select("id, status, scheduled_date", { count: "exact" })
    .eq("assigned_cleaner_id", params.id)
    .order("scheduled_date", { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">
                  ← Back
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">{targetUser.email}</h1>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                {targetUser.role || "member"}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">User ID: {targetUser.id}</p>
          </div>
        </div>

        {/* User Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{targetUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <Link
                    href={`/admin/companies/${targetUser.companies.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {targetUser.companies?.name}
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{new Date(targetUser.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
              <CardDescription>Platform administration access</CardDescription>
            </CardHeader>
            <CardContent>
              {!systemRoles || systemRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No system roles assigned</p>
              ) : (
                <div className="space-y-3">
                  {systemRoles.map((roleAssignment: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Shield className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{roleAssignment.system_roles?.name}</p>
                        <p className="text-xs text-muted-foreground">{roleAssignment.system_roles?.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Granted: {new Date(roleAssignment.granted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Jobs assigned to this user (Total: {jobCount || 0})</CardDescription>
          </CardHeader>
          <CardContent>
            {!jobs || jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {jobs.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">Job #{job.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">Status: {job.status}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(job.scheduled_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
