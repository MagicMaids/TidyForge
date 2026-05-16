import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ClientPortalHeader } from "@/components/client-portal/client-portal-header"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Building2, CheckCircle2, Clock, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ClientJobsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/client-login")
  }

  const { data: portalUser } = await supabase
    .from("client_portal_users")
    .select("*, clients(*)")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (!portalUser) {
    redirect("/onboarding/client")
  }

  // Get property IDs
  const { data: properties } = await supabase.from("properties").select("id").eq("client_id", portalUser.client_id)

  const propertyIds = properties?.map((p) => p.id) || []

  // Get all jobs
  const { data: allJobs } = await supabase
    .from("jobs")
    .select(
      `
      id,
      scheduled_date,
      scheduled_time,
      completed_at,
      status,
      job_type,
      special_instructions,
      properties(name, address),
      companies(name)
    `,
    )
    .in("property_id", propertyIds.length > 0 ? propertyIds : ["00000000-0000-0000-0000-000000000000"])
    .order("scheduled_date", { ascending: false })

  const upcomingJobs = allJobs?.filter((job) => job.status === "scheduled" || job.status === "in_progress") || []
  const completedJobs = allJobs?.filter((job) => job.status === "completed") || []
  const cancelledJobs = allJobs?.filter((job) => job.status === "cancelled") || []

  function getStatusIcon(status: string) {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "scheduled":
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "completed":
        return "default"
      case "scheduled":
      case "in_progress":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  function JobCard({ job }: { job: any }) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(job.status)}
              <div>
                <h3 className="font-semibold text-lg">{job.job_type}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {job.properties?.name}
                </div>
              </div>
            </div>
            <Badge variant={getStatusVariant(job.status)} className="capitalize">
              {job.status}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(job.scheduled_date).toLocaleDateString()}
                {job.scheduled_time && ` at ${job.scheduled_time}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{job.companies?.name}</span>
            </div>
          </div>

          {job.completed_at && (
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              Completed on {new Date(job.completed_at).toLocaleDateString()}
            </div>
          )}

          {job.special_instructions && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium mb-1">Special Instructions</div>
              <div className="text-sm text-muted-foreground">{job.special_instructions}</div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ClientPortalHeader clientName={portalUser.clients.name} clientEmail={portalUser.clients.email} />

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-[1600px] space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service History</h1>
            <p className="text-muted-foreground mt-1">View all your scheduled and completed services</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcomingJobs.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedJobs.length})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({cancelledJobs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingJobs.length > 0 ? (
                upcomingJobs.map((job) => <JobCard key={job.id} job={job} />)
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-lg font-medium mb-2">No Upcoming Services</h3>
                    <p className="text-muted-foreground">You don't have any scheduled services at the moment.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedJobs.length > 0 ? (
                completedJobs.map((job) => <JobCard key={job.id} job={job} />)
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-lg font-medium mb-2">No Completed Services</h3>
                    <p className="text-muted-foreground">Your service history will appear here.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledJobs.length > 0 ? (
                cancelledJobs.map((job) => <JobCard key={job.id} job={job} />)
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <XCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-lg font-medium mb-2">No Cancelled Services</h3>
                    <p className="text-muted-foreground">You don't have any cancelled services.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
