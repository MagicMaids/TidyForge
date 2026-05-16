import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StaffPortalHeader } from "@/components/staff-portal/staff-portal-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function StaffSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: staffUser } = await supabase.from("users").select("*, companies(name)").eq("id", user.id).maybeSingle()

  if (!staffUser) {
    redirect("/onboarding/staff")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StaffPortalHeader
        staffName={staffUser.full_name}
        staffEmail={staffUser.email}
        companyName={staffUser.companies?.name || undefined}
        role={staffUser.role}
      />

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-[800px] space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account settings</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium">Name</div>
                <div className="text-sm text-muted-foreground">{staffUser.full_name}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Email</div>
                <div className="text-sm text-muted-foreground">{staffUser.email}</div>
              </div>
              {staffUser.phone && (
                <div>
                  <div className="text-sm font-medium">Phone</div>
                  <div className="text-sm text-muted-foreground">{staffUser.phone}</div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium">Role</div>
                <div className="text-sm text-muted-foreground capitalize">{staffUser.role}</div>
              </div>
              {staffUser.companies && (
                <div>
                  <div className="text-sm font-medium">Company</div>
                  <div className="text-sm text-muted-foreground">{staffUser.companies.name}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
