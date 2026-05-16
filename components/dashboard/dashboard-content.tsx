"use client"

import { useState } from "react"
import { RecentJobs } from "@/components/dashboard/recent-jobs"
import { UpcomingSchedule } from "@/components/dashboard/upcoming-schedule"

export function DashboardContent({ companyId, userRole }: { companyId: string; userRole: string }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Expose refresh function globally for calendar sync
  if (typeof window !== "undefined") {
    ;(window as any).__refreshDashboard = () => {
      setRefreshTrigger((prev) => prev + 1)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Recent Jobs */}
      <RecentJobs companyId={companyId} userRole={userRole} refreshTrigger={refreshTrigger} />

      {/* Upcoming Schedule */}
      <UpcomingSchedule companyId={companyId} refreshTrigger={refreshTrigger} />
    </div>
  )
}
