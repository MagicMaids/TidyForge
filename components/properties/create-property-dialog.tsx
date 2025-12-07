"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface Client {
  id: string
  name: string
  email: string
}

export function CreatePropertyDialog({
  open,
  onOpenChange,
  companyId,
  onPropertyCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  onPropertyCreated: () => void
}) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    access_code: "",
    access_instructions: "",
    client_id: "",
  })

  useEffect(() => {
    if (open) {
      fetchClients()
    }
  }, [open, companyId])

  async function fetchClients() {
    const supabase = createBrowserClient()
    const { data } = await supabase.from("clients").select("id, name, email").eq("company_id", companyId)
    if (data) setClients(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createBrowserClient()

    const { error } = await supabase.from("properties").insert({
      company_id: companyId,
      name: formData.name,
      address: formData.address,
      access_code: formData.access_code || null,
      access_instructions: formData.access_instructions || null,
      client_id: formData.client_id || null,
    })

    setLoading(false)

    if (error) {
      toast.error("Failed to create property")
      console.error(error)
      return
    }

    toast.success("Property created successfully")
    onOpenChange(false)
    onPropertyCreated()

    setFormData({
      name: "",
      address: "",
      access_code: "",
      access_instructions: "",
      client_id: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>Register a new property in your system</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Property Name</Label>
              <Input
                id="name"
                placeholder="Ocean View Apartment"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Beach Rd, Miami, FL 33139"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client">Client (Optional)</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
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

            <div className="grid gap-2">
              <Label htmlFor="access_code">Access Code</Label>
              <Input
                id="access_code"
                placeholder="1234 or ABC123"
                value={formData.access_code}
                onChange={(e) => setFormData({ ...formData, access_code: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="access_instructions">Access Instructions</Label>
              <Textarea
                id="access_instructions"
                placeholder="Enter through the side gate. Lockbox is on the front door handle."
                value={formData.access_instructions}
                onChange={(e) => setFormData({ ...formData, access_instructions: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Property"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
