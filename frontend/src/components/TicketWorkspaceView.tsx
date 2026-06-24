import React from "react";

interface TicketWorkspaceViewProps {
  newTktTitle: string;
  setNewTktTitle: (val: string) => void;
  newTktDesc: string;
  setNewTktDesc: (val: string) => void;
  newTktPriority: string;
  setNewTktPriority: (val: string) => void;
  newTktCategory: string;
  setNewTktCategory: (val: string) => void;
  handleTicketCreate: (e: React.FormEvent) => void;
  attachmentFile: File | null;
  setAttachmentFile: (val: File | null) => void;
}

export default function TicketWorkspaceView({
  newTktTitle,
  setNewTktTitle,
  newTktDesc,
  setNewTktDesc,
  newTktPriority,
  setNewTktPriority,
  newTktCategory,
  setNewTktCategory,
  handleTicketCreate,
  attachmentFile,
  setAttachmentFile
}: TicketWorkspaceViewProps) {
  return (
    <main className="p-4 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="glass-card p-4 lg:p-6 lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-bold">Submit New Support Case</h2>
            <p className="text-xs text-slate-400">File a support query. Our vector search engine will match similarity embeddings and prompt suggestions.</p>
          </div>

          <form onSubmit={handleTicketCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 block">Subject / Ticket Title</label>
              <input 
                type="text"
                placeholder="Brief summary of the issue"
                value={newTktTitle}
                onChange={(e) => setNewTktTitle(e.target.value)}
                required
                className="w-full bg-black/30 border border-[#ffffff14] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Category</label>
                <select 
                  value={newTktCategory}
                  onChange={(e) => setNewTktCategory(e.target.value)}
                  className="w-full bg-black/30 border border-[#ffffff14] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="General">General Inquiry</option>
                  <option value="Database">Database Connection</option>
                  <option value="Security">SSO & Hashing</option>
                  <option value="Billing">Billing & Licenses</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Urgency / Priority</label>
                <select 
                  value={newTktPriority}
                  onChange={(e) => setNewTktPriority(e.target.value)}
                  className="w-full bg-black/30 border border-[#ffffff14] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="LOW">Low - General Question</option>
                  <option value="MEDIUM">Medium - Normal Operations</option>
                  <option value="HIGH">High - Blocked Node</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 block">Full Description</label>
              <textarea 
                rows={4}
                placeholder="Describe the issue, include environment config parameters and logs..."
                value={newTktDesc}
                onChange={(e) => setNewTktDesc(e.target.value)}
                required
                className="w-full bg-black/30 border border-[#ffffff14] rounded-lg p-4 text-sm text-white focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 block">Attachment File (Automatic Antivirus Scanner Activated)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="file"
                  id="ticket-file-input"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label 
                  htmlFor="ticket-file-input"
                  className="bg-black/30 border border-[#ffffff14] rounded-lg px-4 py-2 text-xs text-slate-300 hover:bg-[#ffffff05] hover:border-indigo-500/50 cursor-pointer transition-colors block font-sans"
                >
                  Choose File
                </label>
                <span className="text-xs text-slate-400 truncate max-w-[200px]">
                  {attachmentFile ? attachmentFile.name : "No file chosen"}
                </span>
                {attachmentFile && (
                  <button 
                    type="button"
                    onClick={() => {
                      setAttachmentFile(null);
                      const inputEl = document.getElementById("ticket-file-input") as HTMLInputElement;
                      if (inputEl) inputEl.value = "";
                    }}
                    className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-heading font-semibold px-6 py-2.5 rounded-lg text-sm hover:shadow-lg transition-shadow"
            >
              File Support Ticket
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-4 lg:p-6 space-y-4">
            <h3 className="text-sm font-bold">Enterprise SLAs</h3>
            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>Standard response matrix applies:</p>
              <ul className="list-disc pl-4 space-y-2 text-slate-400">
                <li><strong>HIGH Priority</strong>: Within 60m response. Direct workflow escalations active.</li>
                <li><strong>MEDIUM Priority</strong>: Within 4h response.</li>
                <li><strong>LOW Priority</strong>: Within 24h response.</li>
              </ul>
              <div className="p-3 bg-[#ffffff05] border border-[#ffffff0c] rounded-lg text-[11px] text-slate-400">
                🔒 All attachments uploaded are scanned and encrypted at rest with AES-256 blocks.
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
