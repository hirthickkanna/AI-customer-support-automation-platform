import React from "react";
import { Database } from "lucide-react";

interface KBArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  embeddings: string[];
}

interface KnowledgeBaseViewProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
    email: string;
    mfaEnabled: boolean;
  };
  kbArticles: KBArticle[];
  selectedKbId: string | null;
  setSelectedKbId: (id: string | null) => void;
  newKbTitle: string;
  setNewKbTitle: (val: string) => void;
  newKbContent: string;
  setNewKbContent: (val: string) => void;
  newKbCategory: string;
  setNewKbCategory: (val: string) => void;
  newKbTags: string;
  setNewKbTags: (val: string) => void;
  handleKbCreate: (e: React.FormEvent) => void;
  lastEmbedding: string[];
}

export default function KnowledgeBaseView({
  currentUser,
  kbArticles,
  selectedKbId,
  setSelectedKbId,
  newKbTitle,
  setNewKbTitle,
  newKbContent,
  setNewKbContent,
  newKbCategory,
  setNewKbCategory,
  newKbTags,
  setNewKbTags,
  handleKbCreate,
  lastEmbedding
}: KnowledgeBaseViewProps) {
  return (
    <main className="p-4 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* articles grid list */}
        <div className="glass-card p-4 lg:p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold">Vector Database Documentation index</h2>
            <p className="text-xs text-slate-400">Search guides and articles stored in our pgvector database.</p>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {kbArticles.map(art => (
              <div 
                key={art.id}
                onClick={() => setSelectedKbId(art.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedKbId === art.id 
                    ? "bg-indigo-500/10 border-indigo-500/30" 
                    : "bg-black/35 border-[#ffffff0c] hover:bg-[#ffffff04]"
                }`}
              >
                <div className="flex justify-between text-[10px] font-bold text-cyan-400 mb-1">
                  <span>{art.category.toUpperCase()}</span>
                  <span className="font-mono text-slate-500">{art.id}</span>
                </div>
                <h4 className="text-xs font-bold text-white mb-2">{art.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">{art.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Article viewer detail block */}
        <div className="glass-card p-4 lg:p-6 space-y-4">
          {selectedKbId && kbArticles.find(a => a.id === selectedKbId) ? (
            (() => {
              const art = kbArticles.find(a => a.id === selectedKbId)!;
              return (
                <div className="space-y-4">
                  <div className="border-b border-[#ffffff14] pb-4 flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-bold">{art.category.toUpperCase()}</span>
                      <h2 className="text-base font-bold text-white mt-2">{art.title}</h2>
                    </div>
                    <span className="font-mono text-xs text-slate-500">{art.id}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{art.content}</p>

                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Search Tags</span>
                    <div className="flex gap-2 text-xs">
                      {art.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Vector Embedding Array [pgvector 40-dimensions snapshot]</span>
                    <div className="flex flex-wrap gap-1 p-3 bg-black/40 border border-[#ffffff0c] rounded-lg max-h-[120px] overflow-y-auto">
                      {art.embeddings.map((val, i) => {
                        const colorVal = Math.floor(parseFloat(val) * 255);
                        return (
                          <div 
                            key={i} 
                            className="w-4.5 h-4.5 rounded transition-transform hover:scale-110"
                            style={{ background: `rgba(${colorVal}, 102, 241, 0.8)` }}
                            title={val}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">
              Select an article from the index to view complete guidelines.
            </div>
          )}
        </div>

      </div>

      {/* Admin KB creation Section */}
      {currentUser.role === "admin" && (
        <div className="glass-card p-4 lg:p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold">Admin Documentation Console</h2>
            <p className="text-xs text-slate-400">Publish new guides. Calculating OpenAI vector embeds triggers automatically upon submission.</p>
          </div>

          <form onSubmit={handleKbCreate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Article Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Setting up Webhook endpoints"
                  value={newKbTitle}
                  onChange={(e) => setNewKbTitle(e.target.value)}
                  required
                  className="w-full bg-black/30 border border-[#ffffff14] rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Guideline Content Body</label>
                <textarea 
                  rows={5}
                  placeholder="Write detailed documentation rules here..."
                  value={newKbContent}
                  onChange={(e) => setNewKbContent(e.target.value)}
                  required
                  className="w-full bg-black/30 border border-[#ffffff14] rounded-lg p-4 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Category</label>
                <select 
                  value={newKbCategory}
                  onChange={(e) => setNewKbCategory(e.target.value)}
                  className="w-full bg-black/30 border border-[#ffffff14] rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Security">Security</option>
                  <option value="Workflows">Workflows</option>
                  <option value="Infrastructure">Infrastructure</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Search Tags (comma separated)</label>
                <input 
                  type="text"
                  placeholder="e.g. rate-limit, auth"
                  value={newKbTags}
                  onChange={(e) => setNewKbTags(e.target.value)}
                  required
                  className="w-full bg-black/30 border border-[#ffffff14] rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-heading font-semibold py-2.5 rounded-lg text-xs hover:shadow-lg transition-shadow"
              >
                Publish & Index Embeds
              </button>

              {lastEmbedding.length > 0 && (
                <div className="space-y-2 mt-4">
                  <span className="text-[10px] text-slate-400 font-semibold block">Last Generated Vector Snapshot</span>
                  <div className="flex flex-wrap gap-1 p-2 bg-black/40 border border-[#ffffff0c] rounded-lg h-[40px] overflow-hidden">
                    {lastEmbedding.map((val, i) => (
                      <div 
                        key={i} 
                        className="w-3.5 h-3.5 rounded"
                        style={{ background: `rgba(99, ${Math.floor(parseFloat(val)*255)}, 241, 0.8)` }}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
