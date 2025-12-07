"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Key, User, ArrowLeft } from "lucide-react"
import { CreatePropertyDialog } from "./create-property-dialog"
import { PropertyDetailsDialog } from "./property-details-dialog"
import Link from "next/link"

interface Property {
  id: string
  name: string
  address: string
  access_code: string | null
  access_instructions: string | null
  client_id: string | null
  clients: {
    name: string
    email: string
  } | null
}

export function PropertiesManager({ companyId, userRole }: { companyId: string; userRole: string }) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  async function fetchProperties() {
    const supabase = createBrowserClient()

    const { data, error } = await supabase
      .from("properties")
      .select(
        `
        id,
        name,
        address,
        access_code,
        access_instructions,
        client_id,
        clients (name, email)
      `,
      )
      .eq("company_id", companyId)
      .order("name")

    if (!error && data) {
      setProperties(data as Property[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProperties()
  }, [companyId])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link
            href="/dashboard"
            className="mr-4 flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex flex-1 items-center justify-end">
            <span className="font-bold">TidyForge</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
            <p className="text-muted-foreground">Manage property listings and access information</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Properties</CardTitle>
                  <CardDescription>View and manage all registered properties</CardDescription>
                </div>
                {(userRole === "admin" || userRole === "manager") && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Property
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                  ))}
                </div>
              ) : properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Add your first property to get started</p>
                  {(userRole === "admin" || userRole === "manager") && (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Property
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((property) => (
                      <TableRow
                        key={property.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedProperty(property)}
                      >
                        <TableCell className="font-medium">{property.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {property.address}
                          </div>
                        </TableCell>
                        <TableCell>
                          {property.clients ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {property.clients.name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No client</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {property.access_code ? (
                            <Badge variant="secondary" className="gap-1">
                              <Key className="h-3 w-3" />
                              Code available
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No code</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedProperty(property)
                            }}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <CreatePropertyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        companyId={companyId}
        onPropertyCreated={fetchProperties}
      />

      {selectedProperty && (
        <PropertyDetailsDialog
          property={selectedProperty}
          open={!!selectedProperty}
          onOpenChange={(open) => !open && setSelectedProperty(null)}
          onPropertyUpdated={fetchProperties}
        />
      )}
    </div>
  )
}
