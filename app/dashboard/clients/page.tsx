import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { ClientsManager } from "@/components/clients/clients-manager"

export default async function ClientsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("company_id, role").eq("id", user.id).single()

  if (!userData?.company_id) {
    redirect("/onboarding")
  }

  return <ClientsManager companyId={userData.company_id} userRole={userData.role} />
}
