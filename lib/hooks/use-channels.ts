"use client"

import { useState, useEffect, useCallback } from "react"

export interface SlackChannel {
  id: string
  workspace_id: string
  channel_id: string
  channel_name: string
  is_private: boolean
  is_archived: boolean
}

export interface UseChannelsReturn {
  channels: SlackChannel[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useChannels(workspaceId: string | null): UseChannelsReturn {
  const [channels, setChannels] = useState<SlackChannel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchChannels = useCallback(async () => {
    if (!workspaceId) {
      setChannels([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/workspaces/${workspaceId}/channels`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch channels")
      }

      setChannels(data.channels || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch channels")
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  return {
    channels,
    loading,
    error,
    refetch: fetchChannels,
  }
}
