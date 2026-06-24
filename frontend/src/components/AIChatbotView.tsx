import React from "react";
import {
  Database, Paperclip, Mic, Send
} from "lucide-react";

interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  citation: {
    title: string;
    matchPercent: number;
  } | null;
}

interface AIChatbotViewProps {
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  chatInput: string;
  setChatInput: (val: string) => void;
  isTyping: boolean;
  handleChatSend: () => void;
  triggerToast: (text: string, type?: string) => void;
  triggerRAGResponse: (text: string) => void;
}

export default function AIChatbotView({
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  isTyping,
  handleChatSend,
  triggerToast,
  triggerRAGResponse
}: AIChatbotViewProps) {
  return (
    <main className="p-4 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chat frame */}
        <div className="glass-card p-4 lg:p-6 lg:col-span-2 space-y-4 flex flex-col h-[550px]">
          <div className="flex justify-between items-center border-b border-[#ffffff14] pb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="font-semibold text-sm">Auto-RAG Gemini Assistant</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">TLS 1.3 Secure Connection</span>
          </div>

          {/* Messages Body */}
          <div className="flex-grow overflow-y-auto space-y-4 pr-2 p-2 bg-black/20 rounded-xl border border-[#ffffff0c] flex flex-col">
            {chatMessages.map((m, idx) => {
              const isLastBot = m.sender === "bot" && idx === chatMessages.length - 1;
              const isStreaming = isLastBot && !isTyping && m.text !== undefined;
              return (
                <div 
                  key={m.id} 
                  className={`max-w-[85%] sm:max-w-[75%] space-y-1.5 ${m.sender === "user" ? "self-end" : "self-start"}`}
                >
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    m.sender === "user" 
                      ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none"
                      : "bg-slate-800 border border-[#ffffff12] text-slate-200 rounded-bl-none"
                  }`}>
                    <p>
                      {m.text}
                      {isStreaming && m.text !== "" && (
                        <span className="inline-block w-0.5 h-3 bg-cyan-400 ml-0.5 animate-pulse align-middle" />
                      )}
                    </p>
                    
                    {m.citation && (
                      <div className="mt-3 bg-black/40 border border-cyan-500/25 rounded-lg p-2 space-y-1 text-[10px]">
                        <div className="flex items-center gap-1 text-cyan-400 font-bold">
                          <Database className="w-3 h-3" />
                          <span>Vector Db Match ({m.citation.matchPercent}%)</span>
                        </div>
                        <span className="text-slate-300 block font-semibold">{m.citation.title}</span>
                      </div>
                    )}
                  </div>
                  <span className="block text-[9px] text-slate-500 px-1">{m.sender === "user" ? "Sent" : "RAG Assistant"}</span>
                </div>
              );
            })}

            {isTyping && (
              <div className="self-start max-w-[70%] bg-slate-800 border border-[#ffffff12] p-3 rounded-2xl rounded-bl-none flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
              </div>
            )}
          </div>


          {/* Inputs footer */}
          <div className="flex items-center gap-2 pt-2">
            <button 
              onClick={() => {
                setChatMessages(prev => [...prev, { id: Date.now(), sender: "user", text: "📎 Attached: config_sso_failed.txt", citation: null }]);
                triggerToast("Antivirus Check: CLEAN. Salt configuration exception detected.", "success");
                setTimeout(() => {
                  setChatMessages(prev => [...prev, {
                    id: Date.now(),
                    sender: "bot",
                    text: "File logs confirm Argon2 hashing exception. Update parameters to matching schemas in KB-201.",
                    citation: null
                  }]);
                }, 1000);
              }}
              className="w-10 h-10 rounded-lg bg-[#ffffff08] hover:bg-[#ffffff10] border border-[#ffffff14] flex items-center justify-center text-slate-400 hover:text-white transition-colors focus:outline-none"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                setChatMessages(prev => [...prev, { id: Date.now(), sender: "user", text: "🎙️ (Voice Message)", citation: null }]);
                triggerToast("Speech-to-Text translation processing successful.", "success");
                setTimeout(() => {
                  setChatMessages(prev => [...prev, {
                    id: Date.now(),
                    sender: "bot",
                    text: "Received voice note query: 'tell me about rate limiting'. Searching vector index for gateway parameters...",
                    citation: null
                  }]);
                  triggerRAGResponse("rate limiting");
                }, 1200);
              }}
              className="w-10 h-10 rounded-lg bg-[#ffffff08] hover:bg-[#ffffff10] border border-[#ffffff14] flex items-center justify-center text-slate-400 hover:text-white transition-colors focus:outline-none"
            >
              <Mic className="w-4 h-4" />
            </button>
            <input
              type="text"
              placeholder="Ask anything — powered by Gemini AI (e.g. 'why is my DB timing out?')..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
              className="flex-grow bg-black/40 border border-[#ffffff14] rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleChatSend}
              className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security Shield details */}
        <div className="glass-card p-4 lg:p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold">AI Safety Guardrails</h3>
            <p className="text-xs text-slate-400">Our middleware monitors queries before passing to LLM nodes to protect against database injections and data leakage.</p>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-black/35 p-3 rounded-lg border border-[#ffffff06]">
                <span className="text-xs font-medium">Prompt Injection Protection</span>
                <span className="text-xs text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center bg-black/35 p-3 rounded-lg border border-[#ffffff06]">
                <span className="text-xs font-medium">PII Exposure Mitigation</span>
                <span className="text-xs text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center bg-black/35 p-3 rounded-lg border border-[#ffffff06]">
                <span className="text-xs font-medium">Upload File Antivirus Scanning</span>
                <span className="text-xs text-emerald-400 font-bold">ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold">Recent Session History</h3>
            <div className="bg-[#ffffff05] border border-[#ffffff0c] rounded-lg p-3 text-xs space-y-1.5 cursor-pointer">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span>MFA installation guide</span>
                <span className="opacity-60">Today, 11:00</span>
              </div>
              <p className="text-slate-400 text-[11px] truncate">"Help me set up multi-factor OTP tokens on Microsoft auth app"</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
