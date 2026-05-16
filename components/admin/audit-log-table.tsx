"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye } from "lucide-react"
import { useState } from "react"

interface AuditLog {
  id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  previous_value: any
  new_value: any
  created_at: string
  ip_address: string | null
  users: {
    email: string
  } | null
  companies: {
    name: string
  } | null
}

interface AuditLogTableProps {
  logs: AuditLog[]
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("grant")) {
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    }
    if (action.includes("delete") || action.includes("revoke") || action.includes("suspend")) {
      return "bg-red-500/10 text-red-500 border-red-500/20"
    }
    if (action.includes("update") || action.includes("modify")) {
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    }
    return "bg-muted text-muted-foreground"
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No audit logs found</p>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant="outline" className={getActionColor(log.action)}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{log.users?.email || "System"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {log.resource_type ? (
                    <span>
                      {log.resource_type}
                      {log.resource_id && <span className="text-xs"> ({log.resource_id.slice(0, 8)})</span>}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{log.companies?.name || "-"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                        <DialogDescription>Full details of this administrative action</DialogDescription>
                      </DialogHeader>

                      {selectedLog && (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-sm font-medium">Action</p>
                              <p className="text-sm text-muted-foreground">{selectedLog.action}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Admin User</p>
                              <p className="text-sm text-muted-foreground">{selectedLog.users?.email || "System"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Resource Type</p>
                              <p className="text-sm text-muted-foreground">{selectedLog.resource_type || "-"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Resource ID</p>
                              <p className="text-sm text-muted-foreground font-mono">
                                {selectedLog.resource_id || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">IP Address</p>
                              <p className="text-sm text-muted-foreground font-mono">{selectedLog.ip_address || "-"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Timestamp</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(selectedLog.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {selectedLog.previous_value && (
                            <div>
                              <p className="text-sm font-medium mb-2">Previous Value</p>
                              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
                                {JSON.stringify(selectedLog.previous_value, null, 2)}
                              </pre>
                            </div>
                          )}

                          {selectedLog.new_value && (
                            <div>
                              <p className="text-sm font-medium mb-2">New Value</p>
                              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
                                {JSON.stringify(selectedLog.new_value, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
