"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { StaffPortalHeader } from "@/components/staff-portal/staff-portal-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building2, Mail, MapPin, Phone, Search, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function FindCompanyPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [staffUser, setStaffUser] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadStaffUser()
    loadCompanies()
  }, [])

  async function loadStaffUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()
      setStaffUser(data)
    }
  }

  async function loadCompanies() {
    const { data, error } = await supabase.from("companies").select("*").order("name")

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      })
      return
    }

    setCompanies(data || [])
    setIsLoading(false)
  }

  async function handleJoinRequest(company: any) {
    setSelectedCompany(company)
  }

  async function submitJoinRequest() {
    if (!selectedCompany || !staffUser) return

    setIsSubmitting(true)

    const { error } = await supabase.from("staff_join_requests").insert({
      user_id: staffUser.id,
      company_id: selectedCompany.id,
      requested_role: "cleaner",
      message: message.trim() || null,
      status: "pending",
    })

    setIsSubmitting(false)

    if (error) {
      toast({
        title: "Error",
        description: error.message.includes("duplicate")
          ? "You already have a pending request with this company"
          : "Failed to submit join request",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Request Sent",
      description: `Your join request to ${selectedCompany.name} has been submitted`,
    })

    setSelectedCompany(null)
    setMessage("")
  }

  const filteredCompanies = companies.filter((company) => company.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (!staffUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StaffPortalHeader staffName={staffUser.full_name} staffEmail={staffUser.email} />

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-[1200px] space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Find a Company</h1>
            <p className="text-muted-foreground mt-1">Browse cleaning companies and request to join</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Companies</CardTitle>
              <CardDescription>Find cleaning companies hiring in your area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompanies.map((company) => (
                <Card key={company.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{company.name}</CardTitle>
                          {company.city && company.state && (
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {company.city}, {company.state}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      {company.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {company.email}
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {company.phone}
                        </div>
                      )}
                    </div>
                    <Button className="w-full" onClick={() => handleJoinRequest(company)}>
                      Request to Join
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && filteredCompanies.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No companies found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Join Request Dialog */}
      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Join {selectedCompany?.name}</DialogTitle>
            <DialogDescription>
              Send a join request to this company. They will review and approve your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell the company about your experience and why you'd like to join..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCompany(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={submitJoinRequest} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
