import { auth, currentUser } from "@clerk/nextjs/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

type WorkflowRecord = {
  id: string
  owner_email: string
  name: string
  nodes: unknown[]
  created_at: string
  updated_at: string
}

function ensureSupabaseEnv() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for workflow storage."
    )
  }
}

function getRestUrl(path: string) {
  ensureSupabaseEnv()
  return `${supabaseUrl}/rest/v1/${path}`
}

function getRestHeaders(prefer?: string) {
  ensureSupabaseEnv()
  return {
    apikey: supabaseServiceRoleKey as string,
    Authorization: `Bearer ${supabaseServiceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  }
}

export async function requireClerkEmail() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }

  const user = await currentUser()
  const email =
    user?.emailAddresses?.find((item) => item.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null

  if (!email) {
    throw new Error("No email address found for signed-in user")
  }

  return email
}

export async function listWorkflowsByEmail(email: string) {
  const params = new URLSearchParams({
    select: "id,name,created_at,updated_at,nodes",
    owner_email: `eq.${email}`,
    order: "updated_at.desc",
  })

  const response = await fetch(getRestUrl(`workflows?${params.toString()}`), {
    headers: getRestHeaders(),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const rows = (await response.json()) as WorkflowRecord[]
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    nodeCount: Array.isArray(row.nodes) ? row.nodes.length : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getWorkflowById(email: string, workflowId: string) {
  const params = new URLSearchParams({
    select: "id,name,nodes,created_at,updated_at",
    id: `eq.${workflowId}`,
    owner_email: `eq.${email}`,
  })

  const response = await fetch(getRestUrl(`workflows?${params.toString()}`), {
    headers: getRestHeaders(),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const rows = (await response.json()) as Array<{
    id: string
    name: string
    nodes: unknown[]
    created_at: string
    updated_at: string
  }>

  if (!rows.length) {
    return null
  }

  const row = rows[0]
  return {
    id: row.id,
    name: row.name,
    nodes: Array.isArray(row.nodes) ? row.nodes : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createWorkflow(email: string, name: string, nodes: unknown[]) {
  const response = await fetch(getRestUrl("workflows"), {
    method: "POST",
    headers: getRestHeaders("return=representation"),
    body: JSON.stringify([
      {
        owner_email: email,
        name,
        nodes,
      },
    ]),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const rows = (await response.json()) as WorkflowRecord[]
  return rows[0]
}

export async function updateWorkflow(
  email: string,
  workflowId: string,
  name: string,
  nodes: unknown[]
) {
  const params = new URLSearchParams({
    id: `eq.${workflowId}`,
    owner_email: `eq.${email}`,
  })

  const response = await fetch(getRestUrl(`workflows?${params.toString()}`), {
    method: "PATCH",
    headers: getRestHeaders("return=representation"),
    body: JSON.stringify({
      name,
      nodes,
      updated_at: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const rows = (await response.json()) as WorkflowRecord[]
  if (!rows.length) {
    throw new Error("Workflow not found")
  }
  return rows[0]
}
