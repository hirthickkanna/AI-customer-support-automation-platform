import React from "react";
import { ShieldCheck, Menu } from "lucide-react";

interface HeaderProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
    email: string;
    mfaEnabled: boolean;
    actualRole?: string;
  };
  handleRoleChange: (role: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function Header({
  currentUser,
  handleRoleChange,
  isSidebarOpen,
  setIsSidebarOpen
}: HeaderProps) {
  return (
    <header className="h-[70px] bg-[#0a0b1280] backdrop-blur-[16px] border-b border-[#ffffff14] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-90">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#ffffff0c] transition-colors focus:outline-none"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base lg:text-xl font-heading font-bold tracking-tight">Customer Support Console</h1>
      </div>
      
      <div className="flex items-center gap-4 lg:gap-6">
        <div className={`hidden sm:flex px-3 py-1 rounded-full text-xs font-semibold items-center gap-1.5 border capitalize ${
          currentUser.role === "admin" ? "bg-purple-500/10 border-purple-500/25 text-purple-400" :
          currentUser.role === "agent" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" :
          "bg-cyan-500/10 border-cyan-500/25 text-cyan-400"
        }`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{currentUser.role} view</span>
        </div>
        
        {currentUser.actualRole !== "customer" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden md:inline">View As Role:</span>
            <select
              value={currentUser.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="bg-black/50 border border-[#ffffff14] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="admin">Admin</option>
              <option value="lead">Team Lead</option>
              <option value="agent">Agent</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        )}
      </div>
    </header>
  );
}
