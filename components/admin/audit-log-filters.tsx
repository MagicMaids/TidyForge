"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X } from "lucide-react"

export function AuditLogFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [action, setAction] = useState(searchParams.get("action") || "")
  const [adminEmail, setAdminEmail] = useState(searchParams.get("adminEmail") || "")
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "")
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "")

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (action) params.set("action", action)
    if (adminEmail) params.set("adminEmail", adminEmail)
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)

    router.push(`/admin/audit-logs?${params.toString()}`)
  }

  const handleClear = () => {
    setAction("")
    setAdminEmail("")
    setDateFrom("")
    setDateTo("")
    router.push("/admin/audit-logs")
  }

  const hasFilters = action || adminEmail || dateFrom || dateTo

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Input
              id="action"
              placeholder="Search actions..."
              value={action}
              onChange={(e) => setAction(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin Email</Label>
            <Input
              id="adminEmail"
              type="email"
              placeholder="admin@example.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFrom">From Date</Label>
            <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTo">To Date</Label>
            <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button onClick={handleFilter}>
            <Search className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>

          {hasFilters && (
            <Button variant="outline" onClick={handleClear}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
