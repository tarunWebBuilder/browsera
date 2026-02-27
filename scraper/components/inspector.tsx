import {  useEffect, useState } from "react"
import { SIDEBAR_ACTIONS } from "./workflow/sidebar"






export type ActionSection = "webscraping" | "datasources" | "cleaning" | "control"

export type JsonSchemaType = "string" | "number" | "boolean" | "object" | "array" | "integer"

export type ParameterSchema = {
  title?: string
  description?: string
  type: JsonSchemaType | JsonSchemaType[]
  properties?: {
    [key: string]: ParameterSchema & { enum?: any[]; default?: any }
  }
  required?: string[]
  enum?: any[]
  default?: any
  items?: ParameterSchema // Added to support array item schemas
}

export interface ActionTemplate {
  id: string
  section: "webscraping" | "datasources" | "cleaning" | "control"
  label: string
  description?: string
  icon?: string
  parameterSchema?: ParameterSchema
  runtimeHints?: { timeoutMs?: number; memoryMb?: number; trusted?: boolean }
  version?: string
}

export interface Node {
  id: string
  workflowId?: string
  type: "trigger" | "action" | "logic" | "finish"
  variant?: "webscraping" | "datasources" | "cleaning" | "control"
  label: string
  x: number
  y: number
  icon?: string
  actionTemplateId?: string
  inputs?: Record<string, any> // configured parameter values
  outputs?: Record<string, any>
  meta?: Record<string, any>
  status?: "idle" | "running" | "success" | "failed",
  config: any, 
}



export function useLocalForm<T>(storageKey: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [storageKey, state])

  return [state, setState] as const
}



const ACTION_TEMPLATE_MAP: Record<string, ActionTemplate> = Object.fromEntries(
  Object.values(SIDEBAR_ACTIONS)
    .flat()
    .map((a) => [a.id, a])
)

