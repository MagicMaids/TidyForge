"use client"

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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SystemRole {
  id: string
  name: string
  description: string
}

interface GrantRoleDialogProps {
  systemRoles: SystemRole[]
}

export function GrantRoleDialog({ systemRoles }: GrantRoleDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [roleId, setRoleId] = useState("")
  const [loading, setLoading] = useState(false)

  const handleGrant = async () => {
    if (!email || !roleId) {
      alert("Please fill in all fields")
      return
    }

    setLoading(true)
    const supabase = createClient()

    // First, find the user by email
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("email", email).single()

    if (userError || !user) {
      alert("User not found with email: " + email)
      setLoading(false)
      return
    }

    // Get current user ID for granted_by
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    // Grant the role
    const { error } = await supabase.from("user_system_roles").insert({
      user_id: user.id,
      system_role_id: roleId,
      granted_by: currentUser?.id,
    })

    if (error) {
      alert("Failed to grant role: " + error.message)
    } else {
      setEmail("")
      setRoleId("")
      setOpen(false)
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Grant Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant System Role</DialogTitle>
          <DialogDescription>Assign a platform administration role to a user</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">System Role</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {systemRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name} - {role.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGrant} disabled={loading}>
            {loading ? "Granting..." : "Grant Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
