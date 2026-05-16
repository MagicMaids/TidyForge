"use client"

import Link from "next/link"
import { Home, Users, Smartphone, CreditCard, Bell, LogOut, Calendar, MapPin, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function DashboardHeader({ userName, userRole }: { userName: string; userRole: string }) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-6 flex h-16 items-center">
        {/* Logo */}
        <Link href="/dashboard" className="mr-8 flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">TF</span>
          </div>
          <span className="font-bold text-lg">TidyForge</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-1 text-sm">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/jobs">
            <Button variant="ghost" size="sm" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Jobs
            </Button>
          </Link>
          <Link href="/dashboard/calendar">
            <Button variant="ghost" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </Button>
          </Link>
          <Link href="/dashboard/properties">
            <Button variant="ghost" size="sm" className="gap-2">
              <MapPin className="h-4 w-4" />
              Properties
            </Button>
          </Link>
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="sm" className="gap-2">
              <Users className="h-4 w-4" />
              Clients
            </Button>
          </Link>
          <Link href="/mobile">
            <Button variant="ghost" size="sm" className="gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile
            </Button>
          </Link>
          {userRole === "admin" && (
            <Link href="/dashboard/billing">
              <Button variant="ghost" size="sm" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Billing
              </Button>
            </Link>
          )}
        </nav>

        {/* Right Side Actions */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
