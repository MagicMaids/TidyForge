"use client"

import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface Company {
  id: string
  name: string
  subscription_status: string
  subscription_plan: string
  created_at: string
  userCount: number
}

interface CompaniesTableProps {
  companies: Company[]
}

export function CompaniesTable({ companies }: CompaniesTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "trial":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "suspended":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (!companies || companies.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No companies found</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Users</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(company.subscription_status)}>
                  {company.subscription_status || "unknown"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{company.subscription_plan || "Free"}</TableCell>
              <TableCell className="text-muted-foreground">{company.userCount}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(company.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/admin/companies/${company.id}`}>
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
