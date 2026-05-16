import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Building2, Users, DollarSign, Briefcase } from "lucide-react"

interface AdminStatsProps {
  totalCompanies: number
  companyGrowth: number
  totalUsers: number
  userGrowth: number
  mrr: number
  totalJobs: number
}

export function AdminStats({ totalCompanies, companyGrowth, totalUsers, userGrowth, mrr, totalJobs }: AdminStatsProps) {
  const stats = [
    {
      title: "Total Companies",
      value: totalCompanies.toLocaleString(),
      change: companyGrowth,
      icon: Building2,
    },
    {
      title: "Total Users",
      value: totalUsers.toLocaleString(),
      change: userGrowth,
      icon: Users,
    },
    {
      title: "Monthly Recurring Revenue",
      value: `$${mrr.toLocaleString()}`,
      change: companyGrowth, // MRR growth tracks company growth
      icon: DollarSign,
    },
    {
      title: "Total Jobs",
      value: totalJobs.toLocaleString(),
      change: 0, // We'll calculate this properly later
      icon: Briefcase,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        const isPositive = stat.change >= 0
        const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight

        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change !== 0 && (
                <div className="flex items-center gap-1 text-xs mt-1">
                  <TrendIcon className={`h-3 w-3 ${isPositive ? "text-emerald-500" : "text-red-500"}`} />
                  <span className={isPositive ? "text-emerald-500" : "text-red-500"}>
                    {Math.abs(stat.change).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">vs last month</span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
