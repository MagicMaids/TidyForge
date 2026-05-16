"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
  const [isChecking, setIsChecking] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function determineOnboardingPath() {
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

        const { data: existingUser } = await supabase
          .from("users")
          .select("account_type, company_id, role")
          .eq("id", user.id)
          .maybeSingle()

        if (existingUser?.company_id && existingUser?.role === "admin") {
          router.push("/dashboard")
          return
        }

        if (existingUser?.account_type === "company_staff") {
          router.push("/staff-portal")
          return
        }

        // Check if they're a client portal user
        const { data: clientPortalUser } = await supabase
          .from("client_portal_users")
          .select("client_id")
          .eq("auth_user_id", user.id)
          .maybeSingle()

        if (clientPortalUser?.client_id) {
          // Already onboarded as client
          router.push("/client-portal")
          return
        }

        const accountType = user.user_metadata?.account_type
        const role = user.user_metadata?.role

        console.log("[v0] User metadata:", { accountType, role })

        if (role === "admin" || accountType === "company") {
          // Company owner/admin - continue with company setup
          await setupUserProfile(user, supabase)
        } else if (role === "cleaner" || accountType === "staff") {
          // Staff member - go to staff onboarding
          router.push("/onboarding/staff")
        } else if (role === "client" || accountType === "client") {
          // Client - go to client onboarding
          router.push("/onboarding/client")
        } else {
          // Default to company onboarding for backward compatibility
          await setupUserProfile(user, supabase)
        }
      } catch (error) {
        console.error("[v0] Onboarding router error:", error)
        router.push("/auth/sign-up")
      } finally {
        setIsChecking(false)
      }
    }

    async function setupUserProfile(user, supabase) {
      try {
        // Check if user profile exists
        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()

        console.log("[v0] Existing user check:", { exists: !!existingUser, error: checkError })

        if (existingUser) {
          // User already has a profile, redirect to dashboard
          console.log("[v0] User profile already exists, redirecting to dashboard")
          setIsReady(true)
          setIsLoading(false)
          return
        }

        const companyName = user.user_metadata?.company_name || "My Company"
        const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"

        console.log("[v0] Creating company:", companyName)

        const { data: company, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: companyName,
            email: user.email,
            subscription_status: "trial",
            subscription_plan: "starter",
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single()

        console.log("[v0] Company creation result:", {
          success: !!company,
          error: companyError,
          companyId: company?.id,
        })

        if (companyError || !company) {
          console.error("[v0] Company creation failed:", companyError)
          setError(
            companyError
              ? `Failed to create company profile: ${companyError.message}`
              : "Failed to create company profile. Please check your permissions and try again.",
          )
          setIsLoading(false)
          return
        }

        console.log("[v0] Creating user profile for company:", company.id)

        const { data: userProfile, error: userProfileError } = await supabase
          .from("users")
          .insert({
            id: user.id,
            company_id: company.id,
            email: user.email!,
            full_name: fullName,
            phone: user.user_metadata?.phone || null,
            role: "admin",
            is_active: true,
          })
          .select()
          .single()

        console.log("[v0] User profile creation result:", {
          success: !!userProfile,
          error: userProfileError,
        })

        if (userProfileError || !userProfile) {
          console.error("[v0] User profile creation failed:", userProfileError)
          setError(
            userProfileError
              ? `Failed to create user profile: ${userProfileError.message}`
              : "Failed to create user profile. Please check your permissions and try again.",
          )
          setIsLoading(false)
          return
        }

        // Success!
        console.log("[v0] Onboarding complete! Company and user created successfully")
        setIsReady(true)
        setIsLoading(false)
      } catch (err) {
        console.error("[v0] Onboarding error:", err)
        setError("An unexpected error occurred. Please try again.")
        setIsLoading(false)
      }
    }

    determineOnboardingPath()
  }, [router])

  if (isChecking) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
        <div className="w-full max-w-2xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Preparing your account...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
        <div className="w-full max-w-2xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Setting up your account...</p>
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
              <CardDescription>Your account has been created successfully</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  You&apos;re all set! Click below to access your dashboard and start managing your cleaning operations.
                </p>

                <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Company Profile Created</p>
                      <p className="text-sm text-muted-foreground">Your company workspace is ready</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Admin Account Configured</p>
                      <p className="text-sm text-muted-foreground">You have full access to all features</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Ready to Get Started</p>
                      <p className="text-sm text-muted-foreground">
                        Add properties, schedule jobs, and manage your team
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/dashboard" className="w-full">
                  <Button className="w-full" size="lg">
                    Continue to Dashboard
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
