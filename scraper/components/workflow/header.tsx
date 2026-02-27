"use client";

import { Button } from "@/components/ui/button";
import { AtomIcon, Bell, HelpCircle } from "lucide-react";
import { useState } from "react";

export function WorkflowHeader() {
  const [aiPrompt, setAIprompt] = useState(false);
  return (
    <header className="h-14 border-b border-[var(--forloop-border)] bg-white flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br bg-orange-400  flex items-center justify-center">
          {/* <ImageIcon className="w-4 h-4 text-white" /> */}
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

      <Button >
        Save
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
