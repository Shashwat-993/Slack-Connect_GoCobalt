import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateSlackAuthUrl } from "@/lib/slack/config"

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

    // Generate state parameter for security (optional but recommended)
    const state = crypto.randomUUID()

    // Store state in session or database if needed for validation
    // For simplicity, we'll skip state validation in this example

    const authUrl = generateSlackAuthUrl(state)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("Error generating Slack auth URL:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
