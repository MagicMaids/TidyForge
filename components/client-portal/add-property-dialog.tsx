"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, LinkIcon, Home, Loader2 } from "lucide-react"
import { importAirbnbProperty, createManualProperty } from "@/lib/actions/property-import"
import { useRouter } from "next/navigation"

export function AddPropertyDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Airbnb import state
  const [airbnbUrl, setAirbnbUrl] = useState("")

  // Manual entry state
  const [manualData, setManualData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    property_type: "airbnb",
    bedrooms: "",
    bathrooms: "",
    access_code: "",
    special_instructions: "",
  })

  const handleAirbnbImport = async () => {
    setError(null)
    setLoading(true)

    try {
      const result = await importAirbnbProperty(airbnbUrl)

      if (!result.success) {
        setError(result.error || "Failed to import property")
        return
      }

      // Success - close dialog and refresh
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleManualCreate = async () => {
    setError(null)
    setLoading(true)

    try {
      const result = await createManualProperty({
        ...manualData,
        bedrooms: manualData.bedrooms ? Number.parseInt(manualData.bedrooms) : undefined,
        bathrooms: manualData.bathrooms ? Number.parseFloat(manualData.bathrooms) : undefined,
      })

      if (!result.success) {
        setError(result.error || "Failed to create property")
        return
      }

      // Success - close dialog and refresh
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a Property</DialogTitle>
          <DialogDescription>Import from Airbnb or enter details manually</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="airbnb" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="airbnb">
              <LinkIcon className="h-4 w-4 mr-2" />
              Import from Airbnb
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Home className="h-4 w-4 mr-2" />
              Enter Manually
            </TabsTrigger>
          </TabsList>

          <TabsContent value="airbnb" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="airbnb-url">Airbnb Listing URL</Label>
                <Input
                  id="airbnb-url"
                  placeholder="https://www.airbnb.com/rooms/12345678"
                  value={airbnbUrl}
                  onChange={(e) => setAirbnbUrl(e.target.value)}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground mt-1">Paste the full URL of your Airbnb listing</p>
              </div>

              {error && <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">{error}</div>}

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">What we'll import:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Property details (address, bedrooms, bathrooms)</li>
                  <li>Photos and amenities</li>
                  <li>Calendar availability (iCal sync)</li>
                  <li>Booking information for scheduling</li>
                </ul>
              </div>

              <Button onClick={handleAirbnbImport} disabled={!airbnbUrl || loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import Property
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Property Name</Label>
                <Input
                  id="name"
                  placeholder="Cozy Downtown Apartment"
                  value={manualData.name}
                  onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St"
                  value={manualData.address}
                  onChange={(e) => setManualData({ ...manualData, address: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="San Francisco"
                    value={manualData.city}
                    onChange={(e) => setManualData({ ...manualData, city: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="CA"
                    value={manualData.state}
                    onChange={(e) => setManualData({ ...manualData, state: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    placeholder="94102"
                    value={manualData.zip}
                    onChange={(e) => setManualData({ ...manualData, zip: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="property-type">Property Type</Label>
                <Select
                  value={manualData.property_type}
                  onValueChange={(value) => setManualData({ ...manualData, property_type: value })}
                  disabled={loading}
                >
                  <SelectTrigger id="property-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airbnb">Airbnb</SelectItem>
                    <SelectItem value="vrbo">VRBO</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    placeholder="2"
                    value={manualData.bedrooms}
                    onChange={(e) => setManualData({ ...manualData, bedrooms: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    step="0.5"
                    placeholder="1.5"
                    value={manualData.bathrooms}
                    onChange={(e) => setManualData({ ...manualData, bathrooms: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="access-code">Access Code (optional)</Label>
                <Input
                  id="access-code"
                  placeholder="Door code or lock box info"
                  value={manualData.access_code}
                  onChange={(e) => setManualData({ ...manualData, access_code: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="special-instructions">Special Instructions (optional)</Label>
                <Textarea
                  id="special-instructions"
                  placeholder="Parking, entry instructions, etc."
                  value={manualData.special_instructions}
                  onChange={(e) => setManualData({ ...manualData, special_instructions: e.target.value })}
                  disabled={loading}
                />
              </div>

              {error && <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">{error}</div>}

              <Button
                onClick={handleManualCreate}
                disabled={!manualData.name || !manualData.address || !manualData.city || loading}
                className="w-full"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Property
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
