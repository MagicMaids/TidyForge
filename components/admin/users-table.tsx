"use client"

import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface User {
  id: string
  email: string
  role: string
  created_at: string
  company_id: string
  companies: {
    name: string
  }
}

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "admin":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "manager":
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
      case "cleaner":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "client":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (!users || users.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No users found</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getRoleColor(user.role)}>
                  {user.role || "member"}
                </Badge>
              </TableCell>
              <TableCell>
                <Link href={`/admin/companies/${user.company_id}`} className="text-primary hover:underline">
                  {user.companies?.name || "Unknown"}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <Link href={`/admin/users/${user.id}`}>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
