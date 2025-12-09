"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function signInWithGoogleAction() {
  const supabase = await createClient()
  const requestHeaders = await headers()
  const origin = requestHeaders.get("origin")

  if (!origin) {
    console.error("[v0] Missing origin header")
    return redirect("/auth/login?error=OriginMissing")
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  })

  if (error) {
    console.error("[v0] Error signing in with Google:", error)
    return redirect(`/auth/login?error=OAuthSigninFailed&message=${encodeURIComponent(error.message)}`)
  }

  if (data.url) {
    return redirect(data.url)
  } else {
    console.error("[v0] signInWithOAuth did not return a URL")
    return redirect("/auth/login?error=OAuthConfigurationError")
  }
}

export async function createUserProfile(userId: string, email: string, fullName: string) {
  const supabase = await createClient()

  // Check if user profile already exists
  const { data: existingUser } = await supabase.from("users").select("*").eq("id", userId).single()

  if (existingUser) {
    return { success: true, user: existingUser }
  }

  // Create company first (for OAuth users, we'll use a default company name they can update later)
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: `${fullName}'s Company`,
      email: email,
      subscription_status: "trial",
      subscription_plan: "starter",
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  if (companyError) {
    console.error("[v0] Error creating company:", companyError)
    return { success: false, error: companyError }
  }

  // Create user profile
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      id: userId,
      company_id: company.id,
      email: email,
      full_name: fullName,
      role: "admin",
    })
    .select()
    .single()

  if (userError) {
    console.error("[v0] Error creating user profile:", userError)
    return { success: false, error: userError }
  }

  return { success: true, user, company }
}
