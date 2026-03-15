"use client";

import { Button } from "@/components/ui/button";
import { AtomIcon, Loader2, PencilLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type WorkflowHeaderProps = {
  workflowName: string
  onWorkflowNameChange: (value: string) => void
  isSaving: boolean
  onSave: () => void
}

export function WorkflowHeader({
  workflowName,
  onWorkflowNameChange,
  isSaving,
  onSave,
}: WorkflowHeaderProps) {
  const [aiPrompt, setAIprompt] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditingName) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditingName]);

  return (
    <header className="h-14 border-b border-[var(--forloop-border)] bg-white flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br bg-orange-400  flex items-center justify-center">
          {/* <ImageIcon className="w-4 h-4 text-white" /> */}
        </div>
        <div>
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                ref={inputRef}
                value={workflowName}
                onChange={(event) => onWorkflowNameChange(event.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setIsEditingName(false);
                  }
                }}
                placeholder="Untitled workflow"
                className="min-w-[220px] border-b border-gray-300 bg-transparent text-sm font-semibold text-gray-900 outline-none focus:border-orange-500"
              />
            ) : (
              <p className="text-sm font-semibold text-gray-900">
                {workflowName || "Untitled workflow"}
              </p>
            )}
            <button
              onClick={() => setIsEditingName(true)}
              className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Edit workflow name"
            >
              <PencilLine className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Node graph saved to Supabase Postgres
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (aiPrompt == true) {
              setAIprompt(false);
            } else {
              setAIprompt(true);
            }
          }}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <AtomIcon />
        </button>

      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isSaving ? "Saving..." : "Save"}
      </Button>
      </div>
      {aiPrompt ? <AIBox /> : null}
    </header>
  );
}

import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function AIBox() {
  return (
    <Card className="w-[360px] z-10 absolute top-10 right-20 rounded-2xl p-4 shadow-sm">
      {/* Top dropdown */}
      <Select defaultValue="ai">
        <SelectTrigger className="h-10 rounded-md">
          <SelectValue placeholder="Select AI" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ai">AI</SelectItem>
          <SelectItem value="gpt">GPT</SelectItem>
          <SelectItem value="assistant">Assistant</SelectItem>
        </SelectContent>
      </Select>

      {/* Prompt box */}
      <div className="mt-4">
        <Textarea
          placeholder="Prompt.."
          className="min-h-[140px] resize-none rounded-xl"
        />
      </div>
      <Button>Send</Button>
    </Card>
  );
}
