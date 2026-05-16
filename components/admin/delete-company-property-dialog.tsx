"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { deleteCompanyProperty } from "@/lib/actions/company-property-actions"
import { toast } from "sonner"

interface DeleteCompanyPropertyDialogProps {
  propertyId: string
  propertyName: string
  variant?: "default" | "destructive" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  redirectOnDelete?: boolean
}

export function DeleteCompanyPropertyDialog({
  propertyId,
  propertyName,
  variant = "destructive",
  size = "default",
  redirectOnDelete = false,
}: DeleteCompanyPropertyDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setIsDeleting(true)

    const result = await deleteCompanyProperty(propertyId)

    if (result.success) {
      toast.success("Property removed from company")
      setOpen(false)
      if (redirectOnDelete) {
        router.push("/dashboard/properties")
      } else {
        router.refresh()
      }
    } else {
      toast.error(result.error || "Failed to remove property")
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={isDeleting}>
          <Trash2 className="h-4 w-4" />
          {size !== "icon" && <span className="ml-2">Remove Property</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Property from Company?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{propertyName}</strong> from your company? This will remove the
            property from your dashboard and disable automatic booking sync. The client will be able to reassign this
            property to another company. Completed jobs and service history will be preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              "Remove Property"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
