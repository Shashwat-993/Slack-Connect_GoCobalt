"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface ScheduledMessage {
  id: string
  user_id: string
  workspace_id: string
  channel_id: string
  channel_name: string
  message_text: string
  scheduled_for: string
  status: "pending" | "sent" | "failed" | "cancelled"
  sent_at?: string
  error_message?: string
  slack_message_ts?: string
  created_at: string
  updated_at: string
  slack_workspaces: {
    workspace_name: string
  }
}

export interface UseScheduledMessagesReturn {
  messages: ScheduledMessage[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  cancelMessage: (messageId: string) => Promise<boolean>
  updateMessage: (messageId: string, updates: { message_text?: string; scheduled_for?: string }) => Promise<boolean>
}

export function useScheduledMessages(): UseScheduledMessagesReturn {
  const [messages, setMessages] = useState<ScheduledMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/messages/scheduled")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch messages")
      }

      setMessages(data.messages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch messages")
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/scheduled/${messageId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to cancel message")
      }

      // Update local state
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, status: "cancelled" as const } : msg)))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel message")
      return false
    }
  }, [])

  const updateMessage = useCallback(
    async (messageId: string, updates: { message_text?: string; scheduled_for?: string }): Promise<boolean> => {
      try {
        const response = await fetch(`/api/messages/scheduled/${messageId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to update message")
        }

        const { message: updatedMessage } = await response.json()

        // Update local state
        setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, ...updatedMessage } : msg)))

        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update message")
        return false
      }
    },
    [],
  )

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Set up real-time subscription for message updates
  useEffect(() => {
    const supabase = createClient()

    const subscription = supabase
      .channel("scheduled_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scheduled_messages",
        },
        () => {
          // Refetch messages when there are changes
          fetchMessages()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchMessages])

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
    cancelMessage,
    updateMessage,
  }
}
