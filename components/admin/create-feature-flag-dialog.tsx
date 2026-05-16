"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"

type Company = {
  id: string
  name: string
}

export function CreateFeatureFlagDialog({
  children,
  companies,
}: {
  children: React.ReactNode
  companies: Company[]
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isEnabled, setIsEnabled] = useState(false)
  const [rolloutPercentage, setRolloutPercentage] = useState(0)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase.from("feature_flags").insert({
      name,
      description: description || null,
      is_enabled: isEnabled,
      rollout_percentage: rolloutPercentage,
      enabled_for_companies: selectedCompanies,
    })

    setIsSubmitting(false)

    if (error) {
      toast.error("Failed to create feature flag")
      console.error(error)
      return
    }

    toast.success("Feature flag created")
    setOpen(false)
    setName("")
    setDescription("")
    setIsEnabled(false)
    setRolloutPercentage(0)
    setSelectedCompanies([])
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Feature Flag</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Flag Name</Label>
            <Input
              id="name"
              placeholder="e.g., advanced_analytics, new_dashboard"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does this feature flag control?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Flag"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
