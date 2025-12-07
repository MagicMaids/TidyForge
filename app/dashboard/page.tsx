import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { JobsBoard } from "@/components/dashboard/jobs-board"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Home, Users, Smartphone, CreditCard } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("company_id, role, full_name")
    .eq("id", user.id)
    .single()

  if (!userData?.company_id) {
    redirect("/onboarding")
  }

  if (userData.role === "cleaner") {
    redirect("/mobile")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/dashboard">
              <span className="font-bold">TidyForge</span>
            </a>
          </div>
          <nav className="flex items-center space-x-4 text-sm">
            <Link
              href="/dashboard/properties"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              Properties
            </Link>
            <Link
              href="/dashboard/clients"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Users className="h-4 w-4" />
              Clients
            </Link>
            <Link href="/mobile" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Smartphone className="h-4 w-4" />
              Mobile View
            </Link>
            {userData.role === "admin" && (
              <Link
                href="/dashboard/billing"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <CreditCard className="h-4 w-4" />
                Billing
              </Link>
            )}
          </nav>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <span className="text-sm text-muted-foreground">{userData.full_name}</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Manage your cleaning operations and team</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DashboardOverview companyId={userData.company_id} />
            </TabsContent>

            <TabsContent value="jobs" className="space-y-6">
              <JobsBoard companyId={userData.company_id} userRole={userData.role} />
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <div className="text-muted-foreground">Schedule view coming soon...</div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
