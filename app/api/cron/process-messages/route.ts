import { NextResponse } from "next/server"
import { MessageScheduler } from "@/lib/message-scheduler"

// This endpoint can be called by a cron job service (like Vercel Cron or external cron)
export async function POST() {
  try {
    const scheduler = new MessageScheduler()
    await scheduler.processPendingMessages()

    return NextResponse.json({ success: true, message: "Processed pending messages" })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: "Failed to process messages" }, { status: 500 })
  }
}

// Allow GET for testing purposes
export async function GET() {
  return POST()
}
