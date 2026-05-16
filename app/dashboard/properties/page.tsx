import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Input } from "@/components/ui/input"
import { Search, Building2, MapPin, User, LinkIcon, Phone, Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AddCompanyPropertyDialog } from "@/components/admin/add-company-property-dialog"
import { DeleteCompanyPropertyDialog } from "@/components/admin/delete-company-property-dialog"
import Link from "next/link"

export default async function CompanyPropertiesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's company
  const { data: userData } = await supabase
    .from("users")
    .select("company_id, role, full_name, companies(name)")
    .eq("id", user.id)
    .single()

  console.log("[v0] Company Dashboard Properties - User ID:", user.id)
  console.log("[v0] Company Dashboard Properties - User Data:", userData)

  if (!userData?.company_id) {
    redirect("/onboarding")
  }

  console.log("[v0] Fetching properties for company:", userData.company_id)

  // Fetch all properties for this company
  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select(`
      id,
      name,
      address,
      city,
      state,
      zip,
      property_type,
      square_feet,
      bedrooms,
      bathrooms,
      airbnb_listing_url,
      airbnb_listing_id,
      sync_enabled,
      last_synced_at,
      special_instructions,
      created_at,
      client_id,
      clients!fk_client(id, name, email, phone)
    `)
    .eq("company_id", userData.company_id)
    .order("created_at", { ascending: false })

  console.log("[v0] Properties query result:", {
    count: properties?.length || 0,
    properties: properties,
    error: propertiesError,
  })

  // Fetch all clients related to this company
  const { data: companyClients } = await supabase
    .from("company_client_relationships")
    .select("clients(id, name, email)")
    .eq("company_id", userData.company_id)
    .eq("relationship_status", "active")

  const allClients = companyClients?.map((rel: any) => rel.clients).filter(Boolean) || []

  // Get job counts for each property
  const propertyJobCounts = await Promise.all(
    (properties || []).map(async (property) => {
      const { count } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("property_id", property.id)
        .eq("status", "completed")

      const { count: upcomingCount } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("property_id", property.id)
        .in("status", ["scheduled", "in_progress"])

      return { propertyId: property.id, completedCount: count || 0, upcomingCount: upcomingCount || 0 }
    }),
  )

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={userData.full_name} userRole={userData.role} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
            <p className="text-muted-foreground mt-1">
              Manage client properties, Airbnb imports, and service schedules
            </p>
          </div>
          <AddCompanyPropertyDialog clients={allClients} />
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search properties by name, address, or client..." className="pl-9" />
          </div>
        </div>

        {!properties || properties.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Add your first client property by importing from Airbnb or entering details manually
              </p>
              <AddCompanyPropertyDialog clients={allClients} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => {
              const stats = propertyJobCounts.find((p) => p.propertyId === property.id)
              return (
                <Card key={property.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">{property.name}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {property.property_type}
                        </Badge>
                        {property.airbnb_listing_id && (
                          <Badge variant="outline" className="text-xs">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Airbnb
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {property.address}
                        {property.city && `, ${property.city}`}
                        {property.state && `, ${property.state}`} {property.zip}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Property Details */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {property.square_feet && (
                        <div>
                          <div className="text-muted-foreground">Size</div>
                          <div className="font-medium">{property.square_feet} sqft</div>
                        </div>
                      )}
                      {property.bedrooms && (
                        <div>
                          <div className="text-muted-foreground">Beds</div>
                          <div className="font-medium">{property.bedrooms}</div>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div>
                          <div className="text-muted-foreground">Baths</div>
                          <div className="font-medium">{property.bathrooms}</div>
                        </div>
                      )}
                    </div>

                    {/* Service Stats */}
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Upcoming services</span>
                        <span className="font-medium">{stats?.upcomingCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Completed services</span>
                        <span className="font-medium">{stats?.completedCount || 0}</span>
                      </div>
                    </div>

                    {/* Client Information */}
                    <div className="pt-4 border-t">
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Property Owner
                      </div>
                      {property.clients ? (
                        <div className="text-sm space-y-1">
                          <div className="font-medium">{property.clients.name}</div>
                          {property.clients.phone && (
                            <div className="text-muted-foreground flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {property.clients.phone}
                            </div>
                          )}
                          {property.clients.email && (
                            <div className="text-muted-foreground flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {property.clients.email}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No client assigned</div>
                      )}
                    </div>

                    {/* Airbnb Sync Status */}
                    {property.sync_enabled && property.last_synced_at && (
                      <div className="pt-4 border-t text-xs text-muted-foreground">
                        Last synced: {new Date(property.last_synced_at).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Link href={`/dashboard/properties/${property.id}`} className="flex-1">
                        <Button variant="outline" className="w-full bg-transparent">
                          View Details
                        </Button>
                      </Link>
                      <DeleteCompanyPropertyDialog
                        propertyId={property.id}
                        propertyName={property.name}
                        variant="ghost"
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
