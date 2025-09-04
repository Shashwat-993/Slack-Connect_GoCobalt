import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SlackTokenManager } from "@/lib/slack/token-manager"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workspaceId } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify workspace belongs to user
    const { data: workspace, error: workspaceError } = await supabase
      .from("slack_workspaces")
      .select("*")
      .eq("id", workspaceId)
      .eq("user_id", user.id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Try to get cached channels first
    const { data: cachedChannels } = await supabase
      .from("slack_channels")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("is_archived", false)
      .order("channel_name")

    // If we have cached channels and they're recent (less than 1 hour old), return them
    if (cachedChannels && cachedChannels.length > 0) {
      const lastSynced = new Date(cachedChannels[0].last_synced_at)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

      if (lastSynced > oneHourAgo) {
        return NextResponse.json({ channels: cachedChannels })
      }
    }

    // Fetch fresh channels from Slack API
    const tokenManager = new SlackTokenManager()
    const slackApi = await tokenManager.getSlackAPI(user.id, workspaceId)

    if (!slackApi) {
      // Return cached channels if API is unavailable
      if (cachedChannels && cachedChannels.length > 0) {
        return NextResponse.json({ channels: cachedChannels })
      }
      return NextResponse.json(
        { error: "Failed to access Slack API. Please reconnect your workspace." },
        { status: 400 },
      )
    }

    try {
      const channelsResponse = await slackApi.getChannels()

      if (!channelsResponse.ok) {
        console.error("Slack API error:", channelsResponse.error)
        // Return cached channels if API call fails
        if (cachedChannels && cachedChannels.length > 0) {
          return NextResponse.json({ channels: cachedChannels })
        }
        return NextResponse.json({ error: "Failed to fetch channels from Slack" }, { status: 400 })
      }

      // Update cached channels
      const channelsToUpsert = channelsResponse.channels.map((channel) => ({
        workspace_id: workspaceId,
        channel_id: channel.id,
        channel_name: channel.name,
        is_private: channel.is_private,
        is_archived: channel.is_archived,
        last_synced_at: new Date().toISOString(),
      }))

      await supabase.from("slack_channels").upsert(channelsToUpsert, {
        onConflict: "workspace_id,channel_id",
      })

      // Return only non-archived channels
      const activeChannels = channelsToUpsert.filter((channel) => !channel.is_archived)

      return NextResponse.json({ channels: activeChannels })
    } catch (slackError) {
      console.error("Error fetching channels from Slack:", slackError)
      // Return cached channels if available
      if (cachedChannels && cachedChannels.length > 0) {
        return NextResponse.json({ channels: cachedChannels })
      }
      return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 })
    }
  } catch (error) {
    console.error("Get channels error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
