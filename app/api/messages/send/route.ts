import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SlackTokenManager } from "@/lib/slack/token-manager"

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

    const { workspaceId, channelId, channelName, message, scheduleFor } = await request.json()

    // Validate required fields
    if (!workspaceId || !channelId || !message?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate message length (Slack has a 4000 character limit)
    if (message.length > 4000) {
      return NextResponse.json({ error: "Message too long (max 4000 characters)" }, { status: 400 })
    }

    // If scheduleFor is provided, create a scheduled message
    if (scheduleFor) {
      const scheduledDate = new Date(scheduleFor)
      const now = new Date()

      // Validate scheduled time is in the future
      if (scheduledDate <= now) {
        return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 })
      }

      // Create scheduled message record
      const { data: scheduledMessage, error: scheduleError } = await supabase
        .from("scheduled_messages")
        .insert({
          user_id: user.id,
          workspace_id: workspaceId,
          channel_id: channelId,
          channel_name: channelName || `#${channelId}`,
          message_text: message.trim(),
          scheduled_for: scheduledDate.toISOString(),
          status: "pending",
        })
        .select()
        .single()

      if (scheduleError) {
        console.error("Failed to create scheduled message:", scheduleError)
        return NextResponse.json({ error: "Failed to schedule message" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        scheduled: true,
        messageId: scheduledMessage.id,
        scheduledFor: scheduledDate.toISOString(),
      })
    }

    // Send message immediately
    const tokenManager = new SlackTokenManager()
    const slackApi = await tokenManager.getSlackAPI(user.id, workspaceId)

    if (!slackApi) {
      return NextResponse.json(
        { error: "Failed to get Slack API access. Please reconnect your workspace." },
        { status: 400 },
      )
    }

    try {
      const result = await slackApi.sendMessage(channelId, message.trim())

      if (!result.ok) {
        console.error("Slack API error:", result.error)
        return NextResponse.json({ error: `Failed to send message: ${result.error}` }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        scheduled: false,
        messageTs: result.ts,
        channel: result.channel,
      })
    } catch (slackError) {
      console.error("Error sending message to Slack:", slackError)
      return NextResponse.json({ error: "Failed to send message to Slack" }, { status: 500 })
    }
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
