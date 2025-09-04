import type { ScheduledMessage } from "@/lib/hooks/use-scheduled-messages"
import { validateScheduledTime, validateMessageText } from "@/lib/utils/message-utils"

export interface SendMessageOptions {
  workspaceId: string
  channelId: string
  channelName: string
  message: string
  scheduleFor?: string
}

export interface MessageSendResult {
  success: boolean
  error?: string
  messageId?: string
  scheduledFor?: string
  messageTs?: string
}

export class MessageManager {
  // Send a message (immediate or scheduled)
  static async sendMessage(options: SendMessageOptions): Promise<MessageSendResult> {
    try {
      // Validate message text
      const messageError = validateMessageText(options.message)
      if (messageError) {
        return { success: false, error: messageError }
      }

      // Validate scheduled time if provided
      if (options.scheduleFor) {
        const timeError = validateScheduledTime(options.scheduleFor)
        if (timeError) {
          return { success: false, error: timeError }
        }
      }

      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to send message" }
      }

      return {
        success: true,
        messageId: data.messageId,
        scheduledFor: data.scheduledFor,
        messageTs: data.messageTs,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send message",
      }
    }
  }

  // Cancel a scheduled message
  static async cancelMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/messages/scheduled/${messageId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        return { success: false, error: data.error || "Failed to cancel message" }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cancel message",
      }
    }
  }

  // Update a scheduled message
  static async updateMessage(
    messageId: string,
    updates: { message_text?: string; scheduled_for?: string },
  ): Promise<{ success: boolean; error?: string; message?: ScheduledMessage }> {
    try {
      // Validate updates
      if (updates.message_text !== undefined) {
        const messageError = validateMessageText(updates.message_text)
        if (messageError) {
          return { success: false, error: messageError }
        }
      }

      if (updates.scheduled_for !== undefined) {
        const timeError = validateScheduledTime(updates.scheduled_for)
        if (timeError) {
          return { success: false, error: timeError }
        }
      }

      const response = await fetch(`/api/messages/scheduled/${messageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to update message" }
      }

      return { success: true, message: data.message }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update message",
      }
    }
  }

  // Get message statistics
  static getMessageStats(messages: ScheduledMessage[]): {
    total: number
    pending: number
    sent: number
    failed: number
    cancelled: number
  } {
    return {
      total: messages.length,
      pending: messages.filter((m) => m.status === "pending").length,
      sent: messages.filter((m) => m.status === "sent").length,
      failed: messages.filter((m) => m.status === "failed").length,
      cancelled: messages.filter((m) => m.status === "cancelled").length,
    }
  }
}
