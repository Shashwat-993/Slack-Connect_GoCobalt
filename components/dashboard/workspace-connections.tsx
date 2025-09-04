"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWorkspaces } from "@/lib/hooks/use-workspaces"
import { Slack, Plus, CheckCircle, AlertCircle } from "lucide-react"
import { useState } from "react"

export function WorkspaceConnections() {
  const { workspaces, loading, error, refetch } = useWorkspaces()
  const [connecting, setConnecting] = useState(false)

  const handleConnectSlack = async () => {
    setConnecting(true)
    try {
      const response = await fetch("/api/auth/slack")
      const data = await response.json()

      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error("Failed to initiate Slack connection:", error)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Slack className="w-5 h-5" />
          Workspace Connections
        </CardTitle>
        <CardDescription>Connect your Slack workspaces to start sending messages</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-2 bg-transparent">
              Try Again
            </Button>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-6">
            <Slack className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">No workspaces connected yet</p>
            <Button onClick={handleConnectSlack} disabled={connecting} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {connecting ? "Connecting..." : "Connect Slack Workspace"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                    <Slack className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{workspace.workspace_name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle className="w-3 h-3 text-primary" />
                      <Badge variant="secondary" className="text-xs">
                        Connected
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={handleConnectSlack}
              disabled={connecting}
              className="w-full bg-transparent"
            >
              <Plus className="w-4 h-4 mr-2" />
              {connecting ? "Connecting..." : "Add Another Workspace"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
