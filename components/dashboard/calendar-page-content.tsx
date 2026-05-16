"use client"

import { useState } from "react"
import { DayFocusedCalendar } from "@/components/dashboard/day-focused-calendar"
import { CalendarSyncButton } from "@/components/dashboard/calendar-sync-button"

export function CalendarPageContent({ companyId, userRole }: { companyId: string; userRole: string }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSyncComplete = () => {
    setRefreshTrigger((prev) => prev + 1)
    // Also trigger dashboard refresh if user navigates back
    if (typeof window !== "undefined" && (window as any).__refreshDashboard) {
      ;(window as any).__refreshDashboard()
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage scheduled jobs</p>
        </div>
        <CalendarSyncButton onSyncComplete={handleSyncComplete} />
      </div>

      {/* Calendar */}
      <DayFocusedCalendar companyId={companyId} userRole={userRole} refreshTrigger={refreshTrigger} />
    </>
  )
}
