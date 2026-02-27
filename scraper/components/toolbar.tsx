import { Menu, FileText, Folder, Save, Play, Pause, Share2, Code, Layout } from "lucide-react"

export function Toolbar() {
  return (
    <div className="h-12 border-b bg-white flex items-center px-4 justify-between">
      <div className="flex items-center gap-1">
        <button className="p-1.5 hover:bg-muted rounded border bg-slate-50">
          <Menu className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button className="p-1.5 hover:bg-muted rounded">
          <FileText className="w-4 h-4" />
        </button>
        <button className="p-1.5 hover:bg-muted rounded">
          <Folder className="w-4 h-4" />
        </button>
        <button className="p-1.5 hover:bg-muted rounded">
          <Save className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button className="p-1.5 hover:bg-muted rounded text-green-600">
          <Play className="w-4 h-4 fill-current" />
        </button>
        <button className="p-1.5 hover:bg-muted rounded text-orange-600">
          <Pause className="w-4 h-4 fill-current" />
        </button>
        <div className="w-px h-6 bg-border mx-2" />
        <button className="p-1.5 hover:bg-muted rounded">
          <Share2 className="w-4 h-4" />
        </button>
        <button className="p-1.5 hover:bg-muted rounded">
          <Code className="w-4 h-4" />
        </button>
        <button className="p-1.5 hover:bg-muted rounded">
          <Layout className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-xs text-blue-600 font-medium border border-blue-600 px-3 py-1 rounded hover:bg-blue-50">
          UPGRADE
        </button>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Play className="w-4 h-4" />
          <Share2 className="w-4 h-4" />
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            C
          </div>
        </div>
      </div>
    </div>
  )
}
