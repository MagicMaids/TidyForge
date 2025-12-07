"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface Property {
  id: string
  name: string
  address: string
}

interface Cleaner {
  id: string
  full_name: string
}

export function CreateJobDialog({
  open,
  onOpenChange,
  companyId,
  onJobCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  onJobCreated: () => void
}) {
  const [properties, setProperties] = useState<Property[]>([])
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    property_id: "",
    scheduled_date: "",
    scheduled_time: "",
    job_type: "standard",
    assigned_to: "",
  })

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, companyId])

  async function fetchData() {
    const supabase = createBrowserClient()

    const [propertiesResult, cleanersResult] = await Promise.all([
      supabase.from("properties").select("id, name, address").eq("company_id", companyId),
      supabase.from("users").select("id, full_name").eq("company_id", companyId).eq("role", "cleaner"),
    ])

    if (propertiesResult.data) setProperties(propertiesResult.data)
    if (cleanersResult.data) setCleaners(cleanersResult.data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createBrowserClient()

    const { error } = await supabase.from("jobs").insert({
      company_id: companyId,
      property_id: formData.property_id,
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time,
      job_type: formData.job_type,
      assigned_to: formData.assigned_to || null,
      status: "scheduled",
    })

    setLoading(false)

    if (error) {
      toast.error("Failed to create job")
      console.error(error)
      return
    }

    toast.success("Job created successfully")
    onOpenChange(false)
    onJobCreated()

    // Reset form
    setFormData({
      property_id: "",
      scheduled_date: "",
      scheduled_time: "",
      job_type: "standard",
      assigned_to: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>Schedule a new cleaning job for your team</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="property">Property</Label>
              <Select
                value={formData.property_id}
                onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                required
              >
                <SelectTrigger id="property">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name} - {property.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="job_type">Job Type</Label>
              <Select
                value={formData.job_type}
                onValueChange={(value) => setFormData({ ...formData, job_type: value })}
              >
                <SelectTrigger id="job_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Clean</SelectItem>
                  <SelectItem value="deep">Deep Clean</SelectItem>
                  <SelectItem value="turnover">Turnover</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assigned_to">Assign To (Optional)</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger id="assigned_to">
                  <SelectValue placeholder="Assign later" />
                </SelectTrigger>
                <SelectContent>
                  {cleaners.map((cleaner) => (
                    <SelectItem key={cleaner.id} value={cleaner.id}>
                      {cleaner.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
