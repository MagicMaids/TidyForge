"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"

type FeatureFlag = {
  id: string
  name: string
  description: string | null
  is_enabled: boolean
  enabled_for_companies: string[]
  rollout_percentage: number
}

type Company = {
  id: string
  name: string
}

export function EditFeatureFlagDialog({
  flag,
  companies,
  open,
  onOpenChange,
}: {
  flag: FeatureFlag
  companies: Company[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState(flag.name)
  const [description, setDescription] = useState(flag.description || "")
  const [isEnabled, setIsEnabled] = useState(flag.is_enabled)
  const [rolloutPercentage, setRolloutPercentage] = useState(flag.rollout_percentage)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(flag.enabled_for_companies)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setName(flag.name)
    setDescription(flag.description || "")
    setIsEnabled(flag.is_enabled)
    setRolloutPercentage(flag.rollout_percentage)
    setSelectedCompanies(flag.enabled_for_companies)
  }, [flag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase
      .from("feature_flags")
      .update({
        name,
        description: description || null,
        is_enabled: isEnabled,
        rollout_percentage: rolloutPercentage,
        enabled_for_companies: selectedCompanies,
        updated_at: new Date().toISOString(),
      })
      .eq("id", flag.id)

    setIsSubmitting(false)

    if (error) {
      toast.error("Failed to update feature flag")
      console.error(error)
      return
    }

    toast.success("Feature flag updated")
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Feature Flag</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Flag Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Enable Flag</Label>
              <p className="text-sm text-muted-foreground">Turn this feature on or off globally</p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Rollout Percentage</Label>
                <span className="text-sm font-medium">{rolloutPercentage}%</span>
              </div>
              <Slider
                value={[rolloutPercentage]}
                onValueChange={(value) => setRolloutPercentage(value[0])}
                max={100}
                step={5}
              />
              <p className="text-sm text-muted-foreground">Randomly enable for a percentage of companies</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Enable for Specific Companies (Optional)</Label>
            <div className="max-h-48 overflow-y-auto rounded-lg border p-4 space-y-2">
              {companies.map((company) => (
                <label key={company.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(company.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCompanies([...selectedCompanies, company.id])
                      } else {
                        setSelectedCompanies(selectedCompanies.filter((id) => id !== company.id))
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{company.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Flag"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
