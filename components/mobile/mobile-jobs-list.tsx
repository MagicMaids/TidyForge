"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Key, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { JobDetailsSheet } from "./job-details-sheet"

interface Job {
  id: string
  property_id: string
  scheduled_date: string
  scheduled_time: string
  status: string
  job_type: string
  properties: {
    name: string
    address: string
    access_code: string | null
    access_instructions: string | null
  }
}

export function MobileJobsList({
  companyId,
  userId,
  userName,
}: {
  companyId: string
  userId: string
  userName: string
}) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  async function fetchJobs() {
    const supabase = createBrowserClient()

    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        id,
        property_id,
        scheduled_date,
        scheduled_time,
        status,
        job_type,
        properties (name, address, access_code, access_instructions)
      `,
      )
      .eq("company_id", companyId)
      .eq("assigned_to", userId)
      .in("status", ["scheduled", "in_progress"])
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true })

    if (!error && data) {
      setJobs(data as Job[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchJobs()
  }, [companyId, userId])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-500 text-white",
      in_progress: "bg-yellow-500 text-white",
    }
    return colors[status] || "bg-gray-500 text-white"
  }

  const isToday = (dateString: string) => {
    const today = new Date()
    const jobDate = new Date(dateString)
    return (
      jobDate.getDate() === today.getDate() &&
      jobDate.getMonth() === today.getMonth() &&
      jobDate.getFullYear() === today.getFullYear()
    )
  }

  const todayJobs = jobs.filter((job) => isToday(job.scheduled_date))
  const upcomingJobs = jobs.filter((job) => !isToday(job.scheduled_date))

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background">
          <div className="container flex h-16 items-center px-4">
            <div className="flex items-center gap-3">
              <div className="font-bold text-xl">TidyForge</div>
            </div>
          </div>
        </header>
        <main className="container px-4 py-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
        <div className="container flex h-16 items-center px-4">
          <div className="flex flex-col flex-1">
            <div className="font-bold text-lg">TidyForge</div>
            <div className="text-xs text-muted-foreground">{userName}</div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {jobs.length} active jobs
          </Badge>
        </div>
      </header>

      <main className="container px-4 py-6 pb-20">
        {jobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs assigned</h3>
              <p className="text-sm text-muted-foreground">You don't have any active jobs at the moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {todayJobs.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Today</h2>
                <div className="space-y-3">
                  {todayJobs.map((job) => (
                    <Card
                      key={job.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedJob(job)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base font-semibold leading-tight">{job.properties.name}</CardTitle>
                          <Badge className={getStatusColor(job.status)} variant="secondary">
                            {job.status === "in_progress" ? "In Progress" : "Scheduled"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pb-4">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{job.properties.address}</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{job.scheduled_time}</span>
                          </div>
                          <div className="text-muted-foreground capitalize">{job.job_type.replace("_", " ")}</div>
                        </div>

                        {job.properties.access_code && (
                          <div className="flex items-center gap-2 text-sm pt-2 border-t">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Access code available</span>
                          </div>
                        )}

                        <div className="flex items-center justify-end pt-2">
                          <Button variant="ghost" size="sm" className="gap-1">
                            View Details
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {upcomingJobs.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Upcoming</h2>
                <div className="space-y-3">
                  {upcomingJobs.map((job) => (
                    <Card
                      key={job.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedJob(job)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base font-semibold leading-tight">{job.properties.name}</CardTitle>
                          <Badge variant="outline" className="shrink-0">
                            {format(new Date(job.scheduled_date), "MMM d")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pb-4">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{job.properties.address}</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{job.scheduled_time}</span>
                          </div>
                          <div className="text-muted-foreground capitalize">{job.job_type.replace("_", " ")}</div>
                        </div>

                        <div className="flex items-center justify-end pt-2">
                          <Button variant="ghost" size="sm" className="gap-1">
                            View Details
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedJob && (
        <JobDetailsSheet
          job={selectedJob}
          open={!!selectedJob}
          onOpenChange={() => setSelectedJob(null)}
          onJobUpdated={fetchJobs}
        />
      )}
    </div>
  )
}
