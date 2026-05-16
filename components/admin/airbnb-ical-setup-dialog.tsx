"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface AirbnbIcalSetupDialogProps {
  propertyId: string
  propertyName: string
  airbnbListingId: string | null
}

export function AirbnbIcalSetupDialog({ propertyId, propertyName, airbnbListingId }: AirbnbIcalSetupDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [icalUrl, setIcalUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/properties/update-ical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, icalUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update iCal URL")
      }

      toast({
        title: "Success",
        description: "Calendar sync enabled! You can now sync your Airbnb bookings.",
      })
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update iCal URL",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-transparent">
          <Calendar className="mr-2 h-4 w-4" />
          Setup Calendar Sync
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Setup Airbnb Calendar Sync for {propertyName}</DialogTitle>
          <DialogDescription>Connect your Airbnb calendar to automatically create cleaning jobs</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">How to get your Airbnb iCal URL:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                  <li>Go to your Airbnb listing calendar</li>
                  <li>Click "Availability settings" → "Calendar sync"</li>
                  <li>Click "Export calendar"</li>
                  <li>Copy the calendar link (starts with https://www.airbnb.com/calendar/ical/)</li>
                  <li>Paste it below</li>
                </ol>
                {airbnbListingId && (
                  <Button type="button" variant="outline" size="sm" className="mt-2 bg-transparent" asChild>
                    <a
                      href={`https://www.airbnb.com/hosting/listings/${airbnbListingId}/calendar`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Airbnb Calendar <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="icalUrl">Airbnb iCal Export URL</Label>
            <Input
              id="icalUrl"
              type="url"
              placeholder="https://www.airbnb.com/calendar/ical/1234567890.ics?s=..."
              value={icalUrl}
              onChange={(e) => setIcalUrl(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Example: https://www.airbnb.com/calendar/ical/1486370809660330220.ics?s=33301f44e4862ba...
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !icalUrl}>
              {isLoading ? "Saving..." : "Enable Calendar Sync"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
