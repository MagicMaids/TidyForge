"use client"

import { useState } from "react"
import { AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { endImpersonation } from "@/lib/actions/impersonation"
import { useRouter } from "next/navigation"

interface ImpersonationBannerProps {
  companyName: string
  startedAt: string
}

export function ImpersonationBanner({ companyName, startedAt }: ImpersonationBannerProps) {
  const [isEnding, setIsEnding] = useState(false)
  const router = useRouter()

  const handleEndImpersonation = async () => {
    setIsEnding(true)
    const result = await endImpersonation()
    if (result.success) {
      router.push("/admin")
      router.refresh()
    } else {
      setIsEnding(false)
      alert(result.error)
    }
  }

  const duration = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000 / 60)

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-500">
              Impersonating Company: <span className="font-bold">{companyName}</span>
            </p>
            <p className="text-xs text-amber-500/80">Session active for {duration} minutes</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEndImpersonation}
          disabled={isEnding}
          className="border-amber-500/20 hover:bg-amber-500/10 bg-transparent"
        >
          <X className="h-4 w-4 mr-1" />
          {isEnding ? "Ending..." : "End Session"}
        </Button>
      </div>
    </div>
  )
}
