import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SlackAPI } from "@/lib/slack/api"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      console.error("Slack OAuth error:", error)
      return NextResponse.redirect(new URL("/dashboard?error=slack_auth_failed", request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL("/dashboard?error=no_code", request.url))
    }

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    // Exchange code for tokens
    const tokenResponse = await SlackAPI.exchangeCodeForToken(code)

    if (!tokenResponse.ok) {
      console.error("Failed to exchange code for token:", tokenResponse.error)
      return NextResponse.redirect(new URL("/dashboard?error=token_exchange_failed", request.url))
    }

    // Calculate token expiration time
    const expiresAt = tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000) : null

    // Store workspace connection in database
    const { error: dbError } = await supabase.from("slack_workspaces").upsert(
      {
        user_id: user.id,
        workspace_id: tokenResponse.team.id,
        workspace_name: tokenResponse.team.name,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || null,
        token_expires_at: expiresAt,
        scope: tokenResponse.scope,
      },
      {
        onConflict: "user_id,workspace_id",
      },
    )

    if (dbError) {
      console.error("Failed to store workspace connection:", dbError)
      return NextResponse.redirect(new URL("/dashboard?error=database_error", request.url))
    }

    // Fetch and cache channels
    try {
      const slackApi = new SlackAPI(tokenResponse.access_token)
      const channelsResponse = await slackApi.getChannels()

      if (channelsResponse.ok && channelsResponse.channels) {
        // Get the workspace record to get its ID
        const { data: workspace } = await supabase
          .from("slack_workspaces")
          .select("id")
          .eq("user_id", user.id)
          .eq("workspace_id", tokenResponse.team.id)
          .single()

        if (workspace) {
          // Cache channels
          const channelsToInsert = channelsResponse.channels.map((channel) => ({
            workspace_id: workspace.id,
            channel_id: channel.id,
            channel_name: channel.name,
            is_private: channel.is_private,
            is_archived: channel.is_archived,
          }))

          await supabase.from("slack_channels").upsert(channelsToInsert, {
            onConflict: "workspace_id,channel_id",
          })
        }
      }
    } catch (channelError) {
      console.error("Failed to fetch channels:", channelError)
      // Don't fail the whole flow if channel fetching fails
    }

    return NextResponse.redirect(new URL("/dashboard?success=slack_connected", request.url))
  } catch (error) {
    console.error("Slack OAuth callback error:", error)
    return NextResponse.redirect(new URL("/dashboard?error=callback_failed", request.url))
  }
}
