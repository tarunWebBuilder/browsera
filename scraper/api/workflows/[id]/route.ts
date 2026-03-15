import { NextResponse } from "next/server"
import { getWorkflowById, requireClerkEmail } from "@/lib/supabase-workflows"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const email = await requireClerkEmail()
    const { id } = await context.params
    const workflow = await getWorkflowById(email, id)

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    return NextResponse.json(workflow)
  } catch (error: any) {
    const status = error?.message === "Unauthorized" ? 401 : 500
    return NextResponse.json(
      { error: error?.message ?? "Failed to load workflow" },
      { status }
    )
  }
}
