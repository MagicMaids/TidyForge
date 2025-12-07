"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, Users, Home, CheckCircle2 } from "lucide-react"

interface DashboardStats {
  totalJobs: number
  activeJobs: number
  totalProperties: number
  totalCleaners: number
}

export function DashboardOverview({ companyId }: { companyId: string }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalProperties: 0,
    totalCleaners: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const supabase = createBrowserClient()

      const [jobsResult, propertiesResult, cleanersResult] = await Promise.all([
        supabase.from("jobs").select("status", { count: "exact" }).eq("company_id", companyId),
        supabase.from("properties").select("id", { count: "exact" }).eq("company_id", companyId),
        supabase.from("users").select("id", { count: "exact" }).eq("company_id", companyId).eq("role", "cleaner"),
      ])

      const activeJobs =
        jobsResult.data?.filter((job) => job.status === "scheduled" || job.status === "in_progress").length || 0

      setStats({
        totalJobs: jobsResult.count || 0,
        activeJobs,
        totalProperties: propertiesResult.count || 0,
        totalCleaners: cleanersResult.count || 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [companyId])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Jobs",
      value: stats.totalJobs,
      icon: ClipboardList,
      description: `${stats.activeJobs} active`,
    },
    {
      title: "Properties",
      value: stats.totalProperties,
      icon: Home,
      description: "Registered locations",
    },
    {
      title: "Team Members",
      value: stats.totalCleaners,
      icon: Users,
      description: "Active cleaners",
    },
    {
      title: "Completed Today",
      value: 0,
      icon: CheckCircle2,
      description: "Jobs finished",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
