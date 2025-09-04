import { createClient } from "@/lib/supabase/server"
import { SlackTokenManager } from "@/lib/slack/token-manager"

export class MessageScheduler {
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

  // Process pending messages that are due to be sent
  async processPendingMessages(): Promise<void> {
    const supabase = await this.getSupabase()

    try {
      // Get pending messages using the database function
      const { data: pendingMessages, error } = await supabase.rpc("get_pending_messages")

      if (error) {
        console.error("Failed to fetch pending messages:", error)
        return
      }

      if (!pendingMessages || pendingMessages.length === 0) {
        return
      }

      console.log(`Processing ${pendingMessages.length} pending messages`)

      // Process each message
      for (const message of pendingMessages) {
        await this.sendScheduledMessage(message)
      }
    } catch (error) {
      console.error("Error processing pending messages:", error)
    }
  }

  // Send a single scheduled message
  private async sendScheduledMessage(message: any): Promise<void> {
    const supabase = await this.getSupabase()
    const tokenManager = new SlackTokenManager()

    try {
      // Get Slack API instance with valid token
      const slackApi = await tokenManager.getSlackAPI(message.user_id, message.workspace_id)

      if (!slackApi) {
        await this.markMessageFailed(message.message_id, "Failed to get valid Slack API access")
        return
      }

      // Send the message
      const result = await slackApi.sendMessage(message.channel_id, message.message_text)

      if (result.ok) {
        // Mark message as sent
        await supabase
          .from("scheduled_messages")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            slack_message_ts: result.ts,
          })
          .eq("id", message.message_id)

        console.log(`Successfully sent scheduled message ${message.message_id}`)
      } else {
        await this.markMessageFailed(message.message_id, result.error || "Unknown Slack API error")
      }
    } catch (error) {
      console.error(`Error sending scheduled message ${message.message_id}:`, error)
      await this.markMessageFailed(message.message_id, error instanceof Error ? error.message : "Unknown error")
    }
  }

  // Mark a message as failed
  private async markMessageFailed(messageId: string, errorMessage: string): Promise<void> {
    const supabase = await this.getSupabase()

    await supabase
      .from("scheduled_messages")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", messageId)

    console.error(`Marked message ${messageId} as failed: ${errorMessage}`)
  }
}
