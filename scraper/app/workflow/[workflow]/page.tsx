"use client";

import { WorkflowHeader } from "@/components/workflow/header";
import { WorkflowToolbar } from "@/components/workflow/toolbar";
import {
  SIDEBAR_ACTIONS,
  WorkflowMenuPanel,
  WorkflowSidebar,
} from "@/components/workflow/sidebar";
import { WorkflowCanvas } from "@/components/workflow/canvas";

import { ActionTemplate, Node } from "@/types/webscraper";
import { WorkflowInspector } from "@/components/inspector";
import VariablesPanel from "@/components/variables";
import { AnalyzeWithAIModal } from "@/components/analyzewithai";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flag, Play } from "lucide-react";




interface Variable {
  id: string;
  name: string;
  value: string;
 
  env: "GLOBAL" | "ENV";
}



export default function WorkflowDashboard() {
  const router = useRouter();
  const params = useParams<{ workflow: string }>();
  const workflowIdFromRoute = params?.workflow;
  const [expandedItem, setExpandedItem] = useState(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ActionTemplate | null>(null);

  const selectedNode = nodes.find((n: { id: any; }) => n.id === selectedNodeId) ?? null;
  const [variables, setVariables] = useState<Variable[]>([]);

  const [workflowPrompt, setWorkflowPrompt] = useState("");
  const [isGeneratingWorkflow, setIsGeneratingWorkflow] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [workflowId, setWorkflowId] = useState<string | null>(
    workflowIdFromRoute && workflowIdFromRoute !== "new" ? workflowIdFromRoute : null
  );
  const [workflowName, setWorkflowName] = useState("");
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(
    !!workflowIdFromRoute && workflowIdFromRoute !== "new"
  );

  const actionTemplateMap = Object.values(SIDEBAR_ACTIONS).reduce<Record<string, any>>(
    (acc, actions) => {
      actions.forEach((action) => {
        acc[action.id] = action
      })
      return acc
    },
    {}
  )

  const hydrateNode = (node: Node): Node => {
    if (node.type === "trigger") {
      return {
        ...node,
        icon: Play,
        variant: node.variant ?? "start",
      }
    }
    if (node.type === "finish") {
      return {
        ...node,
        icon: Flag,
        variant: node.variant ?? "finish",
      }
    }

    const template = node.actionTemplateId
      ? actionTemplateMap[node.actionTemplateId]
      : null

    return {
      ...node,
      icon: template?.icon ?? node.icon,
      variant: node.variant ?? template?.section ?? null,
      config: node.config ?? {},
      inputs: node.inputs ?? {},
      meta: node.meta ?? {},
    }
  }

  const hydrateNodes = (incomingNodes: Node[]) =>
    incomingNodes.map((node) => hydrateNode(node))

  useEffect(() => {
    async function loadWorkflow() {
      if (!workflowIdFromRoute || workflowIdFromRoute === "new") {
        setIsLoadingWorkflow(false);
        return;
      }

      setIsLoadingWorkflow(true);
      setSaveError("");

      try {
        const response = await fetch(`/api/workflows/${workflowIdFromRoute}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to load workflow");
        }

        const data = await response.json();
        setWorkflowId(data.id);
        setWorkflowName(data.name || "");
        setNodes(hydrateNodes(Array.isArray(data.nodes) ? data.nodes : []));
      } catch (err: any) {
        setSaveError(err?.message ?? "Failed to load workflow");
      } finally {
        setIsLoadingWorkflow(false);
      }
    }

    loadWorkflow();
  }, [workflowIdFromRoute]);

  const handleSaveWorkflow = async () => {
    const nextName =
      workflowName.trim() ||
      window.prompt("Name this workflow before saving:", workflowName || "")?.trim() ||
      "";

    if (!nextName) {
      setSaveError("Workflow name is required.");
      return;
    }

    setWorkflowName(nextName);
    setIsSavingWorkflow(true);
    setSaveError("");

    try {
      const response = await fetch(`/api/workflows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          workflowId,
          name: nextName,
          nodes,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to save workflow");
      }

      const data = await response.json();
      setWorkflowId(data.id);
      setWorkflowName(data.name || nextName);
      if (workflowIdFromRoute === "new" && data.id) {
        router.replace(`/workflow/${data.id}`);
      }
    } catch (err: any) {
      setSaveError(err?.message ?? "Failed to save workflow");
    } finally {
      setIsSavingWorkflow(false);
    }
  };

  const handleWorkflowCreation = async () => {
    if (!workflowPrompt.trim()) {
      setGenerationError("Describe what you want the workflow to do.");
      return;
    }

    setIsGeneratingWorkflow(true);
    setGenerationError("");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    try {
      const response = await fetch(`/api/workflows/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: workflowPrompt,
          workflowName,
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "AI workflow generation failed");
      }

      const data = await response.json();
      const aiNodes: Node[] = hydrateNodes(Array.isArray(data.nodes) ? data.nodes : []);

      if (aiNodes.length) {
        setNodes((prev: Node[]) => [...prev, ...aiNodes]);
        setWorkflowPrompt("");
      } else {
        setGenerationError("AI returned no nodes for that prompt.");
      }
    } catch (err: any) {
      setGenerationError(err?.message ?? "Unable to generate workflow");
    } finally {
      setIsGeneratingWorkflow(false);
    }
  };

  const handleActionClick = (action: ActionTemplate) => {
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: "action",
      variant: expandedItem,
      label: action.label,
      x: 120,
      y: 120,
      icon: action.icon,
      actionTemplateId: action.id,
      inputs: {},
      config: undefined
    };

    setNodes((prev: any) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setSelectedTemplate(action);
    setExpandedItem(null);
  };
  async function runMultipleNodes() {
    console.log(nodes);

    const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL+"/run-multiple-nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes }),
    });

    const data = await response.json();
    console.log(data.results);
  }

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes((prev: any[]) => prev.filter((n: { id: any; }) => n.id !== selectedNodeId));
    setSelectedNodeId(null);
    setSelectedTemplate(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-(--forloop-bg) text-(--forloop-text) font-sans">
      <WorkflowSidebar
        expandedItem={expandedItem}
        setExpandedItem={setExpandedItem}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <WorkflowHeader
          workflowName={workflowName}
          onWorkflowNameChange={setWorkflowName}
          isSaving={isSavingWorkflow}
          onSave={handleSaveWorkflow}
        />
        <WorkflowToolbar
          runMultipleNodes={runMultipleNodes}
          deleteNode={deleteSelectedNode}
          saveWorkflow={handleSaveWorkflow}
        />
        <div className="border-b border-[var(--forloop-border)] bg-white px-4 py-3 space-y-2">
          {isLoadingWorkflow ? (
            <p className="text-xs text-gray-500">Loading workflow...</p>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              Ask the agent to turn text into workflow nodes.
            </p>
            <button
              onClick={handleWorkflowCreation}
              disabled={isGeneratingWorkflow}
              className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGeneratingWorkflow ? "Generating…" : "Generate workflow"}
            </button>
          </div>
          <textarea
            value={workflowPrompt}
            onChange={(event) => setWorkflowPrompt(event.target.value)}
            placeholder="Eg. Open the blog homepage, scrape the latest posts, and save titles to a sheet."
            className="min-h-[72px] w-full rounded-xl border border-dashed border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          />
          {generationError && (
            <p className="text-xs text-red-600">{generationError}</p>
          )}
          {saveError && (
            <p className="text-xs text-red-600">{saveError}</p>
          )}
        </div>
        <WorkflowCanvas
          nodes={nodes}
          setNodes={setNodes}
          onSelectNode={(id: any) =>
            setSelectedNodeId(id)
          }
        />
        <WorkflowMenuPanel
          expandedItem={expandedItem}
          setExpandedItem={setExpandedItem}
          onActionClick={handleActionClick}
        />

        {selectedNode && (
          <WorkflowInspector
            selectedNode={selectedNode}
         //   template={selectedTemplate}   
            allselected={nodes}
            onClose={() => setSelectedNodeId(null)}
        variables={variables}
            onUpdateNode={(updatedNode) => {
              setNodes((prev: any[]) =>
                prev.map((n) => (n.id === updatedNode.id ? updatedNode : n))
              );
            }}  
          />
        )}
        <VariablesPanel
        variables={variables}
        setVariables={setVariables}
        />
        <div className=" absolute bottom-3.5 right-5">
<AnalyzeWithAIModal />

        </div>
        
      </div>
    </div>
  );
}
