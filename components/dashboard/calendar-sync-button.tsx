"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { syncAllCompanyCalendars } from "@/lib/actions/calendar-sync-actions"
import { useToast } from "@/hooks/use-toast"

export function CalendarSyncButton({ onSyncComplete }: { onSyncComplete?: () => void }) {
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()

  const handleSync = async () => {
    setSyncing(true)

    try {
      const result = await syncAllCompanyCalendars()

      if (result.success) {
        toast({
          title: "Calendar Sync Complete",
          description: `Synced ${result.propertiesSynced} properties. Created ${result.totalJobsCreated} new jobs, updated ${result.totalJobsUpdated} jobs.`,
        })
        onSyncComplete?.()
      } else {
        toast({
          title: "Sync Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Sync Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={syncing} size="sm" variant="outline">
      <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing..." : "Sync Airbnb Calendars"}
    </Button>
  )
}
