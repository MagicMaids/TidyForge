"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Calendar, MapPin, User } from "lucide-react"
import { format } from "date-fns"
import { CreateJobDialog } from "./create-job-dialog"

interface Job {
  id: string
  property_id: string
  scheduled_date: string
  scheduled_time: string
  status: string
  job_type: string
  assigned_to: string | null
  properties: {
    name: string
    address: string
  }
  users: {
    full_name: string
  } | null
}

export function JobsBoard({ companyId, userRole }: { companyId: string; userRole: string }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

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
        assigned_to,
        properties (name, address),
        users:assigned_to (full_name)
      `,
      )
      .eq("company_id", companyId)
      .order("scheduled_date", { ascending: true })
      .limit(50)

    if (!error && data) {
      setJobs(data as Job[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchJobs()
  }, [companyId])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      in_progress: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      completed: "bg-green-500/10 text-green-700 dark:text-green-400",
      cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
    }
    return colors[status] || "bg-gray-500/10 text-gray-700"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Jobs</CardTitle>
              <CardDescription>Manage and track all cleaning jobs</CardDescription>
            </div>
            {(userRole === "admin" || userRole === "manager") && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Job
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first job to get started</p>
              {(userRole === "admin" || userRole === "manager") && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Job
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">{job.properties.name}</div>
                          <div className="text-sm text-muted-foreground">{job.properties.address}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{format(new Date(job.scheduled_date), "MMM d, yyyy")}</div>
                          <div className="text-sm text-muted-foreground">{job.scheduled_time}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{job.job_type.replace("_", " ")}</TableCell>
                    <TableCell>
                      {job.users ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {job.users.full_name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(job.status)}>
                        {job.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateJobDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        companyId={companyId}
        onJobCreated={fetchJobs}
      />
    </>
  )
}

function ClipboardList({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  )
}
