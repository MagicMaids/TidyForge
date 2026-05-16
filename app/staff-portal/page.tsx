import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StaffPortalHeader } from "@/components/staff-portal/staff-portal-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Building2, Calendar, CheckCircle2, Clock, MapPin } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function StaffPortalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get staff user profile
  const { data: staffUser } = await supabase
    .from("users")
    .select("*, companies(name, phone, email)")
    .eq("id", user.id)
    .maybeSingle()

  if (!staffUser || staffUser.account_type !== "company_staff") {
    redirect("/onboarding/staff")
  }

  // If no company affiliation, show company search page
  if (!staffUser.company_id) {
    // Check for pending join requests
    const { data: pendingRequests } = await supabase
      .from("staff_join_requests")
      .select("*, companies(name, email)")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    return (
      <div className="flex min-h-screen flex-col bg-background">
        <StaffPortalHeader staffName={staffUser.full_name} staffEmail={staffUser.email} />

        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-[1200px] space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome to TidyForge</h1>
              <p className="text-muted-foreground mt-1">Find a company to join and start working</p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need to join a company to start receiving job assignments. Search for companies below or ask your
                employer for an invite code.
              </AlertDescription>
            </Alert>

            {pendingRequests && pendingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Requests</CardTitle>
                  <CardDescription>Your join requests awaiting approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRequests.map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{request.companies.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Requested {new Date(request.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Find a Company</CardTitle>
                <CardDescription>Search for cleaning companies to join</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/staff-portal/find-company">
                  <Button className="w-full" size="lg">
                    <Building2 className="mr-2 h-5 w-5" />
                    Browse Companies
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // Staff member with company - show full dashboard
  const companyName = staffUser.companies?.name || "Unknown Company"

  // Get assigned jobs
  const { data: assignedJobs } = await supabase
    .from("jobs")
    .select(
      `
      id,
      scheduled_date,
      scheduled_time,
      status,
      job_type,
      check_in_time,
      check_out_time,
      properties(name, address, city, state)
    `,
    )
    .eq("assigned_cleaner_id", user.id)
    .gte("scheduled_date", new Date().toISOString().split("T")[0])
    .order("scheduled_date")
    .order("scheduled_time")
    .limit(10)

  // Get today's jobs
  const todayDate = new Date().toISOString().split("T")[0]
  const { data: todayJobs } = await supabase
    .from("jobs")
    .select(
      `
      id,
      scheduled_date,
      scheduled_time,
      status,
      job_type,
      check_in_time,
      properties(name, address)
    `,
    )
    .eq("assigned_cleaner_id", user.id)
    .eq("scheduled_date", todayDate)
    .order("scheduled_time")

  // Get job counts
  const { count: todayCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("assigned_cleaner_id", user.id)
    .eq("scheduled_date", todayDate)

  const { count: upcomingCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("assigned_cleaner_id", user.id)
    .gt("scheduled_date", todayDate)

  const { count: completedThisWeek } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("assigned_cleaner_id", user.id)
    .eq("status", "completed")
    .gte("scheduled_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const { count: inProgressCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("assigned_cleaner_id", user.id)
    .eq("status", "in_progress")

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StaffPortalHeader
        staffName={staffUser.full_name}
        staffEmail={staffUser.email}
        companyName={companyName}
        role={staffUser.role}
      />

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-[1600px] space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {staffUser.full_name.split(" ")[0]}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Jobs</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Scheduled for today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Future assignments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently working</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed This Week</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedThisWeek || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Jobs completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Today's Jobs */}
          {todayJobs && todayJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Your jobs for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/staff-portal/jobs/${job.id}`}
                      className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={
                                job.status === "in_progress"
                                  ? "default"
                                  : job.status === "completed"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {job.status}
                            </Badge>
                            <span className="text-sm font-medium capitalize">{job.job_type}</span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                            <MapPin className="h-3 w-3" />
                            {job.properties.name} - {job.properties.address}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {job.scheduled_time || "Time TBD"}
                            {job.check_in_time &&
                              ` • Checked in at ${new Date(job.check_in_time).toLocaleTimeString()}`}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Jobs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Assignments</CardTitle>
                <CardDescription>Your scheduled jobs</CardDescription>
              </div>
              <Link href="/staff-portal/jobs">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignedJobs?.slice(0, 5).map((job) => (
                  <Link
                    key={job.id}
                    href={`/staff-portal/jobs/${job.id}`}
                    className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{job.status}</Badge>
                          <span className="text-sm font-medium capitalize">{job.job_type}</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                          <MapPin className="h-3 w-3" />
                          {job.properties.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {job.properties.address}, {job.properties.city}, {job.properties.state}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(job.scheduled_date).toLocaleDateString()} at {job.scheduled_time || "TBD"}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {(!assignedJobs || assignedJobs.length === 0) && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No upcoming jobs assigned</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
