"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Trash2 } from "lucide-react"
import { EditFeatureFlagDialog } from "./edit-feature-flag-dialog"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type FeatureFlag = {
  id: string
  name: string
  description: string | null
  is_enabled: boolean
  enabled_for_companies: string[]
  rollout_percentage: number
  created_at: string
  updated_at: string
}

type Company = {
  id: string
  name: string
}

export function FeatureFlagsTable({
  flags,
  companies,
}: {
  flags: FeatureFlag[]
  companies: Company[]
}) {
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleToggle = async (flagId: string, currentState: boolean) => {
    const { error } = await supabase
      .from("feature_flags")
      .update({ is_enabled: !currentState, updated_at: new Date().toISOString() })
      .eq("id", flagId)

    if (error) {
      toast.error("Failed to update feature flag")
      console.error(error)
    } else {
      toast.success(`Feature flag ${!currentState ? "enabled" : "disabled"}`)
      router.refresh()
    }
  }

  const handleDelete = async (flagId: string, flagName: string) => {
    if (!confirm(`Are you sure you want to delete the feature flag "${flagName}"?`)) {
      return
    }

    const { error } = await supabase.from("feature_flags").delete().eq("id", flagId)

    if (error) {
      toast.error("Failed to delete feature flag")
      console.error(error)
    } else {
      toast.success("Feature flag deleted")
      router.refresh()
    }
  }

  if (flags.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">
          No feature flags created yet. Create your first feature flag to get started.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {flags.map((flag) => (
        <Card key={flag.id} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg">{flag.name}</h3>
                <Badge variant={flag.is_enabled ? "default" : "secondary"}>
                  {flag.is_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              {flag.description && <p className="text-sm text-muted-foreground">{flag.description}</p>}

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Rollout:</span>
                  <Badge variant="outline">{flag.rollout_percentage}%</Badge>
                </div>

                {flag.enabled_for_companies.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Enabled for:</span>
                    <Badge variant="outline">{flag.enabled_for_companies.length} companies</Badge>
                  </div>
                )}

                <div className="text-muted-foreground">Created {new Date(flag.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Switch checked={flag.is_enabled} onCheckedChange={() => handleToggle(flag.id, flag.is_enabled)} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingFlag(flag)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(flag.id, flag.name)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>
      ))}

      {editingFlag && (
        <EditFeatureFlagDialog
          flag={editingFlag}
          companies={companies}
          open={!!editingFlag}
          onOpenChange={(open) => !open && setEditingFlag(null)}
        />
      )}
    </div>
  )
}
