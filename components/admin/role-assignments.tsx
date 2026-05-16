"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface RoleAssignment {
  id: string
  user_id: string
  granted_at: string
  expires_at: string | null
  users: {
    email: string
    companies: {
      name: string
    }
  }
  system_roles: {
    id: string
    name: string
    description: string
  }
  granted_by_user: {
    email: string
  }
}

interface RoleAssignmentsProps {
  assignments: RoleAssignment[]
}

export function RoleAssignments({ assignments }: RoleAssignmentsProps) {
  const router = useRouter()
  const [revoking, setRevoking] = useState<string | null>(null)

  const handleRevoke = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to revoke this role?")) return

    setRevoking(assignmentId)
    const supabase = createClient()

    const { error } = await supabase.from("user_system_roles").delete().eq("id", assignmentId)

    if (error) {
      alert("Failed to revoke role: " + error.message)
    } else {
      router.refresh()
    }

    setRevoking(null)
  }

  const getRoleColor = (name: string) => {
    switch (name) {
      case "super_admin":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "platform_admin":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "support":
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
      case "developer":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "analyst":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Assignments</CardTitle>
        <CardDescription>Current platform administration role assignments</CardDescription>
      </CardHeader>
      <CardContent>
        {!assignments || assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No role assignments</p>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Granted By</TableHead>
                  <TableHead>Granted Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.users?.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleColor(assignment.system_roles?.name)}>
                        {assignment.system_roles?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{assignment.users?.companies?.name}</TableCell>
                    <TableCell className="text-muted-foreground">{assignment.granted_by_user?.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(assignment.granted_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(assignment.id)}
                        disabled={revoking === assignment.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
