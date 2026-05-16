import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ClientPortalHeader } from "@/components/client-portal/client-portal-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, MapPin, Phone, Mail } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AddPropertyDialog } from "@/components/client-portal/add-property-dialog"
import { DeletePropertyDialog } from "@/components/client-portal/delete-property-dialog"

export default async function ClientPropertiesPage() {
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

  console.log("[v0] Portal user client_id:", portalUser?.client_id)

  // Get all properties
  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select(
      `
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
      special_instructions,
      company_id,
      companies!fk_company(name, phone, email)
    `,
    )
    .eq("client_id", portalUser.client_id)
    .order("name")

  console.log("[v0] Properties query result:", { count: properties?.length, error: propertiesError })

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
    <div className="flex min-h-screen flex-col bg-background">
      <ClientPortalHeader clientName={portalUser.clients.name} clientEmail={portalUser.clients.email} />

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-[1600px] space-y-8">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Properties</h1>
              <p className="text-muted-foreground mt-1">Manage your properties and service providers</p>
            </div>
            <AddPropertyDialog />
          </div>

          {/* Properties Grid */}
          {properties && properties.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => {
                const stats = propertyJobCounts.find((p) => p.propertyId === property.id)
                return (
                  <Card key={property.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg">{property.name}</CardTitle>
                        <Badge variant="secondary" className="capitalize">
                          {property.property_type}
                        </Badge>
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

                      {/* Service Provider */}
                      <div className="pt-4 border-t">
                        <div className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Service Provider
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="font-medium">{property.companies?.name}</div>
                          {property.companies?.phone && (
                            <div className="text-muted-foreground flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {property.companies.phone}
                            </div>
                          )}
                          {property.companies?.email && (
                            <div className="text-muted-foreground flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {property.companies.email}
                            </div>
                          )}
                        </div>
                      </div>

                      <Link href={`/client-portal/properties/${property.id}`}>
                        <Button variant="outline" className="w-full bg-transparent">
                          View Details
                        </Button>
                      </Link>
                      <DeletePropertyDialog
                        propertyId={property.id}
                        propertyName={property.name}
                        variant="ghost"
                        size="sm"
                      />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-lg font-medium mb-2">No Properties Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first property by importing from Airbnb or entering details manually.
                </p>
                <AddPropertyDialog />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
