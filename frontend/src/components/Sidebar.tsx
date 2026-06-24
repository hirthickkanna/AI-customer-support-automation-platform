import {
  Cpu, LayoutDashboard, Ticket, MessageSquareCode, BookOpen, HeartPulse,
  GitBranch, BarChart3, Share2, User, X, LogOut, CreditCard
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: {
    id: string;
    name: string;
    role: string;
    email: string;
    mfaEnabled: boolean;
  };
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  onLogout?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  isSidebarOpen,
  setIsSidebarOpen,
  onLogout
}: SidebarProps) {
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setIsSidebarOpen(false); // Close drawer on mobile after selection
  };

  return (
    <>
      {/* Backdrop overlay for mobile/tablet drawer */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`w-[260px] fixed top-0 bottom-0 left-0 bg-[#0a0b12] border-r border-[#ffffff14] flex flex-col z-[100] transition-transform duration-300 lg:translate-x-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-6 flex items-center justify-between border-b border-[#ffffff14]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="font-heading font-bold text-lg text-white bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">VaizAI Platform</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {["agent", "lead", "admin", "customer"].includes(currentUser.role) && (
            <button
              onClick={() => handleTabClick("agent-dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "agent-dashboard" 
                  ? "bg-indigo-500/15 border border-indigo-500/25 text-white" 
                  : "text-slate-400 hover:text-white hover:bg-[#ffffff0c]"
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span>{currentUser.role === "customer" ? "My Tickets" : "Agent Dashboard"}</span>
            </button>
          )}

          <button
            onClick={() => handleTabClick("ticket-management")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "ticket-management" 
                ? "bg-indigo-500/15 border border-indigo-500/25 text-white" 
                : "text-slate-400 hover:text-white hover:bg-[#ffffff0c]"
            }`}
          >
            <Ticket className="w-4.5 h-4.5" />
            <span>{currentUser.role === "customer" ? "File a Ticket" : "Ticket Workspace"}</span>
          </button>

          <button
            onClick={() => handleTabClick("customer-chat")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "customer-chat" 
                ? "bg-indigo-500/15 border border-indigo-500/25 text-white" 
                : "text-slate-400 hover:text-white hover:bg-[#ffffff0c]"
            }`}
          >
            <MessageSquareCode className="w-4.5 h-4.5" />
            <span>AI Support Chat</span>
          </button>

          <button
            onClick={() => handleTabClick("kb-dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "kb-dashboard" 
                ? "bg-indigo-500/15 border border-indigo-500/25 text-white" 
                : "text-slate-400 hover:text-white hover:bg-[#ffffff0c]"
            }`}
          >
            <BookOpen className="w-4.5 h-4.5" />
            <span>Knowledge Base</span>
          </button>

          {currentUser.role === "customer" && (
            <button
              onClick={() => handleTabClick("subscription")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "subscription"
                  ? "bg-indigo-500/15 border border-indigo-500/25 text-white"
                  : "text-slate-400 hover:text-white hover:bg-[#ffffff0c]"
              }`}
            >
              <CreditCard className="w-4.5 h-4.5" />
              <span>Subscription</span>
            </button>
          )}

          {["lead", "admin"].includes(currentUser.role) && (
            <button
              onClick={() => handleTabClick("sentiment-dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "sentiment-dashboard" 
                  ? "bg-indigo-500/15 border border-indigo-500/25 text-white" 
                  : "text-slate-400 hover:text-white hover:bg-[#ffffff0c]"
              }`}
            >
              <HeartPulse className="w-4.5 h-4.5" />
              <span>Sentiment Logs</span>
            </button>
          )}

          {currentUser.role === "admin" && (
            <button
              onClick={() => handleTabClick("workflow-dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "workflow-dashboard" 
                  ? "bg-indigo-500/15 border border-indigo-500/25 text-white" 
                  : "text-slate-400 hover:text-white hover:bg-[#ffffff0c]"
              }`}
            >
              <GitBranch className="w-4.5 h-4.5" />
              <span>Workflow Rules</span>
            </button>
          )}

          {["lead", "admin"].includes(currentUser.role) && (
            <button
              onClick={() => handleTabClick("analytics-dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "analytics-dashboard" 
                  ? "bg-indigo-500/15 border border-indigo-500/25 text-white" 
                  : "text-slate-400 hover:text-white hover:bg-[#ffffff0c]"
              }`}
            >
              <BarChart3 className="w-4.5 h-4.5" />
              <span>Platform Analytics</span>
            </button>
          )}

          {currentUser.role === "admin" && (
            <button
              onClick={() => handleTabClick("channel-settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "channel-settings" 
                  ? "bg-indigo-500/15 border border-indigo-500/25 text-white" 
                  : "text-slate-400 hover:text-white hover:bg-[#ffffff0c]"
              }`}
            >
              <Share2 className="w-4.5 h-4.5" />
              <span>Integrations</span>
            </button>
          )}

          <div className="pt-4 border-t border-[#ffffff14] mt-4">
            <button
              onClick={() => handleTabClick("profile-view")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "profile-view" 
                  ? "bg-indigo-500/15 border border-indigo-500/25 text-white" 
                  : "text-slate-400 hover:text-white hover:bg-[#ffffff0c]"
              }`}
            >
              <User className="w-4.5 h-4.5" />
              <span>My Profile</span>
            </button>
          </div>
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-[#ffffff14] bg-[#00000026] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#ffffff0c] border border-[#ffffff14] flex items-center justify-center font-semibold text-indigo-400 text-sm shrink-0">
              {currentUser.name.split(" ").map(w => w[0]).join("")}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-white truncate">{currentUser.name}</div>
              <div className="text-xs text-slate-400 capitalize font-sans">{currentUser.role}</div>
            </div>
          </div>
          {onLogout && (
            <button 
              onClick={onLogout}
              title="Log Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-[#ffffff0c] rounded-lg transition-colors focus:outline-none"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
