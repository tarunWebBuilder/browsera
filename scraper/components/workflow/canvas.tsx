"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Flag,
  MoreHorizontal,
  MousePointer2,
  Globe,
  Database,
  FilterIcon,
  Plus,
} from "lucide-react";

interface Node {
  id: string;
  type: "trigger" | "action" | "logic" | "finish";
  variant?: "web" | "processing" | "start" | "finish";
  label: string;
  x: number;
  y: number;
  icon: any;
  status?: "idle" | "running" | "success";
}



export function WorkflowCanvas({
  nodes,
  setNodes,
  onSelectNode,
}: {
  nodes: Node[];
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  onSelectNode: any;
}) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null); // Added state for node hover
  const [connections, setConnections] = useState<
    { from: string; to: string }[]
  >([]);


  const getVariantColor = (variant?: string) => {
    switch (variant) {
      case "webscraping":
        return "bg-orange-500"; // orange
      case "datasources":
        return "bg-green-500"; // green
      case "cleaning":
        return "bg-blue-500"; // blue
      case "control":
        return "bg-violet-500"; // violet
      case "web":
        return "bg-orange-500";
      case "processing":
        return "bg-teal-600";
      case "start":
      case "finish":
        return "bg-blue-700";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div
      className="flex-1 relative bg-[#f8fafc] overflow-hidden bg-dot-grid cursor-grab active:cursor-grabbing"
      onClick={() => setSelectedNode(null)}
    >
      {/* SVG Connections Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
    
        {connections.map((conn, idx) => {
          const fromNode = nodes.find((n) => n.id === conn.from);
          const toNode = nodes.find((n) => n.id === conn.to);
          if (!fromNode || !toNode) return null;

          const x1 = fromNode.x + 176;
          const y1 = fromNode.y + 40;
          const x2 = toNode.x;
          const y2 = toNode.y + 40;

          const dx = x2 - x1;
          const dy = y2 - y1;

          const path = `M ${x1} ${y1} C ${x1 + 60} ${y1}, ${
            x2 - 60
          } ${y2}, ${x2} ${y2}`;

          return (
            <g key={`${conn.from}-${conn.to}-${idx}`}>
              <path
                d={path}
                stroke={
                  hoveredNode === conn.from || hoveredNode === conn.to
                    ? "#3b82f6"
                    : "#94a3b8"
                }
                strokeWidth={
                  hoveredNode === conn.from || hoveredNode === conn.to
                    ? "2.5"
                    : "1.5"
                }
                fill="none"
                className="transition-all duration-300"
              />
            </g>
          );
        })}
      </svg>

      {/* Nodes Layer */}
      {nodes.map((node) => (
        <motion.div
          key={node.id}
       drag
          dragMomentum={false}
          onDrag={(_, info) => {
            setNodes((prev: Node[]) =>
              prev.map((n) =>
                n.id === node.id
                  ? { ...n, x: n.x + info.delta.x, y: n.y + info.delta.y }
                  : n
              )
            );
          }}
          onMouseEnter={() => setHoveredNode(node.id)} // Track hover state
          onMouseLeave={() => setHoveredNode(null)}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNode(node.id);
            onSelectNode(node.id);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (selectedNode && selectedNode !== node.id) {
              setConnections((prev) => [
                ...prev,
                { from: selectedNode, to: node.id },
              ]);
              setSelectedNode(null); // Optionally clear selection after connecting
            }
          }}
          style={{ x: node.x, y: node.y }}
          className={`absolute w-44 h-20 bg-white border rounded shadow-sm flex flex-col overflow-hidden transition-all group ${
            selectedNode === node.id
              ? "border-violet-500 ring-2 ring-violet-500/20 z-20 shadow-lg scale-[1.02]"
              : "border-gray-200 hover:border-gray-400 z-10 hover:shadow-md"
          }`}
        >
          <div className={`h-1 w-full ${getVariantColor(node.variant)}`} />

          <div className="flex-1 flex items-center gap-3 p-3">
            <div
              className={`p-2 rounded bg-gray-50 border border-gray-100 group-hover:bg-white transition-colors`}
            >
              <node.icon className="w-5 h-5 text-gray-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px]  font-mono font-medium  text-gray-800  leading-none mb-1">
                {node.label}
              </p>
              {node.status && (
                <span className="text-[9px] text-green-600 font-medium uppercase tracking-tighter">
                  Success
                </span>
              )}
            </div>

            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
              <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Connection Ports */}
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-blue-500 hover:scale-125 transition-transform cursor-crosshair z-30" />
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-blue-500 hover:scale-125 transition-transform cursor-crosshair z-30" />
        </motion.div>
      ))}
    </div>
  );
}