"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Plus,
  Clock,
  MapPin,
  User,
  Edit,
  Trash2,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, isSameDay, addMonths, subMonths, addDays, subDays, isToday, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

interface Job {
  id: string
  scheduled_date: string
  scheduled_time: string | null
  status: string
  job_type: string
  priority: string
  assigned_cleaner_id: string | null
  properties: { name: string; address: string }
  clients: { name: string } | null
  assigned_cleaner: { full_name: string } | null
}

const statusColors = {
  pending: "bg-yellow-500",
  assigned: "bg-blue-500",
  in_progress: "bg-purple-500",
  completed: "bg-green-500",
  verified: "bg-emerald-500",
}

const statusLabels = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  verified: "Verified",
}

const priorityColors = {
  urgent: "destructive",
  high: "default",
  normal: "secondary",
  low: "outline",
}

export function DayFocusedCalendar({
  companyId,
  userRole,
  refreshTrigger,
}: { companyId: string; userRole: string; refreshTrigger?: number }) {
  const [focusedDate, setFocusedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchJobs() {
      const supabase = createBrowserClient()
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

      console.log("[v0] Fetching jobs for calendar, company:", companyId, "month:", format(currentMonth, "MMMM yyyy"))

      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
          id,
          scheduled_date,
          scheduled_time,
          status,
          job_type,
          priority,
          assigned_cleaner_id,
          properties (name, address),
          clients!left (name),
          assigned_cleaner:users!assigned_cleaner_id (full_name)
        `,
        )
        .eq("company_id", companyId)
        .gte("scheduled_date", format(start, "yyyy-MM-dd"))
        .lte("scheduled_date", format(end, "yyyy-MM-dd"))
        .order("scheduled_time", { ascending: true, nullsFirst: false })

      console.log("[v0] Calendar jobs fetched:", data?.length || 0, "jobs")
      if (error) console.error("[v0] Calendar jobs error:", error)

      setJobs(data || [])
      setLoading(false)
    }

    fetchJobs()
  }, [companyId, currentMonth, refreshTrigger])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay() // 0 = Sunday, 1 = Monday, etc.
  const daysInMonth = []

  for (let day = 1; day <= lastDay.getDate(); day++) {
    daysInMonth.push(new Date(year, month, day))
  }

  const getJobsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd")
    const matchingJobs = jobs.filter((job) => {
      const matches = job.scheduled_date === dayStr
      return matches
    })

    return matchingJobs
  }

  const focusedDayJobs = getJobsForDay(focusedDate)

  const handlePreviousDay = () => {
    const newDate = subDays(focusedDate, 1)
    setFocusedDate(newDate)
    if (newDate.getMonth() !== currentMonth.getMonth()) {
      setCurrentMonth(newDate)
    }
  }

  const handleNextDay = () => {
    const newDate = addDays(focusedDate, 1)
    setFocusedDate(newDate)
    if (newDate.getMonth() !== currentMonth.getMonth()) {
      setCurrentMonth(newDate)
    }
  }

  const handleDayClick = (day: Date) => {
    setFocusedDate(day)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-2 border-primary/20">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handlePreviousDay} title="Previous Day">
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-3">
                <CalendarIcon className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-3xl font-bold">{format(focusedDate, "EEEE, MMMM d, yyyy")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {isToday(focusedDate) ? "Today" : format(focusedDate, "EEEE")}
                  </p>
                </div>
              </div>

              <Button variant="outline" size="icon" onClick={handleNextDay} title="Next Day">
                <ChevronRight className="h-4 w-4" />
              </Button>

              {!isToday(focusedDate) && (
                <Button variant="outline" onClick={() => setFocusedDate(new Date())}>
                  Jump to Today
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Job
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {focusedDayJobs.length} {focusedDayJobs.length === 1 ? "Job" : "Jobs"} Scheduled
              </h3>
              <div className="flex items-center gap-2">
                {["pending", "assigned", "in_progress", "completed"].map((status) => {
                  const count = focusedDayJobs.filter((j) => j.status === status).length
                  if (count === 0) return null
                  return (
                    <Badge key={status} variant="outline" className="gap-1">
                      <div className={`w-2 h-2 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
                      {count} {statusLabels[status as keyof typeof statusLabels]}
                    </Badge>
                  )
                })}
              </div>
            </div>

            {focusedDayJobs.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-1">No jobs scheduled</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isToday(focusedDate) ? "No jobs scheduled for today" : "No jobs scheduled for this day"}
                </p>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule a Job
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {focusedDayJobs.map((job) => (
                  <Card key={job.id} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-3 h-3 rounded-full mt-1 ${statusColors[job.status as keyof typeof statusColors]}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                href={`/dashboard/properties/${job.properties.id}`}
                                className="font-semibold hover:underline"
                              >
                                {job.properties.name}
                              </Link>
                              <Badge variant={priorityColors[job.priority as keyof typeof priorityColors] as any}>
                                {job.priority}
                              </Badge>
                              <Badge variant="outline">{job.job_type.replace("_", " ")}</Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {job.scheduled_time ? format(parseISO(job.scheduled_time), "h:mm a") : "Time TBD"}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.properties.address}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {job.assigned_cleaner?.full_name || "Unassigned"}
                              </div>
                            </div>

                            <div className="text-sm">
                              Client: <span className="font-medium">{job.clients?.name || "Direct Booking"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {job.status !== "completed" && job.status !== "verified" && (
                          <Button variant="ghost" size="icon" title="Mark Complete">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Edit Job">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete Job">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
              This Month
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {Array.from({ length: startDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[100px]" />
          ))}

          {daysInMonth.map((day) => {
            const dayJobs = getJobsForDay(day)
            const isTodayDate = isToday(day)
            const isFocused = isSameDay(day, focusedDate)

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`min-h-[100px] border rounded-lg p-2 text-left transition-all hover:border-primary hover:bg-accent/50 ${
                  isFocused ? "border-primary border-2 bg-primary/5 ring-2 ring-primary/20" : "border-border"
                } ${isTodayDate && !isFocused ? "bg-accent" : ""}`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${isTodayDate ? "text-primary font-bold" : ""} ${isFocused ? "text-primary" : ""}`}
                >
                  {day.getDate()}
                  {isTodayDate && <span className="ml-1 text-xs">(Today)</span>}
                </div>
                <div className="space-y-1">
                  {dayJobs.slice(0, 2).map((job) => (
                    <div
                      key={job.id}
                      className="text-xs p-1 rounded bg-background border border-border truncate flex items-center gap-1"
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[job.status as keyof typeof statusColors]}`}
                      />
                      <span className="truncate">{job.properties.name}</span>
                    </div>
                  ))}
                  {dayJobs.length > 2 && (
                    <div className="text-xs text-muted-foreground pl-1">+{dayJobs.length - 2} more</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="font-semibold text-sm">Status Legend:</h3>
          <div className="flex items-center gap-4 flex-wrap">
            {Object.entries(statusLabels).map(([status, label]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
