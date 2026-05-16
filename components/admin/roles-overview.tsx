import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

interface Role {
  id: string
  name: string
  description: string
  permissions: any
}

interface RolesOverviewProps {
  roles: Role[]
}

export function RolesOverview({ roles }: RolesOverviewProps) {
  const getRoleColor = (name: string) => {
    switch (name) {
      case "super_admin":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "platform_admin":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "support":
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
      case "developer":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "analyst":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {roles.map((role) => (
        <Card key={role.id} className={`border-2 ${getRoleColor(role.name)}`}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle className="text-lg">{role.name.replace("_", " ").toUpperCase()}</CardTitle>
            </div>
            <CardDescription>{role.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm font-medium">Permissions:</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(role.permissions || {}).map(([key, value]) =>
                  value ? (
                    <span key={key} className="text-xs px-2 py-1 rounded-md bg-background/50">
                      {key.replace("can_", "").replace(/_/g, " ")}
                    </span>
                  ) : null,
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
