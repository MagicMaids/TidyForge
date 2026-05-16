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
import { Plus, LinkIcon, Home, Loader2, UserPlus } from "lucide-react"
import { importAirbnbPropertyForCompany, createManualPropertyForCompany } from "@/lib/actions/company-property-actions"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"

type Client = {
  id: string
  name: string
  email: string
}

export function AddCompanyPropertyDialog({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Client management state
  const [clientMode, setClientMode] = useState<"existing" | "new" | "none">("existing")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [inviteClient, setInviteClient] = useState(false)

  // New client data
  const [newClientData, setNewClientData] = useState({
    name: "",
    email: "",
    phone: "",
  })

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
    if (clientMode === "existing" && !selectedClientId) {
      setError("Please select a client")
      return
    }
    if (clientMode === "new" && (!newClientData.name || !newClientData.email)) {
      setError("Please enter client name and email")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const result = await importAirbnbPropertyForCompany({
        airbnbUrl,
        clientMode,
        existingClientId: clientMode === "existing" ? selectedClientId : undefined,
        newClient: clientMode === "new" ? newClientData : undefined,
        inviteClient,
      })

      if (!result.success) {
        setError(result.error || "Failed to import property")
        return
      }

      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleManualCreate = async () => {
    if (clientMode === "existing" && !selectedClientId) {
      setError("Please select a client")
      return
    }
    if (clientMode === "new" && (!newClientData.name || !newClientData.email)) {
      setError("Please enter client name and email")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const result = await createManualPropertyForCompany({
        ...manualData,
        bedrooms: manualData.bedrooms ? Number.parseInt(manualData.bedrooms) : undefined,
        bathrooms: manualData.bathrooms ? Number.parseFloat(manualData.bathrooms) : undefined,
        clientMode,
        existingClientId: clientMode === "existing" ? selectedClientId : undefined,
        newClient: clientMode === "new" ? newClientData : undefined,
        inviteClient,
      })

      if (!result.success) {
        setError(result.error || "Failed to create property")
        return
      }

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Client Property</DialogTitle>
          <DialogDescription>Import from iCal URL or enter details manually</DialogDescription>
        </DialogHeader>

        {/* Client Selection/Creation Section */}
        <div className="space-y-4 pb-4 border-b">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant={clientMode === "existing" ? "default" : "outline"}
              onClick={() => setClientMode("existing")}
              size="sm"
            >
              Existing Client
            </Button>
            <Button
              type="button"
              variant={clientMode === "new" ? "default" : "outline"}
              onClick={() => setClientMode("new")}
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              New Client
            </Button>
            <Button
              type="button"
              variant={clientMode === "none" ? "default" : "outline"}
              onClick={() => setClientMode("none")}
              size="sm"
            >
              No Client
            </Button>
          </div>

          {clientMode === "existing" ? (
            <div>
              <Label htmlFor="client-select">Select Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={loading}>
                <SelectTrigger id="client-select">
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : clientMode === "new" ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="new-client-name">Client Name *</Label>
                <Input
                  id="new-client-name"
                  placeholder="John Doe"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="new-client-email">Client Email *</Label>
                <Input
                  id="new-client-email"
                  type="email"
                  placeholder="john@example.com"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="new-client-phone">Client Phone</Label>
                <Input
                  id="new-client-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="invite-client"
                  checked={inviteClient}
                  onCheckedChange={setInviteClient}
                  disabled={loading}
                />
                <Label htmlFor="invite-client" className="text-sm cursor-pointer">
                  Send invitation to access client portal
                </Label>
              </div>
            </div>
          ) : (
            <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
              This property will not be associated with a client. You can add a client later from the property details
              page.
            </div>
          )}
        </div>

        <Tabs defaultValue="airbnb" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="airbnb">
              <LinkIcon className="h-4 w-4 mr-2" />
              Import Listing
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Home className="h-4 w-4 mr-2" />
              Enter Manually
            </TabsTrigger>
          </TabsList>

          <TabsContent value="airbnb" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="airbnb-url">Listing URL or iCal URL</Label>
                <Input
                  id="airbnb-url"
                  placeholder="https://www.airbnb.com/rooms/12345678 or https://platform.hostaway.com/ical/..."
                  value={airbnbUrl}
                  onChange={(e) => setAirbnbUrl(e.target.value)}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Paste Airbnb listing URL, Hostaway iCal URL, VRBO URL, or any iCal feed URL
                </p>
              </div>

              {error && <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">{error}</div>}

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Supported platforms:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Airbnb (listing URL or iCal)</li>
                  <li>Hostaway, Guesty, Hospitable (iCal)</li>
                  <li>VRBO, Booking.com (listing or iCal)</li>
                  <li>Any standard iCal feed</li>
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