function renderField(
  key: string,
  schema: any,
  value: any,
  variables:any,
  onChange: (k: string, v: any) => void
) {
  const title = schema.title || key
  const desc = schema.description || ""

  if (schema.enum) {
    return (
      <div key={key} className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {title}
        </label>
        <select
          value={value ?? schema.default ?? ""}
          onChange={(e) => onChange(key, e.target.value)}
          className="w-full px-2 py-1 border rounded"
        >
          {schema.enum.map((opt: any) => (
            <option key={String(opt)} value={opt}>
              {String(opt)}
            </option>
          ))}
        </select>
        {desc && <div className="text-[11px] text-gray-400 mt-1">{desc}</div>}
      </div>
    )
  }

  // Only show variables if value is empty
  if (!value && variables.length > 0) {
    return (
      <div key={key} className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {title}
        </label>
        <select
          value=""
          onChange={(e) => {
          console.log(e.target.value,'this is dropdown');
          console.log(key);
          const value2= variables.find((v:any) => v.name === e.target.value)?.value ?? null
          console.log(value2);
          
            onChange(key, value2)
          }}
          className="w-full px-2 py-1 border rounded"
        >
          <option value="">—</option>
          {variables.map((v:any) => (
            <option key={v.id} >
              {v.name}
            </option>
          ))}
        </select>
        {desc && <div className="text-[11px] text-gray-400 mt-1">{desc}</div>}
      </div>
    )
  }



  switch (schema.type) {
    case "boolean":
      return (
        <div key={key} className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(key, e.target.checked)}
            className="w-4 h-4"
          />
          <div>
            <div className="text-sm font-medium">{title}</div>
            {desc && <div className="text-[11px] text-gray-400">{desc}</div>}
          </div>
        </div>
      )

    case "integer":
    case "number":
      return (
        <div key={key} className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {title}
          </label>
          <input
            type="number"
            value={value ?? schema.default ?? ""}
            onChange={(e) =>
              onChange(
                key,
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            className="w-full px-2 py-1 border rounded"
          />
          {desc && <div className="text-[11px] text-gray-400 mt-1">{desc}</div>}
        </div>
      )

  default:
  if (schema.type === "object") {
    const textValue =
      typeof value === "string"
        ? value
        : JSON.stringify(value ?? schema.default ?? {}, null, 2)

    return (
      <div key={key} className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {title}
        </label>
        <textarea
          value={textValue}
          onChange={(e) => {
            const nextText = e.target.value
            try {
              // If valid JSON, store the parsed object; otherwise, store the raw text
              const parsed = JSON.parse(nextText)
              onChange(key, parsed)
            } catch {
              onChange(key, nextText)
            }
          }}
          placeholder='Enter JSON, e.g. {"captchaTextSelector":"#captcha-code"}'
          className="w-full px-2 py-1 border rounded font-mono"
          rows={4}
        />
        {desc && <div className="text-[11px] text-gray-400 mt-1">{desc}</div>}
      </div>
    )
  }

  return (
    <div key={key} className="mb-3">
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {title}
      </label>
      <input
        type="text"
        value={value ?? schema.default ?? ""}
        onChange={(e) => onChange(key, e.target.value)}
        className="w-full px-2 py-1 border rounded"
      />
      {desc && <div className="text-[11px] text-gray-400 mt-1">{desc}</div>}
    </div>
  )

  }
}



interface Variable {
  id: string;
  name: string;
  value: string;
 
  env: "GLOBAL" | "ENV";
}

/* ---------------------------------------------
   Inspector Component
--------------------------------------------- */
export function WorkflowInspector({
  selectedNode,
  onUpdateNode,
  onClose,
    variables,
    allselected       
}: {
  selectedNode: Node | null
  onUpdateNode: (node: Node) => void
  onClose: () => void,
  variables: Variable[],
  allselected: any[]
}) {
  const [local, setLocal] = useState<Record<string, any>>({})
const [formValues, setFormValues] = useLocalForm(
  `action-config-${selectedNode?.id}`,
  {}
)
console.log('these are selected nodes ',allselected,selectedNode);


const resolvedTemplate =
  selectedNode?.actionTemplateId
    ? ACTION_TEMPLATE_MAP[selectedNode.actionTemplateId]
    : null


  /* Sync local state when node or template changes */
  useEffect(() => {
    if (!selectedNode || !resolvedTemplate) return

    const defaults =
      resolvedTemplate.parameterSchema?.properties
        ? Object.fromEntries(
            Object.entries(
              resolvedTemplate.parameterSchema.properties
            ).map(([k, s]: any) => [
              k,
              selectedNode.inputs?.[k] ?? s.default ?? "",
            ])
          )
        : {}

setLocal({
  ...defaults,
  ...formValues, 
})

  }, [selectedNode?.id, selectedNode?.inputs, resolvedTemplate])

  if (!selectedNode) return null

  const schema = resolvedTemplate?.parameterSchema
  const properties = schema?.properties ?? {}

  const captchaType = local.captchaType
  const captchaFieldGroups: Record<string, string[]> = {
    image: ["imagePath", "imageBase64", "imageSelector"],
    normal: ["imagePath", "imageBase64", "imageSelector"],
    number: ["imagePath", "imageBase64", "imageSelector"],
    text: ["imagePath", "imageBase64", "imageSelector"],
    math: ["imagePath", "imageBase64", "imageSelector"],
    recaptcha_v2: ["pageUrl", "siteKey"],
    recaptcha_v2_invisible: ["pageUrl", "siteKey"],
    recaptcha_v2_callback: ["pageUrl", "siteKey"],
    recaptcha_v3: ["pageUrl", "siteKey", "score"],
    turnstile: ["pageUrl", "siteKey"],
    geetest: ["pageUrl", "gt", "challenge", "apiServer"],
    funcaptcha: ["pageUrl", "siteKey", "surl"],
    hcaptcha: ["pageUrl", "siteKey"],
    keycaptcha: [
      "pageUrl",
      "s_s_c_user_id",
      "s_s_c_session_id",
      "s_s_c_web_server_sign",
      "s_s_c_web_server_sign2",
    ],
    capy: ["pageUrl", "siteKey", "apiServer"],
    datadome: ["pageUrl", "captchaUrl", "userAgent"],
    textcaptcha: ["text"],
  }

  const captchaCommonFields = ["captchaType", "captchaApiKey"]
  const flatCaptchaFields = Array.from(
    new Set(Object.values(captchaFieldGroups).flat().concat(captchaCommonFields))
  )

  let visibleKeys: string[]
  if (selectedNode?.actionTemplateId === "solveCaptcha") {
    visibleKeys = [
      ...captchaCommonFields,
      ...(captchaFieldGroups[captchaType as string] ?? []),
    ]
  } else if (selectedNode?.actionTemplateId === "solveAndPaginateHtml") {
    const base = Object.keys(properties).filter((k) => !flatCaptchaFields.includes(k))
    visibleKeys = [
      ...base,
      ...captchaCommonFields,
      ...(captchaFieldGroups[captchaType as string] ?? []),
    ]
  } else {
    visibleKeys = Object.keys(properties)
  }

function handleChange(k: string, v: any) {
  console.log(k,v);
  
  const updated = { ...local, [k]: v }
  setLocal(updated)
console.log(updated);

  onUpdateNode({
    ...selectedNode!,
    inputs: updated, // 🔥 persist into node
  
  })
}

// Inside WorkflowInspector component

const [running, setRunning] = useState(false);
const [result, setResult] = useState<any>(null);
const [error, setError] = useState<string | null>(null);
const [sessionId, setSessionId] = useState<string | null>(null);
let config = selectedNode.config ?? {};

if (selectedNode.actionTemplateId !== "openBrowser") {
  config = {
    ...config,
    sessionId, // stored from openBrowser result
  };
}

async function handleRun() {
  if (!selectedNode || !resolvedTemplate) return;

  setRunning(true);
  setError(null);
  setResult(null);

console.log({
     actionId: selectedNode.actionTemplateId, // <-- must match backend
    inputs: local,
    config, // optional, can be empty
        label: selectedNode.label,
        


      });


  try {
    // Normalize object-typed fields that may still be raw strings
    const normalizedInputs = { ...local }
    const properties = resolvedTemplate.parameterSchema?.properties || {}
    Object.entries(properties).forEach(([k, schema]: any) => {
      const t = schema.type
      const isObjectType = t === "object" || (Array.isArray(t) && t.includes("object"))
      if (isObjectType && typeof normalizedInputs[k] === "string") {
        try {
          normalizedInputs[k] = JSON.parse(normalizedInputs[k])
        } catch {
          // keep as string; backend validation will surface errors
        }
      }
    })

//var local

// if(selectedNode.actionTemplateId="connectMongo"){
//     local = {
//   connectionConfig: {
//     uri: "mongodb://localhost:27017"
//   }
// }
// }
    const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL+"/run-node", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
     actionId: selectedNode.actionTemplateId, // <-- must match backend
    inputs: normalizedInputs,
    config, // optional, can be empty
        label: selectedNode.label,
        


      }),
    });


    const data = await response.json();
