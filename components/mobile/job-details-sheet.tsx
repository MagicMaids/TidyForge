"use client"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, MapPin, Clock, Key, FileText, CheckCircle2, PlayCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

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

export function JobDetailsSheet({
  job,
  open,
  onOpenChange,
  onJobUpdated,
}: {
  job: Job
  open: boolean
  onOpenChange: (open: boolean) => void
  onJobUpdated: () => void
}) {
  const [updating, setUpdating] = useState(false)

  async function updateJobStatus(newStatus: string) {
    setUpdating(true)
    const supabase = createBrowserClient()

    const updateData: { status: string; started_at?: string; completed_at?: string } = { status: newStatus }

    if (newStatus === "in_progress") {
      updateData.started_at = new Date().toISOString()
    } else if (newStatus === "completed") {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase.from("jobs").update(updateData).eq("id", job.id)

    setUpdating(false)

    if (error) {
      toast.error("Failed to update job status")
      console.error(error)
      return
    }

    const statusMessages: Record<string, string> = {
      in_progress: "Job started",
      completed: "Job completed",
      cancelled: "Job cancelled",
    }

    toast.success(statusMessages[newStatus] || "Job updated")
    onOpenChange(false)
    onJobUpdated()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      in_progress: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      completed: "bg-green-500/10 text-green-700 dark:text-green-400",
      cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
    }
    return colors[status] || "bg-gray-500/10 text-gray-700"
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left pb-6">
          <SheetTitle className="text-xl">{job.properties.name}</SheetTitle>
          <SheetDescription>Job details and property information</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className={getStatusColor(job.status)}>
              {job.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium mb-1">Address</p>
                <p className="text-sm text-muted-foreground">{job.properties.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium mb-1">Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(job.scheduled_date), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium mb-1">Time</p>
                <p className="text-sm text-muted-foreground">{job.scheduled_time}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium mb-1">Job Type</p>
                <p className="text-sm text-muted-foreground capitalize">{job.job_type.replace("_", " ")}</p>
              </div>
            </div>
          </div>

          <Separator />

          {job.properties.access_code && (
            <>
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <Key className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-3">Access Code</p>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <p className="text-3xl font-mono font-bold tracking-wider">{job.properties.access_code}</p>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {job.properties.access_instructions && (
            <>
              <div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-2">Access Instructions</p>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{job.properties.access_instructions}</p>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          <div className="space-y-3 pt-4">
            {job.status === "scheduled" && (
              <Button
                className="w-full h-12 text-base gap-2"
                onClick={() => updateJobStatus("in_progress")}
                disabled={updating}
              >
                <PlayCircle className="h-5 w-5" />
                {updating ? "Starting..." : "Start Job"}
              </Button>
            )}

            {job.status === "in_progress" && (
              <>
                <Button
                  className="w-full h-12 text-base gap-2"
                  onClick={() => updateJobStatus("completed")}
                  disabled={updating}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {updating ? "Completing..." : "Complete Job"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 text-base gap-2 bg-transparent"
                  onClick={() => updateJobStatus("cancelled")}
                  disabled={updating}
                >
                  <XCircle className="h-5 w-5" />
                  Cancel Job
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
