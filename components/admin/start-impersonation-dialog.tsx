"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ShieldCheck } from "lucide-react"
import { startImpersonation } from "@/lib/actions/impersonation"

interface StartImpersonationDialogProps {
  companyId: string
  companyName: string
}

export function StartImpersonationDialog({ companyId, companyName }: StartImpersonationDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for impersonation")
      return
    }

    console.log("[v0] Starting impersonation for company:", companyId, "reason:", reason)
    setIsStarting(true)

    const result = await startImpersonation(companyId, reason)
    console.log("[v0] Impersonation result:", result)

    if (result.success) {
      console.log("[v0] Impersonation started successfully, redirecting to dashboard")
      setOpen(false)
      window.location.href = "/dashboard"
    } else {
      console.error("[v0] Impersonation failed:", result.error)
      alert(result.error || "Failed to start impersonation session")
      setIsStarting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <ShieldCheck className="h-4 w-4" />
          Access Company Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Access Company Dashboard</DialogTitle>
          <DialogDescription>
            You are about to access the dashboard for <strong>{companyName}</strong> with full administrative
            privileges. All actions will be audited.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Access *</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Customer support ticket #1234 - Help setting up properties"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              This reason will be logged in the audit trail for compliance purposes.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isStarting}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={isStarting}>
            {isStarting ? "Starting..." : "Start Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
