import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { priceId, planName } = await request.json()

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("company_id, full_name").eq("id", user.id).single()

    if (!userData?.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const { data: companyData } = await supabase
      .from("companies")
      .select("id, name, stripe_customer_id")
      .eq("id", userData.company_id)
      .single()

    if (!companyData) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    let customerId = companyData.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: companyData.name,
        metadata: {
          company_id: companyData.id,
          user_id: user.id,
        },
      })
      customerId = customer.id

      await supabase.from("companies").update({ stripe_customer_id: customerId }).eq("id", companyData.id)
    }

    const origin = request.headers.get("origin") || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard/billing?success=true`,
      cancel_url: `${origin}/dashboard/billing?canceled=true`,
      metadata: {
        company_id: companyData.id,
        plan_name: planName,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
