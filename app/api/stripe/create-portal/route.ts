import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("company_id").eq("id", user.id).single()

    if (!userData?.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const { data: companyData } = await supabase
      .from("companies")
      .select("stripe_customer_id")
      .eq("id", userData.company_id)
      .single()

    if (!companyData?.stripe_customer_id) {
      return NextResponse.json({ error: "No customer ID found" }, { status: 404 })
    }

    const origin = request.headers.get("origin") || "http://localhost:3000"

    const session = await stripe.billingPortal.sessions.create({
      customer: companyData.stripe_customer_id,
      return_url: `${origin}/dashboard/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating portal session:", error)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
