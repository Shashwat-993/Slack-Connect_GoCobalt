import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the message to verify ownership and status
    const { data: message, error: fetchError } = await supabase
      .from("scheduled_messages")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Check if message can be cancelled (only pending messages)
    if (message.status !== "pending") {
      return NextResponse.json({ error: "Cannot cancel message that has already been sent or failed" }, { status: 400 })
    }

    // Update message status to cancelled
    const { error: updateError } = await supabase
      .from("scheduled_messages")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Failed to cancel message:", updateError)
      return NextResponse.json({ error: "Failed to cancel message" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Cancel message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message_text, scheduled_for } = await request.json()

    // Get the message to verify ownership and status
    const { data: message, error: fetchError } = await supabase
      .from("scheduled_messages")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Check if message can be updated (only pending messages)
    if (message.status !== "pending") {
      return NextResponse.json({ error: "Cannot update message that has already been sent or failed" }, { status: 400 })
    }

    const updates: any = {}

    // Validate and update message text if provided
    if (message_text !== undefined) {
      if (!message_text?.trim()) {
        return NextResponse.json({ error: "Message text cannot be empty" }, { status: 400 })
      }
      if (message_text.length > 4000) {
        return NextResponse.json({ error: "Message too long (max 4000 characters)" }, { status: 400 })
      }
      updates.message_text = message_text.trim()
    }

    // Validate and update scheduled time if provided
    if (scheduled_for !== undefined) {
      const scheduledDate = new Date(scheduled_for)
      const now = new Date()

      if (scheduledDate <= now) {
        return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 })
      }
      updates.scheduled_for = scheduledDate.toISOString()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 })
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from("scheduled_messages")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Failed to update message:", updateError)
      return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: updatedMessage })
  } catch (error) {
    console.error("Update message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
