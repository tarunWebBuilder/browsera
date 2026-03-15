import { NextResponse } from "next/server"
import {
  createWorkflow,
  listWorkflowsByEmail,
  requireClerkEmail,
  updateWorkflow,
} from "@/lib/supabase-workflows"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const email = await requireClerkEmail()
    const workflows = await listWorkflowsByEmail(email)
    return NextResponse.json(workflows)
  } catch (error: any) {
    const status = error?.message === "Unauthorized" ? 401 : 500
    return NextResponse.json(
      { error: error?.message ?? "Failed to list workflows" },
      { status }
    )
  }
}

export async function POST(request: Request) {
  try {
    const email = await requireClerkEmail()
    const payload = await request.json()

    const workflowId =
      typeof payload?.workflowId === "string" && payload.workflowId.trim()
        ? payload.workflowId
        : null
    const name =
      typeof payload?.name === "string" ? payload.name.trim() : ""
    const nodes = Array.isArray(payload?.nodes) ? payload.nodes : []

    if (!name) {
      return NextResponse.json({ error: "Workflow name is required" }, { status: 400 })
    }

    const row = workflowId
      ? await updateWorkflow(email, workflowId, name, nodes)
      : await createWorkflow(email, name, nodes)

    return NextResponse.json({
      id: row.id,
      name: row.name,
      nodes: Array.isArray(row.nodes) ? row.nodes : [],
      ownerEmail: row.owner_email,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })
  } catch (error: any) {
    const status =
      error?.message === "Unauthorized"
        ? 401
        : error?.message === "Workflow not found"
          ? 404
          : 500

    return NextResponse.json(
      { error: error?.message ?? "Failed to save workflow" },
      { status }
    )
  }
}
