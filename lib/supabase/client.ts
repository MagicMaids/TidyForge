import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please add it to your Vercel project settings.",
    )
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please add it to your Vercel project settings.",
    )
  }

  console.log("[v0] Creating Supabase client with URL:", supabaseUrl)
  console.log("[v0] Anon key length:", supabaseAnonKey.length)
  console.log("[v0] Anon key starts with:", supabaseAnonKey.substring(0, 20) + "...")

  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
}

export const createClient = createBrowserClient
