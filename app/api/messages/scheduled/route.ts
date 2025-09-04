import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
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

    // Get user's scheduled messages
    const { data: messages, error: messagesError } = await supabase
      .from("scheduled_messages")
      .select(
        `
        *,
        slack_workspaces!inner(workspace_name)
      `,
      )
      .eq("user_id", user.id)
      .order("scheduled_for", { ascending: true })

    if (messagesError) {
      console.error("Failed to fetch scheduled messages:", messagesError)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Get scheduled messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
