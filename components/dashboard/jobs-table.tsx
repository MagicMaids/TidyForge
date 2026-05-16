"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2 } from "lucide-react"
import { format, parseISO } from "date-fns"

interface Job {
  id: string
  scheduled_date: string
  scheduled_time: string
  status: string
  job_type: string
  total_price: number
  properties: { name: string; address: string }
  assigned_cleaner: { full_name: string } | null
}

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  assigned: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  in_progress: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  verified: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
}

export function JobsTable({
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
          scheduled_date,
          scheduled_time,
          status,
          job_type,
          total_price,
          properties (name, address),
          assigned_cleaner:users!assigned_cleaner_id (full_name)
        `,
        )
        .eq("company_id", companyId)
        .order("scheduled_date", { ascending: true })
        .limit(50)

      setJobs(data || [])
      setLoading(false)
    }

    fetchJobs()
  }, [companyId, refreshTrigger])

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading jobs...</div>
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No jobs found. Create your first job to get started.
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>
                <div className="font-medium">{format(parseISO(job.scheduled_date), "MMM dd, yyyy")}</div>
                {job.scheduled_time && <div className="text-sm text-muted-foreground">{job.scheduled_time}</div>}
              </TableCell>
              <TableCell>
                <div className="font-medium">{job.properties.name}</div>
                <div className="text-sm text-muted-foreground">{job.properties.address}</div>
              </TableCell>
              <TableCell className="capitalize">{job.job_type.replace("_", " ")}</TableCell>
              <TableCell>{job.assigned_cleaner?.full_name || "Unassigned"}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[job.status as keyof typeof statusColors]}>
                  {job.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">${job.total_price?.toFixed(2) || "0.00"}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {userRole === "admin" && (
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
