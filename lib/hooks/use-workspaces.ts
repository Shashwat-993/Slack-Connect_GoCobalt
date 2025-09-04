"use client"

import { useState, useEffect, useCallback } from "react"

export interface SlackWorkspace {
  id: string
  workspace_id: string
  workspace_name: string
  created_at: string
}

export interface UseWorkspacesReturn {
  workspaces: SlackWorkspace[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useWorkspaces(): UseWorkspacesReturn {
  const [workspaces, setWorkspaces] = useState<SlackWorkspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/workspaces")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch workspaces")
      }

      setWorkspaces(data.workspaces || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch workspaces")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  return {
    workspaces,
    loading,
    error,
    refetch: fetchWorkspaces,
  }
}
