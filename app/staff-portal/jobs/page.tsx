import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StaffPortalHeader } from "@/components/staff-portal/staff-portal-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"
import Link from "next/link"

export default async function StaffJobsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: staffUser } = await supabase.from("users").select("*, companies(name)").eq("id", user.id).maybeSingle()

  if (!staffUser || !staffUser.company_id) {
    redirect("/staff-portal")
  }

  // Get all assigned jobs
  const { data: jobs } = await supabase
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
      properties(name, address, city, state, zip)
    `,
    )
    .eq("assigned_cleaner_id", user.id)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true })

  const todayDate = new Date().toISOString().split("T")[0]
  const todayJobs = jobs?.filter((j) => j.scheduled_date === todayDate) || []
  const upcomingJobs = jobs?.filter((j) => j.scheduled_date > todayDate) || []
  const pastJobs = jobs?.filter((j) => j.scheduled_date < todayDate) || []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StaffPortalHeader
        staffName={staffUser.full_name}
        staffEmail={staffUser.email}
        companyName={staffUser.companies?.name}
        role={staffUser.role}
      />

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-[1600px] space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Jobs</h1>
            <p className="text-muted-foreground mt-1">All your assigned cleaning jobs</p>
          </div>

          {/* Today's Jobs */}
          {todayJobs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Today</h2>
              <div className="grid gap-4">
                {todayJobs.map((job) => (
                  <Link key={job.id} href={`/staff-portal/jobs/${job.id}`}>
                    <Card className="hover:bg-accent transition-colors cursor-pointer">
                      <CardContent className="p-6">
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
                              <span className="font-medium capitalize">{job.job_type}</span>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                              <MapPin className="h-3 w-3" />
                              {job.properties.name}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {job.properties.address}, {job.properties.city}, {job.properties.state}{" "}
                              {job.properties.zip}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {job.scheduled_time || "Time TBD"}
                              {job.check_in_time &&
                                ` • Checked in at ${new Date(job.check_in_time).toLocaleTimeString()}`}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Jobs */}
          {upcomingJobs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Upcoming</h2>
              <div className="grid gap-4">
                {upcomingJobs.map((job) => (
                  <Link key={job.id} href={`/staff-portal/jobs/${job.id}`}>
                    <Card className="hover:bg-accent transition-colors cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{job.status}</Badge>
                              <span className="font-medium capitalize">{job.job_type}</span>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                              <MapPin className="h-3 w-3" />
                              {job.properties.name}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {job.properties.address}, {job.properties.city}, {job.properties.state}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(job.scheduled_date).toLocaleDateString()} at {job.scheduled_time || "TBD"}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Past Jobs */}
          {pastJobs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Past Jobs</h2>
              <div className="grid gap-4">
                {pastJobs.slice(0, 10).map((job) => (
                  <Link key={job.id} href={`/staff-portal/jobs/${job.id}`}>
                    <Card className="hover:bg-accent transition-colors cursor-pointer opacity-75">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">{job.status}</Badge>
                              <span className="font-medium capitalize">{job.job_type}</span>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                              <MapPin className="h-3 w-3" />
                              {job.properties.name}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(job.scheduled_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {jobs && jobs.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No jobs assigned yet</p>
                <p className="text-sm text-muted-foreground">
                  Your manager will assign jobs to you when they become available
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
