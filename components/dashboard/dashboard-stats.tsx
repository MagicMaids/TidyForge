"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { DollarSign, Users, Home, ClipboardList, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface DashboardStats {
  monthlyRevenue: number
  monthlyRevenueChange: number
  totalClients: number
  clientsChange: number
  totalProperties: number
  propertiesChange: number
  completedJobsThisMonth: number
  uncompletedJobsThisMonth: number
  jobsChange: number
}

export function DashboardStats({ companyId }: { companyId: string }) {
  const [stats, setStats] = useState<DashboardStats>({
    monthlyRevenue: 0,
    monthlyRevenueChange: 0,
    totalClients: 0,
    clientsChange: 0,
    totalProperties: 0,
    propertiesChange: 0,
    completedJobsThisMonth: 0,
    uncompletedJobsThisMonth: 0,
    jobsChange: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const supabase = createBrowserClient()

      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

      console.log("[v0] Fetching dashboard stats for company:", companyId)

      // Fetch all data in parallel
      const [
        currentMonthRevenueResult,
        lastMonthRevenueResult,
        currentMonthClientsResult,
        lastMonthClientsResult,
        currentMonthPropertiesResult,
        lastMonthPropertiesResult,
        completedJobsResult,
        uncompletedJobsResult,
        lastMonthCompletedJobsResult,
      ] = await Promise.all([
        // Current month revenue
        supabase
          .from("jobs")
          .select("total_price")
          .eq("company_id", companyId)
          .gte("scheduled_date", currentMonthStart)
          .lte("scheduled_date", currentMonthEnd),

        // Last month revenue
        supabase
          .from("jobs")
          .select("total_price")
          .eq("company_id", companyId)
          .gte("scheduled_date", lastMonthStart)
          .lte("scheduled_date", lastMonthEnd),

        // Current month clients - query through junction table
        supabase
          .from("company_client_relationships")
          .select("id", { count: "exact" })
          .eq("company_id", companyId)
          .eq("relationship_status", "active"),

        // Last month clients - query through junction table
        supabase
          .from("company_client_relationships")
          .select("id", { count: "exact" })
          .eq("company_id", companyId)
          .eq("relationship_status", "active")
          .lt("created_at", currentMonthStart),

        // Current month properties
        supabase
          .from("properties")
          .select("id", { count: "exact" })
          .eq("company_id", companyId),

        // Last month properties
        supabase
          .from("properties")
          .select("id", { count: "exact" })
          .eq("company_id", companyId)
          .lt("created_at", currentMonthStart),

        // Completed jobs this month
        supabase
          .from("jobs")
          .select("id", { count: "exact" })
          .eq("company_id", companyId)
          .eq("status", "completed")
          .gte("scheduled_date", currentMonthStart)
          .lte("scheduled_date", currentMonthEnd),

        // Uncompleted jobs this month (pending, assigned, in_progress)
        supabase
          .from("jobs")
          .select("id", { count: "exact" })
          .eq("company_id", companyId)
          .in("status", ["pending", "assigned", "in_progress"])
          .gte("scheduled_date", currentMonthStart)
          .lte("scheduled_date", currentMonthEnd),

        // Last month completed jobs
        supabase
          .from("jobs")
          .select("id", { count: "exact" })
          .eq("company_id", companyId)
          .eq("status", "completed")
          .gte("scheduled_date", lastMonthStart)
          .lte("scheduled_date", lastMonthEnd),
      ])

      // Calculate revenue
      const currentRevenue =
        currentMonthRevenueResult.data?.reduce((sum, job) => sum + (Number(job.total_price) || 0), 0) || 0
      const lastRevenue =
        lastMonthRevenueResult.data?.reduce((sum, job) => sum + (Number(job.total_price) || 0), 0) || 0
      const revenueChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0

      // Calculate client change
      const currentClients = currentMonthClientsResult.count || 0
      const lastClients = lastMonthClientsResult.count || 0
      const clientsChange = lastClients > 0 ? ((currentClients - lastClients) / lastClients) * 100 : 0

      // Calculate property change
      const currentProperties = currentMonthPropertiesResult.count || 0
      const lastProperties = lastMonthPropertiesResult.count || 0
      const propertiesChange = lastProperties > 0 ? ((currentProperties - lastProperties) / lastProperties) * 100 : 0

      // Calculate jobs change
      const currentCompletedJobs = completedJobsResult.count || 0
      const lastCompletedJobs = lastMonthCompletedJobsResult.count || 0
      const jobsChange =
        lastCompletedJobs > 0 ? ((currentCompletedJobs - lastCompletedJobs) / lastCompletedJobs) * 100 : 0

      console.log("[v0] Stats calculated:", {
        currentRevenue,
        lastRevenue,
        revenueChange,
        currentClients,
        clientsChange,
        currentProperties,
        propertiesChange,
        completedJobs: currentCompletedJobs,
        uncompletedJobs: uncompletedJobsResult.count,
        jobsChange,
      })

      setStats({
        monthlyRevenue: currentRevenue,
        monthlyRevenueChange: revenueChange,
        totalClients: currentClients,
        clientsChange,
        totalProperties: currentProperties,
        propertiesChange,
        completedJobsThisMonth: currentCompletedJobs,
        uncompletedJobsThisMonth: uncompletedJobsResult.count || 0,
        jobsChange,
      })
      setLoading(false)
    }

    fetchStats()
  }, [companyId])

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <div className="flex items-center gap-1 text-green-500">
          <TrendingUp className="h-3 w-3" />
          <span className="text-xs font-medium">+{value.toFixed(1)}%</span>
        </div>
      )
    } else if (value < 0) {
      return (
        <div className="flex items-center gap-1 text-red-500">
          <TrendingDown className="h-3 w-3" />
          <span className="text-xs font-medium">{value.toFixed(1)}%</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span className="text-xs font-medium">0%</span>
      </div>
    )
  }

  const statCards = [
    {
      title: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      change: stats.monthlyRevenueChange,
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Total Clients",
      value: stats.totalClients,
      change: stats.clientsChange,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Properties",
      value: stats.totalProperties,
      change: stats.propertiesChange,
      icon: Home,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Jobs This Month",
      value: `${stats.completedJobsThisMonth} / ${stats.completedJobsThisMonth + stats.uncompletedJobsThisMonth}`,
      subtitle: `${stats.uncompletedJobsThisMonth} uncompleted`,
      change: stats.jobsChange,
      icon: ClipboardList,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-24 bg-muted rounded" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="p-6 hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <div>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <div className="flex items-center gap-2 mt-2">
                  <TrendIndicator value={stat.change} />
                  {stat.subtitle && <span className="text-xs text-muted-foreground ml-2">{stat.subtitle}</span>}
                </div>
              </div>
            </div>
            <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
