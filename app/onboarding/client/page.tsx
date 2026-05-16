"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientProfile } from "@/lib/actions/client-onboarding"

export default function ClientOnboardingPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function setupClientProfile() {
      try {
        const supabase = createClient()
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/auth/login")
          return
        }

        // Check if client portal user already exists
        const { data: existingPortalUser } = await supabase
          .from("client_portal_users")
          .select("*")
          .eq("auth_user_id", user.id)
          .maybeSingle()

        if (existingPortalUser) {
          setIsReady(true)
          setIsLoading(false)
          return
        }

        const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
        const phone = user.user_metadata?.phone || null

        const result = await createClientProfile({
          fullName,
          email: user.email!,
          phone,
          authUserId: user.id,
        })

        if (result.error) {
          setError(`Failed to create client profile: ${result.error}`)
          setIsLoading(false)
          return
        }

        setIsReady(true)
        setIsLoading(false)
      } catch (err) {
        console.error("[v0] Client onboarding error:", err)
        setError("An unexpected error occurred. Please try again.")
        setIsLoading(false)
      }
    }

    setupClientProfile()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
        <div className="w-full max-w-2xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Setting up your client portal...</p>
              <p className="text-sm text-muted-foreground mt-2">This will only take a moment</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
        <div className="w-full max-w-2xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-lg font-medium text-destructive mb-2">Setup Failed</p>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              TF
            </div>
            <span className="text-2xl font-semibold">TidyForge</span>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Welcome to TidyForge!</CardTitle>
              <CardDescription>Your client portal is ready</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Your account has been created. Access your portal to manage properties and view cleaning schedules.
                </p>

                <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Portal Access Granted</p>
                      <p className="text-sm text-muted-foreground">Manage your properties and services</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Ready to Add Properties</p>
                      <p className="text-sm text-muted-foreground">Start by adding your first property</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/client-portal" className="w-full">
                  <Button className="w-full" size="lg">
                    Go to Client Portal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
