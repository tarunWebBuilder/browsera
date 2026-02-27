import {
  Globe,
  Database,
  Eraser,
  Settings,
  Link,
  GitBranch,
  Cpu,
  Calendar,
  Code2,
  Table,
  Search,
  Monitor,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    section: "BUILD",
    items: [
      { name: "WEBSCRAPING & RPA", icon: Globe },
      { name: "DATA SOURCES", icon: Database },
      { name: "CLEANING", icon: Eraser },
      { name: "CONTROL", icon: Settings },
      { name: "INTEGRATIONS", icon: Link },
    ],
  },
  {
    section: "ORCHESTRATE",
    items: [
      { name: "PIPELINES", icon: GitBranch },
      { name: "MACHINES (BETA)", icon: Cpu },
      { name: "SCHEDULE", icon: Calendar },
    ],
  },
  {
    section: "VIEW",
    items: [
      { name: "CODE VIEW", icon: Code2 },
      { name: "DATA GRID VIEW", icon: Table },
      { name: "DATABASE VIEW", icon: Database },
      { name: "BROWSER VIEW", icon: Search },
    ],
  },
  {
    section: "ANALYZE",
    items: [
      { name: "MONITORING", icon: Monitor },
      { name: "TEAM COLABORATION", icon: Users },
    ],
  },
]

export function Sidebar() {
  return (
    <div className="w-64 border-r bg-white h-screen flex flex-col overflow-y-auto">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">Forloop.ai</h1>
      </div>
      <div className="flex-1 py-4">
        {navItems.map((group) => (
          <div key={group.section} className="mb-6 px-4">
            <h3 className="text-[10px] font-bold text-muted-foreground tracking-wider mb-2">{group.section}</h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.name}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-1.5 text-xs font-medium rounded hover:bg-muted transition-colors text-foreground/80",
                    item.name === "PIPELINES" && "text-blue-600 bg-blue-50",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
