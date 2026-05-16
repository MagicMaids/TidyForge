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
import { deleteProperty } from "@/lib/actions/property-import"
import { toast } from "sonner"

interface DeletePropertyDialogProps {
  propertyId: string
  propertyName: string
  variant?: "default" | "destructive" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  redirectOnDelete?: boolean
}

export function DeletePropertyDialog({
  propertyId,
  propertyName,
  variant = "destructive",
  size = "default",
  redirectOnDelete = false,
}: DeletePropertyDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setIsDeleting(true)

    const result = await deleteProperty(propertyId)

    if (result.success) {
      toast.success("Property deleted successfully")
      setOpen(false)
      if (redirectOnDelete) {
        router.push("/client-portal/properties")
      } else {
        router.refresh()
      }
    } else {
      toast.error(result.error || "Failed to delete property")
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={isDeleting}>
          <Trash2 className="h-4 w-4" />
          {size !== "icon" && <span className="ml-2">Delete Property</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Property?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{propertyName}</strong>? This action cannot be undone. All
            associated service history and data will be permanently removed.
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
                Deleting...
              </>
            ) : (
              "Delete Property"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
