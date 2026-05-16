"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createClientProfile(data: {
  fullName: string
  email: string
  phone: string | null
  authUserId: string
}) {
  const supabase = await createClient()

  // Verify the user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user || user.id !== data.authUserId) {
    return { error: "Unauthorized" }
  }

  // Check if client portal user already exists
  const { data: existingPortalUser } = await supabase
    .from("client_portal_users")
    .select("*, clients(*)")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (existingPortalUser) {
    return { success: true, clientId: existingPortalUser.client_id }
  }

  const [firstName, ...lastNameParts] = data.fullName.split(" ")
  const lastName = lastNameParts.join(" ")

  const { data: result, error: functionError } = await supabase.rpc("create_client_onboarding_profile", {
    p_email: data.email,
    p_first_name: firstName,
    p_last_name: lastName || "",
    p_phone: data.phone || "",
    p_company_name: null,
    p_address: null,
  })

  if (functionError) {
    console.error("[v0] Function call error:", functionError)
    return { error: functionError.message || "Failed to create client profile" }
  }

  if (!result || !result.success) {
    console.error("[v0] Function returned error:", result)
    return { error: result?.error || "Failed to create client profile" }
  }

  revalidatePath("/client-portal")
  return { success: true, clientId: result.client_id }
}
