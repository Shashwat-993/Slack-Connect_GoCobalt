import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { WorkspaceConnections } from "@/components/dashboard/workspace-connections"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentMessages } from "@/components/dashboard/recent-messages"
import { MessageStats } from "@/components/dashboard/message-stats"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back!</h1>
            <p className="text-muted-foreground">Manage your Slack connections and messages from your dashboard</p>
          </div>

          {/* Stats Overview */}
          <MessageStats />

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Workspaces & Quick Actions */}
            <div className="lg:col-span-1 space-y-8">
              <WorkspaceConnections />
              <QuickActions />
            </div>

            {/* Right Column - Recent Messages */}
            <div className="lg:col-span-2">
              <RecentMessages />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
