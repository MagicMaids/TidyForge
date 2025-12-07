import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { MobileJobsList } from "@/components/mobile/mobile-jobs-list"

export default async function MobilePage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("company_id, role, full_name")
    .eq("id", user.id)
    .single()

  if (!userData?.company_id) {
    redirect("/onboarding")
  }

  return <MobileJobsList companyId={userData.company_id} userId={user.id} userName={userData.full_name} />
}
