"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, addDays, parseISO } from "date-fns"

interface ScheduleItem {
  date: string
  count: number
}

export function UpcomingSchedule({ companyId, refreshTrigger }: { companyId: string; refreshTrigger?: number }) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSchedule() {
      const supabase = createBrowserClient()
      const today = new Date()
      const next7Days = Array.from({ length: 7 }, (_, i) => format(addDays(today, i), "yyyy-MM-dd"))

      const { data } = await supabase
        .from("jobs")
        .select("scheduled_date")
        .eq("company_id", companyId)
        .in("scheduled_date", next7Days)

      const scheduleCounts = next7Days.map((date) => ({
        date,
        count: data?.filter((job) => job.scheduled_date === date).length || 0,
      }))

      setSchedule(scheduleCounts)
      setLoading(false)
    }

    fetchSchedule()
  }, [companyId, refreshTrigger])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  const maxCount = Math.max(...schedule.map((s) => s.count), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedule.map((item) => (
            <div key={item.date} className="flex items-center gap-4">
              <div className="w-24 text-sm">
                <p className="font-medium">{format(parseISO(item.date), "EEE")}</p>
                <p className="text-muted-foreground text-xs">{format(parseISO(item.date), "MMM d")}</p>
              </div>
              <div className="flex-1">
                <div className="h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-primary/50 transition-all"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-12 text-right">
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
