import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              TF
            </div>
            <span className="text-xl font-semibold">TidyForge</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl font-bold tracking-tight text-balance">Streamline Your Cleaning Operations</h1>
          <p className="text-xl text-muted-foreground text-balance">
            The complete platform for managing Airbnb turnovers, property cleanings, and team coordination. Built for
            cleaning companies that want to scale.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/auth/sign-up">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything you need to run your cleaning business</h2>
          <p className="text-lg text-muted-foreground">
            Stop juggling spreadsheets, texts, and chaos. Manage it all in one place.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                Job Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Schedule turnovers, assign cleaners, and track job status in real-time. Never miss a checkout again.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                Property Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Store door codes, WiFi passwords, special instructions, and photos. Everything your team needs in one
                tap.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                Client Portal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Give property owners secure access to view their properties, job history, and before/after photos.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                Mobile-First
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Cleaners can check in, complete checklists, and upload photos from their phones. No desktop required.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                Smart Checklists
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create custom cleaning checklists by room. Ensure consistent quality on every job.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                Inventory Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track cleaning supplies and linens. Get alerts when inventory is running low.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to transform your cleaning business?</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Join cleaning companies that have ditched the chaos and embraced organized operations.
            </p>
            <Link href="/auth/sign-up">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Start Your Free Trial
              </Button>
            </Link>
            <p className="text-sm opacity-75">No credit card required. 14-day free trial.</p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 TidyForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
