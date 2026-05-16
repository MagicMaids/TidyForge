"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, User, Clock } from "lucide-react"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Job {
  id: string
  property_id: string
  scheduled_date: string
  scheduled_time: string
  status: string
  job_type: string
  assigned_cleaner_id: string | null
  properties: {
    name: string
    address: string
  }
  assigned_cleaner: {
    full_name: string
  } | null
}

export function RecentJobs({
  companyId,
  userRole,
  refreshTrigger,
}: { companyId: string; userRole: string; refreshTrigger?: number }) {
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
        property_id,
        scheduled_date,
        scheduled_time,
        status,
        job_type,
        assigned_cleaner_id,
        properties (name, address),
        assigned_cleaner:users!assigned_cleaner_id (full_name)
      `,
        )
        .eq("company_id", companyId)
        .order("scheduled_date", { ascending: true })
        .limit(5)

      if (data) {
        setJobs(data as Job[])
      }
      setLoading(false)
    }

    fetchJobs()
  }, [companyId, refreshTrigger])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      in_progress: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      completed: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
      pending: "bg-gray-500/10 text-gray-500",
    }
    return colors[status] || "bg-gray-500/10 text-gray-500"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Jobs</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard?tab=jobs">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No jobs scheduled yet</div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{job.properties.name}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{job.properties.address}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(job.status)}>
                    {job.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(parseISO(job.scheduled_date), "MMM d")} at {job.scheduled_time}
                    </span>
                  </div>
                  {job.assigned_cleaner && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{job.assigned_cleaner.full_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
