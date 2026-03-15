import { NextResponse } from "next/server"
import { generateWorkflowFromPrompt } from "@/lib/workflow-generation"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const prompt =
      typeof payload?.prompt === "string" ? payload.prompt : ""
    const workflowName =
      typeof payload?.workflowName === "string" ? payload.workflowName : undefined

    const result = await generateWorkflowFromPrompt(prompt, workflowName)
    return NextResponse.json(result)
  } catch (error: any) {
    const status =
      error?.message === "Unauthorized"
        ? 401
        : error?.message === "Prompt must not be empty"
          ? 400
          : 500

    return NextResponse.json(
      { error: error?.message ?? "Workflow generation failed" },
      { status }
    )
  }
}
