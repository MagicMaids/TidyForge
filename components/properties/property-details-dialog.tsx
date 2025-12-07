"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MapPin, Key, User, FileText } from "lucide-react"

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

export function PropertyDetailsDialog({
  property,
  open,
  onOpenChange,
  onPropertyUpdated,
}: {
  property: Property
  open: boolean
  onOpenChange: (open: boolean) => void
  onPropertyUpdated: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{property.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Address</p>
                <p className="text-sm text-muted-foreground">{property.address}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Client</p>
                {property.clients ? (
                  <div>
                    <p className="text-sm">{property.clients.name}</p>
                    <p className="text-sm text-muted-foreground">{property.clients.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No client assigned</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Access Code</p>
                {property.access_code ? (
                  <Badge variant="secondary" className="text-lg font-mono px-4 py-2">
                    {property.access_code}
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">No access code set</p>
                )}
              </div>
            </div>
          </div>

          {property.access_instructions && (
            <>
              <Separator />
              <div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">Access Instructions</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{property.access_instructions}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
