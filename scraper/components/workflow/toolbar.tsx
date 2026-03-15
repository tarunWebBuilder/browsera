"use client"

import { Menu, FileText, FolderOpen, Save, Play, Pause, Share2, Code, Code2, DeleteIcon } from "lucide-react"
type WorkflowToolbarProps = {
  runMultipleNodes: () => void,
  deleteNode: () => void,
  saveWorkflow: () => void
}

export function WorkflowToolbar({ runMultipleNodes, deleteNode, saveWorkflow }: WorkflowToolbarProps) {
  return (
    <div className="h-12 border-b border-[var(--forloop-border)] bg-white flex items-center px-4 gap-1">
      <button className="w-9 h-9 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
        <Menu className="w-4 h-4 text-gray-600" />
      </button>

      <button className="w-9 h-9 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
        <FileText className="w-4 h-4 text-gray-600" />
      </button>

      <button onClick={deleteNode} className="w-9 h-9 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
        <DeleteIcon className="w-4 h-4 text-gray-600" />
      </button>

      <button
        onClick={saveWorkflow}
        className="w-9 h-9 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
      >
        <Save className="w-4 h-4 text-gray-600" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button onClick={runMultipleNodes} className="w-9 h-9 flex items-center justify-center rounded hover:bg-green-50 transition-colors">
        <Play className="w-4 h-4 text-green-600"  />
      </button>

      <button className="w-9 h-9 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
        <Pause className="w-4 h-4 text-gray-600" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button className="w-9 h-9 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
        <Share2 className="w-4 h-4 text-gray-600" />
      </button>

      <button className="w-9 h-9 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
        <Code className="w-4 h-4 text-gray-600" />
      </button>

      <button className="w-9 h-9 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
        <Code2 className="w-4 h-4 text-gray-600" />
      </button>

      <div className="flex-1" />

      <div className="text-xs text-gray-500 font-mono">Status bar</div>
    </div>
  )
}
