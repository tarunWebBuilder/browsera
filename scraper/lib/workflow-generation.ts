import { auth, currentUser } from "@clerk/nextjs/server"

type ActionSection = "webscraping" | "datasources" | "cleaning" | "control" | "integrations"

type GeneratedNode = {
  id?: string
  workflowId?: string
  type?: "trigger" | "action" | "logic" | "finish"
  variant?: string | null
  label?: string
  x?: number
  y?: number
  actionTemplateId?: string
  inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
  meta?: Record<string, unknown>
  status?: "idle" | "running" | "success" | "failed"
  config?: Record<string, unknown>
}

const ACTION_SECTIONS: Record<ActionSection, string[]> = {
  webscraping: [
    "click",
    "wait",
    "write",
    "solveAndPaginateHtml",
    "solveCaptcha",
    "solveOSCaptcha",
    "useKey",
    "openBrowser",
    "loadWebsite",
    "refreshPageSource",
    "clickXPath",
    "scanWebPage",
    "extractXPath",
    "extractMultipleXPaths",
    "clickName",
    "clickId",
    "getCurrentUrl",
    "closeBrowser",
  ],
  datasources: [
    "addDatabase",
    "loadExcelCsv",
    "saveExcelCsv",
    "getApiRest",
    "postApiRest",
    "loadJsonFile",
    "saveJsonFile",
  ],
  cleaning: [
    "dropColumn",
    "renameColumn",
    "selectColumns",
    "addConstantColumn",
    "replaceString",
    "searchString",
    "filterString",
    "splitString",
    "sortData",
    "removeDuplicates",
    "removeEmptyRows",
    "knnImputation",
  ],
  control: [
    "start",
    "finish",
    "addVariable",
    "convertVariable",
    "mathModify",
    "ifCondition",
    "printVariable",
    "loadPythonScript",
  ],
  integrations: [
    "connectMongo",
    "insertMongo",
    "deleteMongo",
    "connectMilvus",
    "insertMilvus",
    "deleteMilvus",
    "analyzeSite",
    "scrapeJsSite",
    "fetchText",
    "pdfTomarkdown",
  ],
}

const ACTION_TO_SECTION = Object.entries(ACTION_SECTIONS).reduce<Record<string, ActionSection>>(
  (acc, [section, ids]) => {
    ids.forEach((id) => {
      acc[id] = section as ActionSection
    })
    return acc
  },
  {}
)

const ACTION_SUMMARY = Object.entries(ACTION_SECTIONS)
  .map(([section, ids]) => `${section}: ${ids.join(", ")}`)
  .join("\n")

function requireMistralEnv() {
  const apiKey = process.env.MISTRAL_API_KEY
  const model = process.env.MISTRAL_MODEL || "mistral-medium-latest"
  if (!apiKey) {
    throw new Error("Missing MISTRAL_API_KEY")
  }
  return { apiKey, model }
}

async function getRequesterEmail() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }

  const user = await currentUser()
  const email =
    user?.emailAddresses?.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null

  if (!email) {
    throw new Error("No email address found for signed-in user")
  }

  return email
}

function stripCodeFences(content: string) {
  const trimmed = content.trim()
  if (!trimmed.startsWith("```")) {
    return trimmed
  }
  return trimmed.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim()
}

function extractNodes(parsed: unknown): GeneratedNode[] {
  if (Array.isArray(parsed)) {
    return parsed as GeneratedNode[]
  }
  if (parsed && typeof parsed === "object") {
    const candidate = parsed as Record<string, unknown>
    if (Array.isArray(candidate.nodes)) {
      return candidate.nodes as GeneratedNode[]
    }
    if (
      candidate.workflow &&
      typeof candidate.workflow === "object" &&
      Array.isArray((candidate.workflow as Record<string, unknown>).nodes)
    ) {
      return (candidate.workflow as Record<string, unknown>).nodes as GeneratedNode[]
    }
  }
  throw new Error("Mistral response did not include a nodes array")
}

