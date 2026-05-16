"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Building2, Home, Users } from "lucide-react"

export default function SignUpPage() {
  const [accountType, setAccountType] = useState<"company" | "client" | "staff">("company")
  const [companyName, setCompanyName] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const nextPath =
        accountType === "company"
          ? "/onboarding/company"
          : accountType === "staff"
            ? "/onboarding/staff"
            : "/onboarding/client"

      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${nextPath}`
          : `${process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || "http://localhost:3000"}/auth/callback?next=${nextPath}`

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            company_name: accountType === "company" ? companyName : undefined,
            phone: phone,
            account_type:
              accountType === "company" ? "company_staff" : accountType === "staff" ? "company_staff" : "client",
            role: accountType === "company" ? "admin" : accountType === "staff" ? "cleaner" : "client",
          },
        },
      })

      if (signUpError) {
        if (signUpError.message?.includes("User already registered")) {
          setError("An account with this email already exists. Please sign in instead.")
        } else if (signUpError.message?.includes("Password should be")) {
          setError("Password must be at least 6 characters long.")
        } else if (signUpError.message?.includes("Invalid email")) {
          setError("Please enter a valid email address.")
        } else {
          setError(`Sign-up failed: ${signUpError.message}`)
        }
        return
      }

      if (data.user) {
        router.push("/auth/sign-up-success")
      }
    } catch (error: unknown) {
      console.error("[v0] Unexpected sign-up error:", error)
      setError("An unexpected error occurred. Please try again or contact support.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError(null)
    try {
      const supabase = createClient()

      const nextPath =
        accountType === "company"
          ? "/onboarding/company"
          : accountType === "staff"
            ? "/onboarding/staff"
            : "/onboarding/client"

      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}&account_type=${accountType}`

      console.log("[v0] Google OAuth redirect URL:", redirectTo)

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (oauthError) {
        console.error("[v0] Google sign-up error:", oauthError)
        setError("Failed to initialize Google sign-in. Please try again.")
        setIsGoogleLoading(false)
        return
      }

      if (data.url) {
        console.log("[v0] Redirecting to Google OAuth:", data.url)
        window.location.href = data.url
      }
    } catch (error: unknown) {
      console.error("[v0] Google sign-up error:", error)
      setError(error instanceof Error ? error.message : "An error occurred with Google sign-in")
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              TF
            </div>
            <span className="text-2xl font-semibold">TidyForge</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create Your Account</CardTitle>
              <CardDescription>Choose your account type to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-3">
                    <Label>Account Type</Label>
                    <RadioGroup
                      value={accountType}
                      onValueChange={(value) => setAccountType(value as "company" | "client" | "staff")}
                    >
                      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="company" id="company" />
                        <Label htmlFor="company" className="flex-1 cursor-pointer">
                          <div className="flex items-start gap-3">
                            <Building2 className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <div className="font-medium">Cleaning Company</div>
                              <div className="text-sm text-muted-foreground">
                                Manage properties, schedule jobs, and coordinate your team
                              </div>
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="staff" id="staff" />
                        <Label htmlFor="staff" className="flex-1 cursor-pointer">
                          <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <div className="font-medium">Staff Member / Cleaner</div>
                              <div className="text-sm text-muted-foreground">
                                Join a cleaning company to manage jobs and schedules
                              </div>
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="client" id="client" />
                        <Label htmlFor="client" className="flex-1 cursor-pointer">
                          <div className="flex items-start gap-3">
                            <Home className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <div className="font-medium">Property Owner / Host</div>
                              <div className="text-sm text-muted-foreground">
                                Manage your properties and coordinate cleaning services
                              </div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {isGoogleLoading ? "Signing up..." : "Continue with Google"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                  </div>

                  {accountType === "company" && (
                    <div className="grid gap-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input
                        id="company-name"
                        type="text"
                        placeholder="Sparkle Clean Co."
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={isLoading || isGoogleLoading}
                      />
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="full-name">{accountType === "company" ? "Your Full Name" : "Full Name"}</Label>
                    <Input
                      id="full-name"
                      type="text"
                      placeholder={
                        accountType === "company" ? "John Doe" : accountType === "staff" ? "Jane Doe" : "Jane Smith"
                      }
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="555-0100"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">Confirm Password</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                      {error}
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="underline underline-offset-4">
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
