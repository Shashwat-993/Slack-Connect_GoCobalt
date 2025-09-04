import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SlackAPI } from "@/lib/slack/api"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await request.json()

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 })
    }

    // Get workspace with refresh token
    const { data: workspace, error: workspaceError } = await supabase
      .from("slack_workspaces")
      .select("*")
      .eq("user_id", user.id)
      .eq("id", workspaceId)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    if (!workspace.refresh_token) {
      return NextResponse.json({ error: "No refresh token available" }, { status: 400 })
    }

    // Refresh the access token
    const tokenResponse = await SlackAPI.refreshAccessToken(workspace.refresh_token)

    if (!tokenResponse.ok) {
      console.error("Failed to refresh token:", tokenResponse.error)
      return NextResponse.json({ error: "Failed to refresh token" }, { status: 400 })
    }

    // Calculate new expiration time
    const expiresAt = tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000) : null

    // Update workspace with new tokens
    const { error: updateError } = await supabase
      .from("slack_workspaces")
      .update({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || workspace.refresh_token,
        token_expires_at: expiresAt,
        scope: tokenResponse.scope,
      })
      .eq("id", workspaceId)

    if (updateError) {
      console.error("Failed to update workspace tokens:", updateError)
      return NextResponse.json({ error: "Failed to update tokens" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      access_token: tokenResponse.access_token,
      expires_at: expiresAt,
    })
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
