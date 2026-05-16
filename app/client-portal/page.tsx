import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ClientPortalHeader } from "@/components/client-portal/client-portal-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Calendar, CheckCircle2, Clock, Home, MapPin } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function ClientPortalPage() {
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

  console.log("[v0] Querying properties for client_id:", portalUser?.client_id)

  // Get client's properties with company info
  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select(
      `
      id,
      name,
      address,
      property_type,
      company_id,
      companies!fk_company(name, phone)
    `,
    )
    .eq("client_id", portalUser.client_id)
    .order("name")

  console.log("[v0] Properties found:", { count: properties?.length, error: propertiesError })

  const propertyIds = properties?.map((p) => p.id) || []

  // Get upcoming jobs
  const { data: upcomingJobs } = await supabase
    .from("jobs")
    .select(
      `
      id,
      scheduled_date,
      scheduled_time,
      status,
      job_type,
      special_instructions,
      properties(name, address),
      companies(name)
    `,
    )
    .in("property_id", propertyIds.length > 0 ? propertyIds : ["00000000-0000-0000-0000-000000000000"])
    .gte("scheduled_date", new Date().toISOString())
    .order("scheduled_date")
    .limit(5)

  // Get recent completed jobs
  const { data: recentJobs } = await supabase
    .from("jobs")
    .select(
      `
      id,
      scheduled_date,
      completed_at,
      status,
      job_type,
      properties(name),
      companies(name)
    `,
    )
    .in("property_id", propertyIds.length > 0 ? propertyIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(3)

  // Get service companies count
  const { data: serviceCompanies, count: companiesCount } = await supabase
    .from("company_client_relationships")
    .select("companies(id, name, email, phone)", { count: "exact" })
    .eq("client_id", portalUser.client_id)
    .eq("relationship_status", "active")

  // Count jobs by status
  const { count: pendingCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .in("property_id", propertyIds.length > 0 ? propertyIds : ["00000000-0000-0000-0000-000000000000"])
    .in("status", ["scheduled", "in_progress"])

  const { count: completedCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .in("property_id", propertyIds.length > 0 ? propertyIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("status", "completed")
    .gte("scheduled_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ClientPortalHeader clientName={portalUser.clients.name} clientEmail={portalUser.clients.email} />

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-[1600px] space-y-8">
          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {portalUser.clients.name.split(" ")[0]}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Properties</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{properties?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active properties</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Services</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Scheduled appointments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Services completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Service Providers</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{companiesCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active relationships</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* My Properties */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Properties</CardTitle>
                  <CardDescription>Properties you manage</CardDescription>
                </div>
                <Link href="/client-portal/properties">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {properties?.slice(0, 3).map((property) => (
                    <Link
                      key={property.id}
                      href={`/client-portal/properties/${property.id}`}
                      className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {property.name}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">{property.address}</div>
                          <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {property.companies?.name}
                          </div>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {property.property_type}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  {(!properties || properties.length === 0) && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      <Home className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No properties yet</p>
                      <Link href="/client-portal/properties">
                        <Button variant="outline" size="sm" className="mt-4 bg-transparent">
                          Add Property
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Services */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Upcoming Services</CardTitle>
                  <CardDescription>Your scheduled appointments</CardDescription>
                </div>
                <Link href="/client-portal/jobs">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingJobs?.map((job) => (
                    <div key={job.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{job.job_type}</div>
                        <Badge variant={job.status === "scheduled" ? "default" : "secondary"}>{job.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                        <MapPin className="h-3 w-3" />
                        {job.properties?.name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(job.scheduled_date).toLocaleDateString()} at {job.scheduled_time}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {job.companies?.name}
                      </div>
                    </div>
                  ))}
                  {(!upcomingJobs || upcomingJobs.length === 0) && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No upcoming services</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Completed Services */}
          {recentJobs && recentJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Completed Services</CardTitle>
                <CardDescription>Your service history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">{job.job_type}</div>
                          <div className="text-sm text-muted-foreground">
                            {job.properties?.name} • {new Date(job.completed_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{job.companies?.name}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Providers */}
          {serviceCompanies && serviceCompanies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Service Providers</CardTitle>
                <CardDescription>Companies servicing your properties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {serviceCompanies.map((company: any) => (
                    <div key={company.companies.id} className="p-4 border rounded-lg">
                      <div className="font-medium mb-2">{company.companies.name}</div>
                      {company.companies.phone && (
                        <div className="text-sm text-muted-foreground">📞 {company.companies.phone}</div>
                      )}
                      {company.companies.email && (
                        <div className="text-sm text-muted-foreground">✉️ {company.companies.email}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
