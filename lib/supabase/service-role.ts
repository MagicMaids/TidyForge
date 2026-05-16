import { createClient } from "@supabase/supabase-js"

let serviceRoleClient: ReturnType<typeof createClient> | null = null

export function createServiceRoleClient() {
  if (serviceRoleClient) {
    return serviceRoleClient
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log("[v0] Service role client env check:", {
    hasUrl: !!supabaseUrl,
    urlPrefix: supabaseUrl?.substring(0, 30),
    hasServiceKey: !!supabaseServiceKey,
    keyPrefix: supabaseServiceKey?.substring(0, 20),
  })

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(`Missing Supabase service role credentials: URL=${!!supabaseUrl}, Key=${!!supabaseServiceKey}`)
  }

  serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log("[v0] Service role client created successfully")

  return serviceRoleClient
}
