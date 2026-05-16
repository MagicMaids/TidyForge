import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"
  const accountType = searchParams.get("account_type") ?? "company"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log("[v0] Auth callback - exchangeCodeForSession result:", {
      hasUser: !!data?.user,
      userId: data?.user?.id,
      accountType,
      error,
    })

    if (!error && data.user) {
      const { data: existingUser } = await supabase.from("users").select("*").eq("id", data.user.id).maybeSingle()

      console.log("[v0] Existing user check:", { exists: !!existingUser, userId: data.user.id })

      if (!existingUser) {
        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "User"

        if (accountType === "company") {
          const companyName = data.user.user_metadata?.company_name || `${fullName}'s Company`

          console.log("[v0] Creating new company:", companyName)

          const { data: company, error: companyError } = await supabase
            .from("companies")
            .insert({
              name: companyName,
              email: data.user.email!,
              subscription_status: "trial",
              trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single()

          console.log("[v0] Company creation result:", {
            hasCompany: !!company,
            companyId: company?.id,
            error: companyError,
          })

          if (!companyError && company) {
            const { error: userError } = await supabase.from("users").insert({
              id: data.user.id,
              company_id: company.id,
              email: data.user.email!,
              full_name: fullName,
              role: "admin",
              account_type: "company_staff",
            })

            console.log("[v0] User creation result:", {
              userId: data.user.id,
              companyId: company.id,
              error: userError,
            })
          }
        } else if (accountType === "client") {
          console.log("[v0] Creating client account for:", fullName)

          const { data: client, error: clientError } = await supabase
            .from("clients")
            .insert({
              name: fullName,
              email: data.user.email!,
              phone: data.user.user_metadata?.phone || null,
            })
            .select()
            .single()

          console.log("[v0] Client creation result:", {
            hasClient: !!client,
            clientId: client?.id,
            error: clientError,
          })

          if (!clientError && client) {
            const { error: portalError } = await supabase.from("client_portal_users").insert({
              email: data.user.email!,
              client_id: client.id,
              auth_user_id: data.user.id,
              is_active: true,
            })

            console.log("[v0] Client portal user creation result:", { error: portalError })

            const { error: userError } = await supabase.from("users").insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: fullName,
              role: "client",
              account_type: "client",
              company_id: null,
            })

            console.log("[v0] User creation result:", {
              userId: data.user.id,
              error: userError,
            })
          }
        } else if (accountType === "staff") {
          console.log("[v0] Creating staff member account for:", fullName)

          const { error: userError } = await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
            role: "cleaner",
            account_type: "company_staff",
            company_id: null,
          })

          console.log("[v0] Staff user creation result:", {
            userId: data.user.id,
            error: userError,
          })
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
