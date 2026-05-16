import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export function SystemHealth() {
  const services = [
    { name: "Database", status: "operational", uptime: "99.99%" },
    { name: "Authentication", status: "operational", uptime: "99.98%" },
    { name: "Storage", status: "operational", uptime: "99.97%" },
    { name: "API", status: "operational", uptime: "99.99%" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
        <CardDescription>Current status of platform services</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.status}</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">{service.uptime}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
