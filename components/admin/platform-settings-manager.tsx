"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface PlatformSetting {
  id: string
  key: string
  value: any
  description: string | null
  is_public: boolean
  updated_at: string
}

export function PlatformSettingsManager({ initialSettings }: { initialSettings: PlatformSetting[] }) {
  const [settings, setSettings] = useState(initialSettings)
  const [isCreating, setIsCreating] = useState(false)
  const [newSetting, setNewSetting] = useState({
    key: "",
    value: "",
    description: "",
    is_public: false,
  })
  const supabase = createClient()

  const updateSetting = async (id: string, updates: Partial<PlatformSetting>) => {
    const { error } = await supabase.from("platform_settings").update(updates).eq("id", id)

    if (error) {
      console.error("[v0] Error updating setting:", error)
      alert("Failed to update setting: " + error.message)
      return
    }

    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const createSetting = async () => {
    // Parse JSON if the value looks like JSON
    let parsedValue: any = newSetting.value
    try {
      parsedValue = JSON.parse(newSetting.value)
    } catch {
      // If not valid JSON, keep as string
      parsedValue = newSetting.value
    }

    const { data, error } = await supabase
      .from("platform_settings")
      .insert({
        key: newSetting.key,
        value: parsedValue,
        description: newSetting.description || null,
        is_public: newSetting.is_public,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating setting:", error)
      alert("Failed to create setting: " + error.message)
      return
    }

    setSettings((prev) => [...prev, data])
    setNewSetting({ key: "", value: "", description: "", is_public: false })
    setIsCreating(false)
  }

  const deleteSetting = async (id: string) => {
    if (!confirm("Are you sure you want to delete this setting?")) return

    const { error } = await supabase.from("platform_settings").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting setting:", error)
      alert("Failed to delete setting: " + error.message)
      return
    }

    setSettings((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{settings.length} settings configured</p>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Setting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Platform Setting</DialogTitle>
              <DialogDescription>Add a new global configuration setting for the platform</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key">Key *</Label>
                <Input
                  id="key"
                  value={newSetting.key}
                  onChange={(e) => setNewSetting((prev) => ({ ...prev, key: e.target.value }))}
                  placeholder="e.g., max_companies_per_user"
                />
              </div>
              <div>
                <Label htmlFor="value">Value (JSON or string) *</Label>
                <Textarea
                  id="value"
                  value={newSetting.value}
                  onChange={(e) => setNewSetting((prev) => ({ ...prev, value: e.target.value }))}
                  placeholder='e.g., 5 or {"limit": 10, "enabled": true}'
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newSetting.description}
                  onChange={(e) => setNewSetting((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="What this setting controls"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_public">Public Setting</Label>
                <Switch
                  id="is_public"
                  checked={newSetting.is_public}
                  onCheckedChange={(checked) => setNewSetting((prev) => ({ ...prev, is_public: checked }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={createSetting} disabled={!newSetting.key || !newSetting.value}>
                  Create Setting
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {settings.map((setting) => (
          <Card key={setting.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-mono">{setting.key}</CardTitle>
                    {setting.is_public && <Badge variant="secondary">Public</Badge>}
                  </div>
                  {setting.description && <CardDescription className="mt-1">{setting.description}</CardDescription>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteSetting(setting.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Current Value</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(setting.value, null, 2)}
                  </pre>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(setting.updated_at).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`public-${setting.id}`} className="text-sm">
                      Public
                    </Label>
                    <Switch
                      id={`public-${setting.id}`}
                      checked={setting.is_public}
                      onCheckedChange={(checked) => updateSetting(setting.id, { is_public: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {settings.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No platform settings configured yet.</p>
              <Button className="mt-4" onClick={() => setIsCreating(true)}>
                Create First Setting
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
