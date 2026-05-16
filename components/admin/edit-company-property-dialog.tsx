"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, ExternalLink } from "lucide-react"
import { updateCompanyProperty } from "@/lib/actions/company-property-actions"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  gate_code?: string
  building_code?: string
  access_code?: string
  supply_closet_code?: string
  fob_required?: boolean
  wifi_name?: string
  wifi_password?: string
  parking_info?: string
  additional_access_instructions?: string
  special_instructions?: string
  airbnb_ical_url?: string
  calendar_source_type?: string
  calendar_url?: string
}

interface EditCompanyPropertyDialogProps {
  property: Property
}

export function EditCompanyPropertyDialog({ property }: EditCompanyPropertyDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: property.name,
    address: property.address,
    city: property.city,
    state: property.state,
    zip: property.zip,
    gate_code: property.gate_code || "",
    building_code: property.building_code || "",
    access_code: property.access_code || "",
    supply_closet_code: property.supply_closet_code || "",
    fob_required: property.fob_required || false,
    wifi_name: property.wifi_name || "",
    wifi_password: property.wifi_password || "",
    parking_info: property.parking_info || "",
    additional_access_instructions: property.additional_access_instructions || "",
    special_instructions: property.special_instructions || "",
    calendar_source_type: property.calendar_source_type || (property.airbnb_ical_url ? "airbnb" : "manual"),
    calendar_url: property.calendar_url || property.airbnb_ical_url || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await updateCompanyProperty(property.id, formData)

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
      } else {
        toast({
          title: "Success",
          description: "Property details updated successfully",
        })
        setOpen(false)
        router.refresh()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update property details",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property Details</DialogTitle>
          <DialogDescription>Update property information, access codes, and special instructions.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Property Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Access Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gate_code">Gate Code</Label>
                <Input
                  id="gate_code"
                  value={formData.gate_code}
                  onChange={(e) => setFormData({ ...formData, gate_code: e.target.value })}
                  placeholder="e.g., #1234"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="building_code">Building Code</Label>
                <Input
                  id="building_code"
                  value={formData.building_code}
                  onChange={(e) => setFormData({ ...formData, building_code: e.target.value })}
                  placeholder="e.g., 5678#"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="access_code">Door Code</Label>
                <Input
                  id="access_code"
                  value={formData.access_code}
                  onChange={(e) => setFormData({ ...formData, access_code: e.target.value })}
                  placeholder="e.g., 1234#"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supply_closet_code">Supply Closet Code</Label>
                <Input
                  id="supply_closet_code"
                  value={formData.supply_closet_code}
                  onChange={(e) => setFormData({ ...formData, supply_closet_code: e.target.value })}
                  placeholder="e.g., 9876"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="fob_required">FOB Required</Label>
                <div className="text-sm text-muted-foreground">Physical key fob needed for access</div>
              </div>
              <Switch
                id="fob_required"
                checked={formData.fob_required}
                onCheckedChange={(checked) => setFormData({ ...formData, fob_required: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parking_info">Parking Information</Label>
              <Textarea
                id="parking_info"
                value={formData.parking_info}
                onChange={(e) => setFormData({ ...formData, parking_info: e.target.value })}
                placeholder="Where to park, parking pass instructions, etc."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_access_instructions">Additional Access Instructions</Label>
              <Textarea
                id="additional_access_instructions"
                value={formData.additional_access_instructions}
                onChange={(e) => setFormData({ ...formData, additional_access_instructions: e.target.value })}
                placeholder="Any other access details or instructions"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground">Calendar Sync</h3>
              <a
                href="https://help.tidyforge.com/calendar-sync"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Setup Guide <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calendar_source_type">Calendar Source</Label>
              <Select
                value={formData.calendar_source_type}
                onValueChange={(value) => setFormData({ ...formData, calendar_source_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select calendar source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Entry (No Sync)</SelectItem>
                  <SelectItem value="airbnb">Airbnb Direct</SelectItem>
                  <SelectItem value="vrbo">VRBO Direct</SelectItem>
                  <SelectItem value="booking_com">Booking.com Direct</SelectItem>
                  <SelectItem value="hostaway">Hostaway PMS</SelectItem>
                  <SelectItem value="guesty">Guesty PMS</SelectItem>
                  <SelectItem value="hospitable">Hospitable PMS</SelectItem>
                  <SelectItem value="other_pms">Other PMS</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.calendar_source_type === "manual" &&
                  "Jobs will be created manually. No automatic calendar sync."}
                {formData.calendar_source_type === "airbnb" && "Sync directly from Airbnb calendar export"}
                {formData.calendar_source_type === "vrbo" && "Sync directly from VRBO calendar export"}
                {formData.calendar_source_type === "booking_com" && "Sync directly from Booking.com calendar export"}
                {(formData.calendar_source_type === "hostaway" ||
                  formData.calendar_source_type === "guesty" ||
                  formData.calendar_source_type === "hospitable" ||
                  formData.calendar_source_type === "other_pms") &&
                  "Sync from your PMS unified calendar (includes bookings from all connected platforms)"}
              </p>
            </div>

            {formData.calendar_source_type !== "manual" && (
              <div className="space-y-2">
                <Label htmlFor="calendar_url">iCal Export URL</Label>
                <Input
                  id="calendar_url"
                  type="url"
                  value={formData.calendar_url}
                  onChange={(e) => setFormData({ ...formData, calendar_url: e.target.value })}
                  placeholder="https://..."
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Where to find your iCal URL:</p>
                  {formData.calendar_source_type === "airbnb" && (
                    <p>
                      Airbnb → Listing Calendar → Availability Settings → Calendar Sync → Export Calendar. URL should
                      include ?s= authentication token.
                    </p>
                  )}
                  {formData.calendar_source_type === "vrbo" && (
                    <p>VRBO → Calendar → Export Calendar → Copy iCal link</p>
                  )}
                  {formData.calendar_source_type === "booking_com" && (
                    <p>Booking.com → Calendar → Sync Calendar → Export iCal feed</p>
                  )}
                  {formData.calendar_source_type === "hostaway" && (
                    <p>
                      Hostaway → Listing → Calendar → iCal Feeds → Export. This includes ALL bookings from Airbnb, VRBO,
                      Booking.com, etc.
                    </p>
                  )}
                  {formData.calendar_source_type === "guesty" && (
                    <p>
                      Guesty → Listings → Select Listing → Calendar Settings → iCal Export. Includes bookings from all
                      channels.
                    </p>
                  )}
                  {formData.calendar_source_type === "hospitable" && (
                    <p>
                      Hospitable → Properties → Select Property → Integrations → Calendar Export → Copy iCal URL.
                      Includes all platform bookings.
                    </p>
                  )}
                  {formData.calendar_source_type === "other_pms" && (
                    <p>Check your PMS documentation for iCal export or calendar sync options.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm text-muted-foreground">WiFi & Connectivity</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wifi_name">WiFi Network Name</Label>
                <Input
                  id="wifi_name"
                  value={formData.wifi_name}
                  onChange={(e) => setFormData({ ...formData, wifi_name: e.target.value })}
                  placeholder="Network name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wifi_password">WiFi Password</Label>
                <Input
                  id="wifi_password"
                  type="text"
                  value={formData.wifi_password}
                  onChange={(e) => setFormData({ ...formData, wifi_password: e.target.value })}
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Special Instructions</h3>
            <Textarea
              id="special_instructions"
              value={formData.special_instructions}
              onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
              placeholder="Any special notes for cleaners (fragile items, pet instructions, etc.)"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
