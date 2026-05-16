"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { syncPropertyCalendar } from "@/lib/actions/calendar-sync-actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface PropertyCalendarSyncButtonProps {
  propertyId: string
}

export function PropertyCalendarSyncButton({ propertyId }: PropertyCalendarSyncButtonProps) {
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSync = async () => {
    setSyncing(true)

    try {
      const result = await syncPropertyCalendar(propertyId)

      if (result.success) {
        toast({
          title: "Calendar Synced",
          description: `Found ${result.eventsFound} reservations. Created ${result.jobsCreated} new jobs, updated ${result.jobsUpdated} jobs.`,
        })

        router.refresh()

        if (typeof window !== "undefined" && (window as any).__refreshDashboard) {
          ;(window as any).__refreshDashboard()
        }
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
    <Button onClick={handleSync} disabled={syncing} size="sm" className="w-full">
      <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing..." : "Sync Calendar Now"}
    </Button>
  )
}
