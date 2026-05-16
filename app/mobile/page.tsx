"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { MobileJobsList } from "@/components/mobile/mobile-jobs-list"

export default function MobilePage() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [userId, setUserId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkUser() {
      const supabase = createBrowserClient()
      const user = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data } = await supabase.from("users").select("company_id, role, full_name").eq("id", user.id).single()

      if (!data?.company_id) {
        router.push("/onboarding")
        return
      }

      setUserData(data)
      setUserId(user.id)
      setLoading(false)
    }

    checkUser()
  }, [router])

  if (loading || !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return <MobileJobsList companyId={userData.company_id} userId={userId} userName={userData.full_name} />
}
