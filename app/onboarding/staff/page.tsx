"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Loader2, Search, KeyRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function StaffOnboardingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [inviteCode, setInviteCode] = useState("")
  const [selectedCompanyId, setSelectedCompanyId] = useState("")
  const [requestedRole, setRequestedRole] = useState("cleaner")
  const [requestMessage, setRequestMessage] = useState("")
  const [companies, setCompanies] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const filteredCompanies = companies.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)
      console.log("[v0] Loading companies...")

      // Load companies for browsing
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, name, email")
        .order("name")

      console.log("[v0] Companies loaded:", companiesData?.length || 0, "companies")

      if (companiesError) {
        console.error("[v0] Error loading companies:", companiesError.message)
      }

      if (companiesData) {
        setCompanies(companiesData)
      }
    }

    checkUser()
  }, [router])

  useEffect(() => {
    console.log("[v0] Total companies:", companies.length)
    console.log("[v0] Filtered companies:", filteredCompanies.length)
  }, [companies, filteredCompanies])

  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) {
      setError("Please enter an invite code")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Call the database function to join with code
      const { data, error: joinError } = await supabase.rpc("join_company_with_code", {
        p_invite_code: inviteCode.toUpperCase(),
      })

      if (joinError || !data?.success) {
        setError(data?.error || "Invalid invite code")
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push("/staff-portal"), 2000)
    } catch (err) {
      console.error("[v0] Error joining with code:", err)
      setError("An unexpected error occurred")
      setIsLoading(false)
    }
  }

  const handleRequestToJoin = async () => {
    if (!selectedCompanyId) {
      setError("Please select a company")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Create user record first if it doesn't exist
      const { data: existingUser } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()

      if (!existingUser) {
        const { error: userError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          phone: user.user_metadata?.phone || null,
          role: "cleaner",
          account_type: "company_staff",
          company_id: null, // Will be set when request is approved
          is_active: false, // Inactive until approved
        })

        if (userError) {
          setError("Failed to create user profile")
          setIsLoading(false)
          return
        }
      }

      // Create join request
      const { error: requestError } = await supabase.from("staff_join_requests").insert({
        user_id: user.id,
        company_id: selectedCompanyId,
        requested_role: requestedRole,
        message: requestMessage || null,
      })

      if (requestError) {
        if (requestError.code === "23505") {
          setError("You already have a pending request for this company")
        } else {
          setError("Failed to submit request")
        }
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push("/staff-portal"), 2000)
    } catch (err) {
      console.error("[v0] Error submitting request:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
        <div className="w-full max-w-2xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg font-medium mb-2">{inviteCode ? "Successfully Joined!" : "Request Submitted!"}</p>
              <p className="text-sm text-muted-foreground mb-4">
                {inviteCode
                  ? "Redirecting to your dashboard..."
                  : "The company will review your request. Redirecting..."}
              </p>
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              TF
            </div>
            <span className="text-2xl font-semibold">TidyForge</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Join a Company</CardTitle>
              <CardDescription>Connect with a cleaning company to start managing jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="invite-code" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="invite-code">
                    <KeyRound className="h-4 w-4 mr-2" />
                    Invite Code
                  </TabsTrigger>
                  <TabsTrigger value="browse">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Companies
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="invite-code" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="invite-code">Enter Invite Code</Label>
                    <Input
                      id="invite-code"
                      placeholder="ABC12345"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      maxLength={8}
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Ask your employer for an invite code to join instantly
                    </p>
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                      {error}
                    </div>
                  )}

                  <Button onClick={handleJoinWithCode} disabled={isLoading || !inviteCode.trim()} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join Company"
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="browse" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Companies</Label>
                    <div className="flex gap-2">
                      <Input
                        id="search"
                        placeholder="Search by company name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")}>
                          Clear
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {filteredCompanies.length === 0 && searchTerm
                        ? "No companies found"
                        : `${filteredCompanies.length} ${filteredCompanies.length === 1 ? "company" : "companies"} available`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Select Company</Label>
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                      <SelectTrigger id="company">
                        <SelectValue placeholder="Choose a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCompanies.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            {searchTerm ? "No companies match your search" : "No companies available"}
                          </div>
                        ) : (
                          filteredCompanies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Requested Role</Label>
                    <Select value={requestedRole} onValueChange={setRequestedRole}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cleaner">Cleaner</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell the company why you'd like to join..."
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                      {error}
                    </div>
                  )}

                  <Button onClick={handleRequestToJoin} disabled={isLoading || !selectedCompanyId} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Request to Join"
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
