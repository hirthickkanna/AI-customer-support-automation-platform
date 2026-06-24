import React from "react";

interface MyProfileViewProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
    email: string;
    mfaEnabled: boolean;
  };
  profileName: string;
  setProfileName: (val: string) => void;
  triggerToast: (text: string, type?: string) => void;
}

export default function MyProfileView({
  currentUser,
  profileName,
  setProfileName,
  triggerToast
}: MyProfileViewProps) {
  return (
    <main className="p-4 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="glass-card p-4 lg:p-6 lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-bold">Profile & Encryption parameters</h2>
            <p className="text-xs text-slate-400">Manage display info, hashing mechanisms, and multi-factor codes.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 block">Display Name</label>
              <input 
                type="text" 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-black/30 border border-[#ffffff14] rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 block">Account Email</label>
              <input 
                type="text" 
                value={currentUser.email} 
                disabled
                className="w-full bg-black/20 border border-[#ffffff0c] rounded-lg px-4 py-2.5 text-xs text-slate-500 focus:outline-none"
              />
            </div>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/25 rounded-xl flex items-center justify-between">
              <div className="space-y-1 max-w-[70%]">
                <span className="block text-xs font-bold text-white">Dual-factor OTP Token authentication</span>
                <span className="block text-[10px] text-slate-400">Secures password logins alongside Argon2 key derivation functions.</span>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold">Enabled</span>
            </div>

            <button 
              onClick={() => triggerToast("Changes successfully saved", "success")}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-heading font-semibold px-6 py-2 rounded-lg text-xs hover:shadow-lg transition-shadow"
            >
              Save profile configuration
            </button>
          </div>
        </div>

        <div className="glass-card p-4 lg:p-6 space-y-4">
          <h3 className="text-sm font-bold">Access Audit Log</h3>
          <div className="space-y-3">
            <div className="p-3 bg-black/30 rounded-lg border border-[#ffffff0c] text-[11px] space-y-1">
              <div className="flex justify-between font-bold text-slate-300">
                <span>OAuth SSO Verification</span>
                <span className="text-slate-500">Today, 11:00</span>
              </div>
              <p className="text-slate-400">Authenticated via Google security context. Session token generated.</p>
            </div>
            <div className="p-3 bg-black/30 rounded-lg border border-[#ffffff0c] text-[11px] space-y-1">
              <div className="flex justify-between font-bold text-slate-300">
                <span>Argon2 Key Update</span>
                <span className="text-slate-500">June 18, 2026</span>
              </div>
              <p className="text-slate-400">Security parameters successfully validated on auth service node.</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
