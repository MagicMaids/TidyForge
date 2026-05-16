"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Plus, Calendar, Users, Home } from "lucide-react"
import { CreateJobDialog } from "./create-job-dialog"
import { useRouter } from "next/navigation"

export function QuickActions({ userRole }: { userRole: string }) {
  const [createJobOpen, setCreateJobOpen] = useState(false)
  const router = useRouter()

  const actions = [
    {
      title: "New Job",
      description: "Schedule a new cleaning job",
      icon: Plus,
      onClick: () => setCreateJobOpen(true),
      color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    },
    {
      title: "Add Property",
      description: "Register a new property",
      icon: Home,
      onClick: () => router.push("/dashboard/properties"),
      color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
    },
    {
      title: "Add Client",
      description: "Create a new client account",
      icon: Users,
      onClick: () => router.push("/dashboard/clients"),
      color: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    },
    {
      title: "View Schedule",
      description: "Check upcoming jobs",
      icon: Calendar,
      onClick: () => router.push("/dashboard?tab=schedule"),
      color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
    },
  ]

  if (userRole !== "admin" && userRole !== "manager") {
    return null
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Card
            key={action.title}
            className="p-4 hover:border-primary/50 transition-all cursor-pointer group"
            onClick={action.onClick}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg transition-colors ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <CreateJobDialog open={createJobOpen} onOpenChange={setCreateJobOpen} companyId="" onJobCreated={() => {}} />
    </>
  )
}
