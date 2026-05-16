import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr"

export function createClient() {
  // Client-side env vars must be prefixed with NEXT_PUBLIC_
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set")
  }

  return createBrowserClientSSR(supabaseUrl, supabaseAnonKey)
}

export function createBrowserClient() {
  return createClient()
}
