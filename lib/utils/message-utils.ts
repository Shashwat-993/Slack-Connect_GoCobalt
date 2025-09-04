import type { ScheduledMessage } from "@/lib/hooks/use-scheduled-messages"

export function formatMessageStatus(status: ScheduledMessage["status"]): {
  label: string
  color: string
  bgColor: string
} {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        color: "text-blue-700",
        bgColor: "bg-blue-100",
      }
    case "sent":
      return {
        label: "Sent",
        color: "text-green-700",
        bgColor: "bg-green-100",
      }
    case "failed":
      return {
        label: "Failed",
        color: "text-red-700",
        bgColor: "bg-red-100",
      }
    case "cancelled":
      return {
        label: "Cancelled",
        color: "text-gray-700",
        bgColor: "bg-gray-100",
      }
    default:
      return {
        label: "Unknown",
        color: "text-gray-700",
        bgColor: "bg-gray-100",
      }
  }
}

export function formatScheduledTime(scheduledFor: string): {
  date: string
  time: string
  relative: string
  isPast: boolean
} {
  const scheduledDate = new Date(scheduledFor)
  const now = new Date()
  const isPast = scheduledDate < now

  // Format date and time
  const date = scheduledDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const time = scheduledDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  // Calculate relative time
  const diffMs = Math.abs(scheduledDate.getTime() - now.getTime())
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  let relative: string
  if (diffMinutes < 1) {
    relative = isPast ? "Just now" : "In less than a minute"
  } else if (diffMinutes < 60) {
    relative = isPast ? `${diffMinutes}m ago` : `In ${diffMinutes}m`
  } else if (diffHours < 24) {
    relative = isPast ? `${diffHours}h ago` : `In ${diffHours}h`
  } else {
    relative = isPast ? `${diffDays}d ago` : `In ${diffDays}d`
  }

  return {
    date,
    time,
    relative,
    isPast,
  }
}

export function truncateMessage(message: string, maxLength = 100): string {
  if (message.length <= maxLength) {
    return message
  }
  return message.substring(0, maxLength) + "..."
}

export function validateScheduledTime(scheduledFor: string): string | null {
  const scheduledDate = new Date(scheduledFor)
  const now = new Date()

  if (isNaN(scheduledDate.getTime())) {
    return "Invalid date format"
  }

  if (scheduledDate <= now) {
    return "Scheduled time must be in the future"
  }

  // Check if it's more than 1 year in the future
  const oneYearFromNow = new Date()
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

  if (scheduledDate > oneYearFromNow) {
    return "Scheduled time cannot be more than 1 year in the future"
  }

  return null
}

export function validateMessageText(message: string): string | null {
  if (!message || !message.trim()) {
    return "Message cannot be empty"
  }

  if (message.length > 4000) {
    return "Message cannot exceed 4000 characters"
  }

  return null
}

export function filterMessages(
  messages: ScheduledMessage[],
  filters: {
    status?: ScheduledMessage["status"][]
    workspaceId?: string
    searchQuery?: string
  },
): ScheduledMessage[] {
  return messages.filter((message) => {
    // Filter by status
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(message.status)) {
        return false
      }
    }

    // Filter by workspace
    if (filters.workspaceId && message.workspace_id !== filters.workspaceId) {
      return false
    }

    // Filter by search query
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase()
      const searchableText = [
        message.message_text,
        message.channel_name,
        message.slack_workspaces?.workspace_name || "",
      ]
        .join(" ")
        .toLowerCase()

      if (!searchableText.includes(query)) {
        return false
      }
    }

    return true
  })
}

export function sortMessages(
  messages: ScheduledMessage[],
  sortBy: "scheduled_for" | "created_at" | "status",
  sortOrder: "asc" | "desc" = "desc",
): ScheduledMessage[] {
  return [...messages].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    switch (sortBy) {
      case "scheduled_for":
        aValue = new Date(a.scheduled_for).getTime()
        bValue = new Date(b.scheduled_for).getTime()
        break
      case "created_at":
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        break
      case "status":
        // Custom status order: pending, sent, failed, cancelled
        const statusOrder = { pending: 0, sent: 1, failed: 2, cancelled: 3 }
        aValue = statusOrder[a.status] ?? 4
        bValue = statusOrder[b.status] ?? 4
        break
      default:
        return 0
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })
}
