import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ClientPortalHeader } from "@/components/client-portal/client-portal-header"
import { EditPropertyDialog } from "@/components/client-portal/edit-property-dialog"
import { DeletePropertyDialog } from "@/components/client-portal/delete-property-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Building2,
  Bed,
  Bath,
  Calendar,
  Phone,
  Mail,
  ExternalLink,
  Key,
  Wifi,
  Car,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Building,
  DoorClosed,
  Warehouse,
  Shield,
  Info,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params
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

  // Get property details with all data
  const { data: property, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      companies!fk_company(name, phone, email, address, city, state, zip)
    `,
    )
    .eq("id", id)
    .eq("client_id", portalUser.client_id)
    .maybeSingle()

  if (error || !property) {
    notFound()
  }

  // Get recent jobs
  const { data: recentJobs } = await supabase
    .from("jobs")
    .select(
      `
      id,
      scheduled_date,
      scheduled_time,
      status,
      job_type,
      completed_at
    `,
    )
    .eq("property_id", property.id)
    .order("scheduled_date", { ascending: false })
    .limit(5)

  // Get job statistics
  const { count: completedCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("property_id", property.id)
    .eq("status", "completed")

  const { count: upcomingCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("property_id", property.id)
    .in("status", ["scheduled", "in_progress"])

  // Parse photos from both sources
  const photos = Array.isArray(property.photos) ? property.photos : property.airbnb_data?.photos || []
  const heroImage = photos[0] || "/placeholder.svg?height=400&width=1200"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ClientPortalHeader clientName={portalUser.clients.name} clientEmail={portalUser.clients.email} />

      <main className="flex-1">
        {/* Hero Image */}
        <div className="relative h-[300px] w-full overflow-hidden bg-muted">
          <Image src={heroImage || "/placeholder.svg"} alt={property.name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
            <div className="mx-auto max-w-[1400px]">
              <Link href="/client-portal/properties">
                <Button variant="ghost" size="sm" className="mb-4 bg-background/50 backdrop-blur-sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Properties
                </Button>
              </Link>
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">{property.name}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {property.address}
                      {property.city && `, ${property.city}`}
                      {property.state && `, ${property.state}`} {property.zip}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <EditPropertyDialog property={property} />
                  <DeletePropertyDialog
                    propertyId={property.id}
                    propertyName={property.name}
                    variant="outline"
                    redirectOnDelete={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-8">
          <div className="mx-auto max-w-[1400px] space-y-8">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Bed className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{property.bedrooms || "N/A"}</div>
                    <div className="text-sm text-muted-foreground">Bedrooms</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Bath className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{property.bathrooms || "N/A"}</div>
                    <div className="text-sm text-muted-foreground">Bathrooms</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-full bg-green-500/10 p-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{completedCount || 0}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-full bg-blue-500/10 p-3">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{upcomingCount || 0}</div>
                    <div className="text-sm text-muted-foreground">Upcoming</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Property Details */}
              <div className="space-y-6 lg:col-span-2">
                {/* Photos Gallery */}
                {photos.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Property Photos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        {photos.slice(1, 13).map((photo: string, index: number) => (
                          <div key={index} className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                            <Image
                              src={photo || "/placeholder.svg"}
                              alt={`${property.name} - Photo ${index + 2}`}
                              fill
                              className="object-cover transition-transform hover:scale-105"
                            />
                          </div>
                        ))}
                      </div>
                      {photos.length > 13 && (
                        <p className="mt-4 text-center text-sm text-muted-foreground">
                          + {photos.length - 13} more photos
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Description */}
                {property.airbnb_data?.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>About this property</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="leading-relaxed text-muted-foreground">{property.airbnb_data.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Access Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Access Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Access Codes Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {property.gate_code && (
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
                          <Building className="mt-0.5 h-5 w-5 text-primary" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-muted-foreground">Gate Code</div>
                            <div className="font-mono text-lg font-semibold">{property.gate_code}</div>
                          </div>
                        </div>
                      )}
                      {property.building_code && (
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
                          <Building className="mt-0.5 h-5 w-5 text-primary" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-muted-foreground">Building Code</div>
                            <div className="font-mono text-lg font-semibold">{property.building_code}</div>
                          </div>
                        </div>
                      )}
                      {property.access_code && (
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
                          <DoorClosed className="mt-0.5 h-5 w-5 text-primary" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-muted-foreground">Door Code</div>
                            <div className="font-mono text-lg font-semibold">{property.access_code}</div>
                          </div>
                        </div>
                      )}
                      {property.supply_closet_code && (
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
                          <Warehouse className="mt-0.5 h-5 w-5 text-primary" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-muted-foreground">Supply Closet Code</div>
                            <div className="font-mono text-lg font-semibold">{property.supply_closet_code}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* FOB Required Badge */}
                    {property.fob_required && (
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                        <Shield className="h-5 w-5 text-amber-600" />
                        <span className="font-medium text-amber-900 dark:text-amber-100">Physical FOB Required</span>
                      </div>
                    )}

                    {(property.wifi_name || property.parking_info || property.additional_access_instructions) && (
                      <Separator />
                    )}

                    {/* WiFi Information */}
                    {property.wifi_name && (
                      <div className="flex items-start gap-3">
                        <Wifi className="mt-1 h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">WiFi Network</div>
                          <div className="text-sm text-muted-foreground mt-1">{property.wifi_name}</div>
                          {property.wifi_password && (
                            <div className="mt-1 font-mono text-sm bg-muted px-2 py-1 rounded inline-block">
                              {property.wifi_password}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Parking Information */}
                    {property.parking_info && (
                      <div className="flex items-start gap-3">
                        <Car className="mt-1 h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">Parking</div>
                          <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {property.parking_info}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Access Instructions */}
                    {property.additional_access_instructions && (
                      <div className="flex items-start gap-3">
                        <Info className="mt-1 h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">Additional Instructions</div>
                          <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {property.additional_access_instructions}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* No access info message */}
                    {!property.gate_code &&
                      !property.building_code &&
                      !property.access_code &&
                      !property.supply_closet_code &&
                      !property.fob_required &&
                      !property.wifi_name &&
                      !property.parking_info &&
                      !property.additional_access_instructions && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Key className="h-12 w-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">No access information added yet.</p>
                          <p className="text-xs mt-1">Click "Edit Details" to add access codes and instructions.</p>
                        </div>
                      )}
                  </CardContent>
                </Card>

                {/* Special Instructions */}
                {property.special_instructions && (
                  <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                    <CardHeader>
                      <CardTitle className="text-amber-900 dark:text-amber-100">
                        Special Instructions for Cleaners
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap leading-relaxed text-amber-800 dark:text-amber-200">
                        {property.special_instructions}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Service History */}
                {recentJobs && recentJobs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Recent Services</CardTitle>
                        <Link href="/client-portal/jobs">
                          <Button variant="ghost" size="sm">
                            View All
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentJobs.map((job) => (
                          <div key={job.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="font-medium capitalize">{job.job_type.replace("_", " ")}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(job.scheduled_date).toLocaleDateString()}
                                  {job.scheduled_time && ` at ${job.scheduled_time}`}
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant={
                                job.status === "completed"
                                  ? "default"
                                  : job.status === "in_progress"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="capitalize"
                            >
                              {job.status.replace("_", " ")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Service Provider & Airbnb Info */}
              <div className="space-y-6">
                {/* Service Provider */}
                {property.companies ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Service Provider
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="mb-3 text-lg font-semibold">{property.companies.name}</div>
                        <div className="space-y-3 text-sm">
                          {property.companies.address && (
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                              <span>
                                {property.companies.address}
                                {property.companies.city && `, ${property.companies.city}`}
                                {property.companies.state && `, ${property.companies.state}`} {property.companies.zip}
                              </span>
                            </div>
                          )}
                          {property.companies.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <a href={`tel:${property.companies.phone}`} className="hover:text-foreground">
                                {property.companies.phone}
                              </a>
                            </div>
                          )}
                          {property.companies.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <a href={`mailto:${property.companies.email}`} className="hover:text-foreground">
                                {property.companies.email}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">{completedCount || 0}</div>
                          <div className="text-xs text-muted-foreground">Completed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{upcomingCount || 0}</div>
                          <div className="text-xs text-muted-foreground">Upcoming</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <Building2 className="mb-3 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 font-semibold">No Service Provider</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        This property hasn't been assigned to a cleaning company yet.
                      </p>
                      <Button variant="outline" size="sm">
                        Find Cleaners
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Property Details Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Property Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">{property.property_type}</span>
                    </div>
                    {property.square_feet && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Square Feet</span>
                        <span className="font-medium">{property.square_feet.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={property.status === "active" ? "default" : "secondary"} className="capitalize">
                        {property.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Airbnb Info */}
                {property.airbnb_listing_url && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Airbnb Listing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Listing ID</span>
                          <span className="font-mono text-xs">{property.airbnb_listing_id}</span>
                        </div>
                        {property.last_synced_at && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Synced</span>
                            <span className="text-xs">{new Date(property.last_synced_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Calendar Sync</span>
                          <Badge variant={property.sync_enabled ? "default" : "secondary"}>
                            {property.sync_enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </div>
                      <Separator />
                      <Link href={property.airbnb_listing_url} target="_blank">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          View on Airbnb
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
