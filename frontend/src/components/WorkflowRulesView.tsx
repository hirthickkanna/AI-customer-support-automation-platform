import React from "react";
import { Plus, Zap, GitBranch, Play, X } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: string;
}

interface WorkflowNode {
  id: string;
  type: string;
  title: string;
  body: string;
  x: number;
  y: number;
}

interface WorkflowRulesViewProps {
  workflows: Workflow[];
  workflowNodes: WorkflowNode[];
  handleAddWorkflowNode: () => void;
  handleDeleteNode: (nodeId: string) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  handleNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  handleCanvasMouseMove: (e: React.MouseEvent) => void;
  handleCanvasMouseUp: () => void;
}

export default function WorkflowRulesView({
  workflows,
  workflowNodes,
  handleAddWorkflowNode,
  handleDeleteNode,
  canvasRef,
  handleNodeMouseDown,
  handleCanvasMouseMove,
  handleCanvasMouseUp
}: WorkflowRulesViewProps) {
  return (
    <main className="p-4 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Builder Canvas */}
        <div className="glass-card p-4 lg:p-6 lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Visual Automation Editor</h2>
              <p className="text-xs text-slate-400">IF-THEN rule paths. Drag nodes on canvas to structure automation pipelines.</p>
            </div>
            <button 
              onClick={handleAddWorkflowNode}
              className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Action Node</span>
            </button>
          </div>

          {/* Scrollable canvas wrapper for narrow viewports */}
          <div className="w-full overflow-x-auto rounded-xl border border-[#ffffff0c]">
            <div 
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              className="h-[480px] min-w-[700px] bg-gradient-to-br from-[#090a0f] to-[#121422] relative overflow-hidden"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "20px 20px"
              }}
            >
              {/* Left Sidebar inside canvas */}
              <div className="absolute top-4 left-4 w-[160px] bg-black/85 border border-[#ffffff0c] p-3 rounded-lg z-10 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Draggable Blocks</span>
                <div className="p-2 bg-slate-800 border border-yellow-500/30 rounded text-[10px] flex items-center gap-1.5 cursor-grab">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span>Trigger Event</span>
                </div>
                <div className="p-2 bg-slate-800 border border-purple-500/30 rounded text-[10px] flex items-center gap-1.5 cursor-grab">
                  <GitBranch className="w-3 h-3 text-purple-400" />
                  <span>Condition logic</span>
                </div>
                <div className="p-2 bg-slate-800 border border-emerald-500/30 rounded text-[10px] flex items-center gap-1.5 cursor-grab">
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span>Action execute</span>
                </div>
              </div>

              {/* Render nodes */}
              {workflowNodes.map(node => (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  className="canvas-node select-none"
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    borderTop: `4px solid ${
                      node.type === "trigger" ? "#f59e0b" :
                      node.type === "condition" ? "#a855f7" : "#10b981"
                    }`
                  }}
                >
                  <div className="flex justify-between items-center p-2.5 border-b border-[#ffffff08] font-bold text-white text-[11px]">
                    <span>{node.title}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(node.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="p-2.5 text-[10px] text-slate-400 leading-snug">{node.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rules List Logs */}
        <div className="space-y-6">
          <div className="glass-card p-4 lg:p-6 space-y-4">
            <h3 className="text-sm font-bold">Automation Logs</h3>
            <div className="font-mono text-[10px] bg-black/40 border border-[#ffffff0c] p-3 rounded-lg space-y-2 text-slate-400 max-h-[220px] overflow-y-auto">
              <div>[11:02:14] WF-1 Executed. Ticket escalated. Success.</div>
              <div>[10:30:11] WF-2 Triggered. Priority validation positive. SLA updated.</div>
              <div className="text-rose-400">[09:12:44] WF-1 Failed. Slack connection timeout. Retrying...</div>
            </div>
          </div>

          <div className="glass-card p-4 lg:p-6 space-y-4">
            <h3 className="text-sm font-bold">Active Engine Rules</h3>
            <div className="space-y-3">
              {workflows.map(flow => (
                <div key={flow.id} className="p-3 bg-black/35 rounded-lg border border-[#ffffff0c] text-xs space-y-1">
                  <div className="flex justify-between font-bold text-white">
                    <span>{flow.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">{flow.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Trigger: {flow.trigger}</p>
                  <p className="text-[10px] text-slate-400">Action: {flow.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
