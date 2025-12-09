import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createUserProfile } from "@/lib/supabase/actions"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      console.log("[v0] OAuth successful, user:", data.user.email)

      // Check if user profile exists, if not create it
      const { data: existingUser } = await supabase.from("users").select("*").eq("id", data.user.id).single()

      if (!existingUser) {
        console.log("[v0] Creating user profile for OAuth user")
        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "User"

        await createUserProfile(data.user.id, data.user.email!, fullName)
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

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}