console.log(data,'this is data');
if (data.result?.sessionId) {
  setSessionId(data.result.sessionId);
}


// nextNode.config.sessionId = sessionId

    if (!response.ok) {
      throw new Error(data.error || data.detail || "Unknown error");
    }

    setResult(data);
    // Optionally update node status/output in canvas
    onUpdateNode({
      ...selectedNode,
      inputs: local,
      status: "success",
      outputs: data.output || data.result || data,
    });
  } catch (err: any) {
    console.error("Run failed:", err);
    setError(err.message || "Failed to run node");
    onUpdateNode({
      ...selectedNode,
      status: "failed",
    });
  } finally {
    setRunning(false);
  }
}

  return (
    <div
      className="fixed right-8 top-24 bg-white border rounded-lg shadow-lg z-50"
      style={{ maxWidth: 720 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div>
          <div className="text-sm font-semibold">{selectedNode.label}</div>
          <div className="text-xs text-gray-500">
            {resolvedTemplate?.label ??
              selectedNode.actionTemplateId ??
              selectedNode.variant}
          </div>
        </div>
        <div className="flex items-center gap-2">
       <button
  onClick={handleRun}
  disabled={running}
  className={`px-4 py-1.5 rounded text-sm font-medium transition ${
    running
      ? "bg-gray-400 text-gray-700 cursor-not-allowed"
      : "bg-green-600 text-white hover:bg-green-700"
  }`}
>
  {running ? "Running..." : "Run Node"}
</button>



          <button onClick={onClose} className="text-sm text-gray-600">Close</button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 max-h-[56vh] overflow-y-auto">
        {!schema && (
          <div className="text-sm text-gray-500">
            No parameters for this node.
          </div>
        )}

        {schema && Object.keys(properties).length === 0 && (
          <div className="text-sm text-gray-500">
            No configurable parameters.
          </div>
        )}

      {schema &&
        visibleKeys
          .map((k) => ({ k, schema: properties[k] }))
          .filter((entry) => entry.schema) // skip missing definitions
          .map(({ k, schema }) =>
            renderField(
              k,
              schema,
              local[k], // value comes from local state
              variables,
              handleChange // handles local + storage sync
            )
          )}

      </div>


      {/* Result / Error Display */}
<div className="mt-4 pt-4 border-t">
  {error && (
    <div className="p-3 bg-red-50 border border-red-200 rounded">
      <p className="text-sm font-medium text-red-800">Error:</p>
      <pre className="text-xs text-red-700 mt-1 whitespace-pre-wrap">
        {error}
      </pre>
    </div>
  )}
Hii
  {result && (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
      <p className="text-sm font-medium text-blue-800">Success! Output:</p>
      <pre className="text-xs text-blue-700 mt-2 whitespace-pre-wrap max-h-60 overflow-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )}
</div>
    </div>
  )
}
