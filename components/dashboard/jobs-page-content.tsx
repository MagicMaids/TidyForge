"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Clock, MapPin, User, DollarSign, Eye } from "lucide-react"
import { format, parseISO, isToday, isThisMonth, isFuture, startOfDay } from "date-fns"

interface Job {
  id: string
  scheduled_date: string
  scheduled_time: string | null
  check_in_date: string | null
  check_out_date: string | null
  guest_name: string | null
  status: string
  job_type: string
  total_price: number | null
  properties: { name: string; address: string }
  clients: { name: string } | null
  assigned_cleaner: { full_name: string } | null
}

const statusColors = {
  pending: "bg-orange-500/10 text-orange-700 border-orange-200",
  assigned: "bg-blue-500/10 text-blue-700 border-blue-200",
  in_progress: "bg-purple-500/10 text-purple-700 border-purple-200",
  completed: "bg-green-500/10 text-green-700 border-green-200",
  verified: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
}

export function JobsPageContent({ companyId, userRole }: { companyId: string; userRole: string }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchJobs() {
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from("jobs")
        .select(
          `
          id,
          scheduled_date,
          scheduled_time,
          check_in_date,
          check_out_date,
          guest_name,
          status,
          job_type,
          total_price,
          properties (name, address),
          clients!left (name),
          assigned_cleaner:users!assigned_cleaner_id (full_name)
        `,
        )
        .eq("company_id", companyId)
        .order("scheduled_date", { ascending: true })

      setJobs(data || [])
      setLoading(false)
    }

    fetchJobs()
  }, [companyId])

  const todayJobs = jobs.filter((job) => isToday(parseISO(job.scheduled_date)))
  const thisMonthJobs = jobs.filter(
    (job) => isThisMonth(parseISO(job.scheduled_date)) && !isToday(parseISO(job.scheduled_date)),
  )
  const upcomingJobs = jobs.filter(
    (job) => isFuture(startOfDay(parseISO(job.scheduled_date))) && !isThisMonth(parseISO(job.scheduled_date)),
  )

  if (loading) {
    return (
      <main className="flex-1 px-6 py-8">
        <div className="text-center py-12 text-muted-foreground">Loading jobs...</div>
      </main>
    )
  }

  return (
    <main className="flex-1 px-6 py-8 bg-muted/30">
      <div className="mx-auto max-w-[1600px] space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-balance">Job Management</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Track and manage all cleaning jobs across your properties
            </p>
          </div>
          <Button size="lg" className="gap-2 shadow-lg">
            <Plus className="h-5 w-5" />
            Create Job
          </Button>
        </div>

        {/* Today's Jobs */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Today's Jobs</h2>
              <p className="text-sm text-muted-foreground">
                {todayJobs.length} {todayJobs.length === 1 ? "job" : "jobs"} scheduled for today
              </p>
            </div>
          </div>

          {todayJobs.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No jobs scheduled for today</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todayJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>

        {/* This Month's Jobs */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">This Month</h2>
              <p className="text-sm text-muted-foreground">
                {thisMonthJobs.length} {thisMonthJobs.length === 1 ? "job" : "jobs"} scheduled this month
              </p>
            </div>
          </div>

          {thisMonthJobs.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No other jobs scheduled for this month</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {thisMonthJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Jobs */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Upcoming Jobs</h2>
              <p className="text-sm text-muted-foreground">
                {upcomingJobs.length} {upcomingJobs.length === 1 ? "job" : "jobs"} scheduled in future months
              </p>
            </div>
          </div>

          {upcomingJobs.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No upcoming jobs beyond this month</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function JobCard({ job }: { job: Job }) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-primary">
      <div className="space-y-4">
        {/* Status and Price */}
        <div className="flex items-start justify-between">
          <Badge variant="secondary" className={statusColors[job.status as keyof typeof statusColors]}>
            {job.status.replace("_", " ")}
          </Badge>
          {job.total_price && (
            <div className="flex items-center gap-1 font-semibold text-lg">
              <DollarSign className="h-4 w-4" />
              {job.total_price.toFixed(2)}
            </div>
          )}
        </div>

        {/* Property Name */}
        <div>
          <h3 className="font-semibold text-lg text-balance">{job.properties.name}</h3>
          <div className="flex items-start gap-2 mt-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="text-balance">{job.properties.address}</span>
          </div>
        </div>

        {/* Date and Time */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{format(parseISO(job.scheduled_date), "EEEE, MMM dd, yyyy")}</span>
          </div>
          {job.scheduled_time && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{job.scheduled_time}</span>
            </div>
          )}
        </div>

        {/* Guest/Client Info */}
        {(job.guest_name || job.clients?.name) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{job.guest_name || job.clients?.name || "Direct Booking"}</span>
          </div>
        )}

        {/* Assigned Cleaner */}
        <div className="pt-3 border-t flex items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Assigned to: </span>
            <span className="font-medium">{job.assigned_cleaner?.full_name || "Unassigned"}</span>
          </div>
          <Button variant="ghost" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            View
          </Button>
        </div>
      </div>
    </Card>
  )
}
