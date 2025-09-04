import { createClient } from "@/lib/supabase/server"
import { SlackAPI } from "./api"

export class SlackTokenManager {
  private supabase: any

  constructor() {
    this.supabase = null
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  // Get valid access token for a workspace, refreshing if necessary
  async getValidAccessToken(userId: string, workspaceId: string): Promise<string | null> {
    const supabase = await this.getSupabase()

    // Get workspace data
    const { data: workspace, error } = await supabase
      .from("slack_workspaces")
      .select("*")
      .eq("user_id", userId)
      .eq("id", workspaceId)
      .single()

    if (error || !workspace) {
      console.error("Workspace not found:", error)
      return null
    }

    // Check if token is still valid (with 5 minute buffer)
    const now = new Date()
    const expiresAt = workspace.token_expires_at ? new Date(workspace.token_expires_at) : null
    const needsRefresh = expiresAt && expiresAt.getTime() - now.getTime() < 5 * 60 * 1000

    if (!needsRefresh) {
      return workspace.access_token
    }

    // Token needs refresh
    if (!workspace.refresh_token) {
      console.error("No refresh token available for workspace:", workspaceId)
      return null
    }

    try {
      const tokenResponse = await SlackAPI.refreshAccessToken(workspace.refresh_token)

      if (!tokenResponse.ok) {
        console.error("Failed to refresh token:", tokenResponse.error)
        return null
      }

      // Calculate new expiration time
      const newExpiresAt = tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000) : null

      // Update workspace with new tokens
      await supabase
        .from("slack_workspaces")
        .update({
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token || workspace.refresh_token,
          token_expires_at: newExpiresAt,
          scope: tokenResponse.scope,
        })
        .eq("id", workspaceId)

      return tokenResponse.access_token
    } catch (error) {
      console.error("Error refreshing token:", error)
      return null
    }
  }

  // Get SlackAPI instance with valid token
  async getSlackAPI(userId: string, workspaceId: string): Promise<SlackAPI | null> {
    const accessToken = await this.getValidAccessToken(userId, workspaceId)
    if (!accessToken) {
      return null
    }
    return new SlackAPI(accessToken)
  }
}
