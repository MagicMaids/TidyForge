"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns"

interface Job {
  id: string
  scheduled_date: string
  status: string
  job_type: string
  properties: { name: string }
}

const statusColors = {
  pending: "bg-yellow-500",
  assigned: "bg-blue-500",
  in_progress: "bg-purple-500",
  completed: "bg-green-500",
  verified: "bg-emerald-500",
}

export function JobsCalendar({ companyId, userRole }: { companyId: string; userRole: string }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchJobs() {
      const supabase = createBrowserClient()
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)

      const { data } = await supabase
        .from("jobs")
        .select(
          `
          id,
          scheduled_date,
          status,
          job_type,
          properties (name)
        `,
        )
        .eq("company_id", companyId)
        .gte("scheduled_date", start.toISOString())
        .lte("scheduled_date", end.toISOString())
        .order("scheduled_date", { ascending: true })

      setJobs(data || [])
      setLoading(false)
    }

    fetchJobs()
  }, [companyId, currentDate])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getJobsForDay = (day: Date) => {
    return jobs.filter((job) => isSameDay(new Date(job.scheduled_date), day))
  }

  return (
    <Card className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{format(currentDate, "MMMM yyyy")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {daysInMonth.map((day) => {
          const dayJobs = getJobsForDay(day)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[120px] border rounded-lg p-2 ${
                isToday ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>{format(day, "d")}</div>
              <div className="space-y-1">
                {dayJobs.slice(0, 3).map((job) => (
                  <div
                    key={job.id}
                    className="text-xs p-1 rounded bg-card border border-border hover:bg-accent cursor-pointer truncate"
                  >
                    <div
                      className={`w-2 h-2 rounded-full inline-block mr-1 ${statusColors[job.status as keyof typeof statusColors]}`}
                    />
                    {job.properties.name}
                  </div>
                ))}
                {dayJobs.length > 3 && <div className="text-xs text-muted-foreground">+{dayJobs.length - 3} more</div>}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
