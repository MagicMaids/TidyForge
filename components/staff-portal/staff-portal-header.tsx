"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { CalendarDays, Home, LogOut, Settings, UserCircle, Building2 } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface StaffPortalHeaderProps {
  staffName: string
  staffEmail: string
  companyName?: string | null
  role?: string
}

export function StaffPortalHeader({ staffName, staffEmail, companyName, role }: StaffPortalHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const navItems = companyName
    ? [
        { href: "/staff-portal", label: "Dashboard", icon: Home },
        { href: "/staff-portal/jobs", label: "My Jobs", icon: CalendarDays },
      ]
    : [
        { href: "/staff-portal", label: "Dashboard", icon: Home },
        { href: "/staff-portal/find-company", label: "Find Company", icon: Building2 },
      ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/staff-portal" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              TF
            </div>
            <span className="font-semibold text-lg hidden sm:inline-block">TidyForge</span>
            {companyName && (
              <span className="text-sm text-muted-foreground hidden lg:inline-block">| {companyName}</span>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {role && (
            <span className="text-xs bg-muted px-2 py-1 rounded-full capitalize hidden sm:inline-block">{role}</span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserCircle className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{staffName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{staffEmail}</p>
                  {companyName && (
                    <p className="text-xs leading-none text-muted-foreground mt-1">
                      {companyName} • {role}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/staff-portal/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
