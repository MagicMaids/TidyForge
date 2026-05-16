"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function startImpersonation(companyId: string, reason: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if user has impersonation permission
  const { data: systemRoles } = await supabase
    .from("user_system_roles")
    .select(
      `
      system_roles (
        name
      )
    `,
    )
    .eq("user_id", user.id)

  const canImpersonate = systemRoles?.some((role: any) =>
    ["super_admin", "platform_admin", "support"].includes(role.system_roles?.name),
  )

  if (!canImpersonate) {
    return { success: false, error: "Insufficient permissions" }
  }

  // Get company details
  const { data: company } = await supabase.from("companies").select("id, name").eq("id", companyId).single()

  if (!company) {
    return { success: false, error: "Company not found" }
  }

  // Get a user from the company to impersonate (preferably an admin)
  const { data: targetUser } = await supabase
    .from("users")
    .select("id")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true })
    .limit(1)
    .single()

  if (!targetUser) {
    return { success: false, error: "No users found in company" }
  }

  // End any existing active sessions for this admin
  await supabase
    .from("impersonation_sessions")
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq("admin_user_id", user.id)
    .eq("is_active", true)

  // Create new impersonation session
  const { data: session, error } = await supabase
    .from("impersonation_sessions")
    .insert({
      admin_user_id: user.id,
      target_user_id: targetUser.id,
      target_company_id: companyId,
      reason,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Log the action
  await supabase.from("platform_audit_log").insert({
    admin_user_id: user.id,
    action: "impersonation_started",
    resource_type: "company",
    resource_id: companyId,
    company_id: companyId,
    new_value: { reason, session_id: session.id },
  })

  revalidatePath("/dashboard")
  return { success: true, sessionId: session.id }
}

export async function endImpersonation() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get active session
  const { data: session } = await supabase
    .from("impersonation_sessions")
    .select("*")
    .eq("admin_user_id", user.id)
    .eq("is_active", true)
    .single()

  if (!session) {
    return { success: false, error: "No active session" }
  }

  // End the session
  const { error } = await supabase
    .from("impersonation_sessions")
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq("id", session.id)

  if (error) {
    return { success: false, error: error.message }
  }

  // Log the action
  await supabase.from("platform_audit_log").insert({
    admin_user_id: user.id,
    action: "impersonation_ended",
    resource_type: "company",
    resource_id: session.target_company_id,
    company_id: session.target_company_id,
    new_value: { session_id: session.id, duration: Date.now() - new Date(session.started_at).getTime() },
  })

  revalidatePath("/dashboard")
  return { success: true }
}

export async function getActiveImpersonation() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: session } = await supabase
    .from("impersonation_sessions")
    .select(
      `
      *,
      companies (
        name
      )
    `,
    )
    .eq("admin_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  return session
}
