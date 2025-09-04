"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useScheduledMessages } from "@/lib/hooks/use-scheduled-messages"
import { formatMessageStatus, formatScheduledTime, truncateMessage } from "@/lib/utils/message-utils"
import { Calendar, MessageSquare } from "lucide-react"
import Link from "next/link"

export function RecentMessages() {
  const { messages, loading, error } = useScheduledMessages()

  const recentMessages = messages
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Messages
            </CardTitle>
            <CardDescription>Your latest scheduled and sent messages</CardDescription>
          </div>
          <Link href="/scheduled">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : recentMessages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">No messages yet</p>
            <Link href="/compose">
              <Button>Send Your First Message</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentMessages.map((message) => {
              const status = formatMessageStatus(message.status)
              const timing = formatScheduledTime(message.scheduled_for)

              return (
                <div key={message.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">#{message.channel_name}</span>
                        <Badge variant="secondary" className={`${status.color} ${status.bgColor}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{message.slack_workspaces?.workspace_name}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{timing.date}</div>
                      <div>{timing.time}</div>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{truncateMessage(message.message_text, 120)}</p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
