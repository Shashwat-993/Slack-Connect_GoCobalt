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

    // Get user's connected workspaces
    const { data: workspaces, error: workspacesError } = await supabase
      .from("slack_workspaces")
      .select("id, workspace_id, workspace_name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (workspacesError) {
      console.error("Failed to fetch workspaces:", workspacesError)
      return NextResponse.json({ error: "Failed to fetch workspaces" }, { status: 500 })
    }

    return NextResponse.json({ workspaces })
  } catch (error) {
    console.error("Get workspaces error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