function normalizeNodes(rawNodes: GeneratedNode[]) {
  const sanitized = rawNodes
    .filter((node) => node && typeof node === "object")
    .map((node, index) => {
      const actionTemplateId = node.actionTemplateId
      const inferredSection = actionTemplateId ? ACTION_TO_SECTION[actionTemplateId] : undefined
      const inferredType =
        node.type ||
        (actionTemplateId === "start" ? "trigger" : actionTemplateId === "finish" ? "finish" : "action")

      return {
        id: node.id || `node-${index + 1}`,
        workflowId: node.workflowId,
        type: inferredType,
        variant:
          node.variant ??
          (inferredType === "trigger"
            ? "start"
            : inferredType === "finish"
              ? "finish"
              : inferredSection || null),
        label:
          node.label ||
          (inferredType === "trigger"
            ? "Start"
            : inferredType === "finish"
              ? "Finish"
              : actionTemplateId || `Step ${index + 1}`),
        x: typeof node.x === "number" ? node.x : 120 + index * 220,
        y: typeof node.y === "number" ? node.y : 120 + (index % 2) * 120,
        actionTemplateId,
        inputs: node.inputs || {},
        outputs: node.outputs || {},
        status: node.status || "idle",
        config: node.config || node.inputs || {},
        meta: node.meta || {},
      }
    })

  if (!sanitized.length) {
    return []
  }

  const withBounds = [...sanitized]

  if (withBounds[0].type !== "trigger") {
    withBounds.unshift({
      id: "start-node",
      type: "trigger",
      variant: "start",
      label: "Start",
      x: 80,
      y: 120,
      actionTemplateId: undefined,
      inputs: {},
      outputs: {},
      status: "idle" as const,
      config: {},
      meta: {},
    })
  }

  if (withBounds[withBounds.length - 1].type !== "finish") {
    const last = withBounds[withBounds.length - 1]
    withBounds.push({
      id: "finish-node",
      type: "finish",
      variant: "finish",
      label: "Finish",
      x: (typeof last.x === "number" ? last.x : 120) + 240,
      y: typeof last.y === "number" ? last.y : 120,
      actionTemplateId: undefined,
      inputs: {},
      outputs: {},
      status: "idle" as const,
      config: {},
      meta: {},
    })
  }

  return withBounds.map((node, index) => {
    const nextNode = withBounds[index + 1]
    return {
      ...node,
      meta: {
        ...(node.meta || {}),
        nextNodeIds: nextNode ? [nextNode.id] : [],
      },
    }
  })
}

export async function generateWorkflowFromPrompt(prompt: string, workflowName?: string) {
  if (!prompt.trim()) {
    throw new Error("Prompt must not be empty")
  }

  const email = await getRequesterEmail()
  const { apiKey, model } = requireMistralEnv()

  const systemPrompt = `
You are an agentic workflow architect. Return only valid JSON.
Build a complete browser/data workflow as a nodes array for a visual editor.
Use only these action ids:
${ACTION_SUMMARY}

Rules:
- Produce an end-to-end workflow, not isolated steps.
- Include a trigger-like first step and a finish-like last step.
- Every action step must use a valid actionTemplateId from the list above.
- Set type to trigger, action, logic, or finish.
- Set variant to the matching section for action nodes.
- Use short labels.
- Use x/y positions for a left-to-right layout.
- Prefer realistic defaults in inputs/config.
- The workflow should be visually connectable in order.
- Return JSON only in the form { "nodes": [...] }.
`.trim()

  const userPrompt = `
User email: ${email}
Workflow name: ${workflowName || "Untitled workflow"}
Goal: ${prompt.trim()}
`.trim()

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 1400,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const payload = await response.json()
  const content = stripCodeFences(payload?.choices?.[0]?.message?.content || "")
  const parsed = JSON.parse(content)
  const nodes = normalizeNodes(extractNodes(parsed))

  return { email, nodes }
}
