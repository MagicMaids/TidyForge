import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("[v0] API Onboarding - checking user:", { userId: user?.id, error: userError })

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user profile already exists
    const { data: existingUser } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()

    if (existingUser) {
      return NextResponse.json({ success: true, message: "User already exists" })
    }

    // Get metadata from request or user metadata
    const body = await request.json().catch(() => ({}))
    const fullName = body.fullName || user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
    const companyName = body.companyName || user.user_metadata?.company_name || `${fullName}'s Company`
    const phone = body.phone || user.user_metadata?.phone || ""

    console.log("[v0] API Creating company:", companyName)

    const adminClient = await createServiceClient()

    // Create company using service role to bypass RLS
    const { data: company, error: companyError } = await adminClient
      .from("companies")
      .insert({
        name: companyName,
        email: user.email!,
        subscription_status: "trial",
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    console.log("[v0] API Company creation result:", { success: !!company, error: companyError })

    if (companyError || !company) {
      console.error("[v0] API Company creation error:", companyError)
      return NextResponse.json({ error: "Failed to create company", details: companyError }, { status: 500 })
    }

    // Create user profile using service role
    const { error: userCreateError } = await adminClient.from("users").insert({
      id: user.id,
      company_id: company.id,
      email: user.email!,
      full_name: fullName,
      phone: phone,
      role: "admin",
    })

    console.log("[v0] API User creation result:", { error: userCreateError })

    if (userCreateError) {
      console.error("[v0] API User creation error:", userCreateError)
      // Try to clean up the company if user creation failed
      await adminClient.from("companies").delete().eq("id", company.id)
      return NextResponse.json({ error: "Failed to create user profile", details: userCreateError }, { status: 500 })
    }

    return NextResponse.json({ success: true, companyId: company.id })
  } catch (error) {
    console.error("[v0] API Onboarding error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
