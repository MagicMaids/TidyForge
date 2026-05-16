"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle2, Clock } from "lucide-react"

interface TeamMember {
  id: string
  full_name: string
  completedJobs: number
  avgTime: number
}

export function TeamPerformance({ companyId }: { companyId: string }) {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTeam() {
      const supabase = createBrowserClient()

      const { data: cleaners } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("company_id", companyId)
        .eq("role", "cleaner")
        .limit(5)

      if (cleaners) {
        const teamWithStats = await Promise.all(
          cleaners.map(async (cleaner) => {
            const { data: jobs } = await supabase
              .from("jobs")
              .select("id, status")
              .eq("assigned_to", cleaner.id)
              .eq("status", "completed")

            return {
              id: cleaner.id,
              full_name: cleaner.full_name,
              completedJobs: jobs?.length || 0,
              avgTime: Math.floor(Math.random() * 30) + 30, // Mock data
            }
          }),
        )

        setTeam(teamWithStats.sort((a, b) => b.completedJobs - a.completedJobs))
      }
      setLoading(false)
    }

    fetchTeam()
  }, [companyId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {team.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No team members yet</div>
          ) : (
            team.map((member, index) => (
              <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {member.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{member.full_name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{member.completedJobs} completed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{member.avgTime}min avg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
