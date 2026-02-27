"use client"

import { Play, Flag, ChevronDown } from "lucide-react"

const menuItems = [
  { name: "New Pipeline", icon: Play },
  { name: "Finish Pipeline", icon: Flag, active: true },
  { name: "Add New Variable", icon: null },
  { name: "Convert Variable Type", icon: null },
  { name: "Math Modify Variable", icon: null },
  { name: "String Modify Variable", icon: null },
  { name: "List Modify Variable", icon: null },
  { name: "Dictionary Modify Variable", icon: null },
  { name: "If Condition", icon: null },
  { name: "Print Variable", icon: null },
  { name: "Load Python Script", icon: null },
  { name: "Load Jupyter Script", icon: null },
  { name: "Define Function", icon: null },
  { name: "Define Lambda Function", icon: null },
  { name: "Run Function", icon: null },
]

export function Canvas() {
  return (
    <div className="flex-1 bg-grid bg-white relative overflow-hidden">
      {/* Tab bar */}
      <div className="bg-slate-100 border-b px-2 py-1 flex items-center gap-2">
        <div className="bg-white px-3 py-1 text-xs border border-b-0 flex items-center gap-2 rounded-t">
          untitled1.flpl*
          <span className="text-muted-foreground text-[10px]">×</span>
        </div>
      </div>

      <div className="p-8 flex gap-8">
        {/* Floating Menu */}
        <div className="w-56 border bg-white shadow-lg rounded overflow-hidden">
          <div className="bg-slate-200 px-3 py-1.5 text-xs font-medium flex justify-between items-center">
            Menu
            <ChevronDown className="w-3 h-3" />
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {menuItems.map((item, i) => (
              <button
                key={i}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 border-b flex items-center gap-3 transition-colors ${item.active ? "bg-slate-100" : ""}`}
              >
                {item.icon ? (
                  <item.icon className={`w-3.5 h-3.5 ${item.name === "New Pipeline" ? "text-green-600" : ""}`} />
                ) : (
                  <div className="w-3.5" />
                )}
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* Nodes */}
        <div className="flex items-center gap-8 mt-12">
          <div className="bg-white border-l-4 border-l-blue-600 shadow-md p-3 rounded min-w-[120px] flex items-center gap-3 border">
            <div className="w-8 h-8 rounded-full border border-green-600 flex items-center justify-center">
              <Play className="w-4 h-4 text-green-600 fill-current" />
            </div>
            <span className="text-xs font-medium">Start</span>
          </div>

          <div className="w-8 h-px bg-slate-300 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 border-y-4 border-l-4 border-y-transparent border-l-slate-300" />
          </div>

          <div className="bg-white border-l-4 border-l-blue-600 shadow-md p-3 rounded min-w-[120px] flex items-center gap-3 border">
            <div className="w-8 h-8 flex items-center justify-center">
              <Flag className="w-6 h-6 text-slate-700" />
            </div>
            <span className="text-xs font-medium">Finish</span>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="absolute bottom-0 left-0 right-0 h-8 border-t bg-slate-50 flex items-center px-3 justify-between text-[10px] text-muted-foreground font-medium">
        <div className="flex items-center gap-4">
          <span>Status bar</span>
          <div className="w-96 h-5 border bg-white px-2 flex items-center"></div>
        </div>
        <button className="border px-3 h-5 bg-white hover:bg-slate-50">Submit</button>
      </div>
    </div>
  )
}
