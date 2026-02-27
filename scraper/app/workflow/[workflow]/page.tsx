"use client";

import { WorkflowHeader } from "@/components/workflow/header";
import { WorkflowToolbar } from "@/components/workflow/toolbar";
import {
  WorkflowMenuPanel,
  WorkflowSidebar,
} from "@/components/workflow/sidebar";
import { WorkflowCanvas } from "@/components/workflow/canvas";

import { ActionTemplate, Node } from "@/types/webscraper";
import { WorkflowInspector } from "@/components/inspector";
import VariablesPanel from "@/components/variables";
import { AnalyzeWithAIModal } from "@/components/analyzewithai";
import { useState } from "react";




interface Variable {
  id: string;
  name: string;
  value: string;
 
  env: "GLOBAL" | "ENV";
}



export default function WorkflowDashboard() {
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

  const getAuthToken = () =>
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth-token="))
      ?.split("=")[1];

  const handleWorkflowCreation = async () => {
    if (!workflowPrompt.trim()) {
      setGenerationError("Describe what you want the workflow to do.");
      return;
    }

    setIsGeneratingWorkflow(true);
    setGenerationError("");

    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/createNewWorkflow`,
        {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ prompt: workflowPrompt }),
        }
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "AI workflow generation failed");
      }

      const data = await response.json();
      const aiNodes: Node[] = Array.isArray(data.nodes) ? data.nodes : [];

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
        
        />
        <WorkflowToolbar
          runMultipleNodes={runMultipleNodes}
          deleteNode={deleteSelectedNode}
        />
        <div className="border-b border-[var(--forloop-border)] bg-white px-4 py-3 space-y-2">
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
