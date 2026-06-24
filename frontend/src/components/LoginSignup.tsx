"use client";

import React, { useState } from "react";
import { Cpu, Mail, Lock, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LoginSignupProps {
  onLoginSuccess: (token: string, user: { name: string; email: string; role: string }) => void;
  triggerToast: (text: string, type?: string) => void;
}

export default function LoginSignup({ onLoginSuccess, triggerToast }: LoginSignupProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  // Always customer — only admin is seeded in the DB with admin role
  const roleName = "customer";
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      triggerToast("Email and password are required", "danger");
      return;
    }
    if (!isLogin && !fullName.trim()) {
      triggerToast("Full name is required for registration", "danger");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Always use backend /auth/login as the source of truth for role.
        // Supabase may have its own session, but the role MUST come from our DB.
        const loginRes = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (loginRes.ok) {
          // Backend login succeeded → use backend token and role
          const loginData = await loginRes.json();
          const token = loginData.access_token;
          const role = loginData.role; // Authoritative role from DB

          // Fetch full profile (name etc.) from /auth/me
          const profileRes = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const profile = profileRes.ok ? await profileRes.json() : null;

          const fullName = profile?.full_name || email.split("@")[0];

          triggerToast(`Welcome back, ${fullName}!`, "success");
          onLoginSuccess(token, { name: fullName, email, role });

        } else {
          // Backend login failed — try Supabase as fallback (for Supabase-only accounts)
          try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error || !data.session) throw error || new Error("No session");

            const supaToken = data.session.access_token;

            // Update/sync password to backend database in case it was a placeholder
            try {
              await fetch(`${API_URL}/auth/update-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
              });
            } catch (syncErr) {
              console.warn("Failed to synchronize password on login fallback:", syncErr);
            }

            const profileRes = await fetch(`${API_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${supaToken}` },
            });

            if (!profileRes.ok) {
              throw new Error("Could not verify account with backend");
            }

            const fetchedProfile = await profileRes.json();
            triggerToast(`Welcome back, ${fetchedProfile.full_name}!`, "success");
            onLoginSuccess(supaToken, {
              name: fetchedProfile.full_name,
              email: fetchedProfile.email,
              role: fetchedProfile.role,
            });
          } catch (supaErr: any) {
            const errData = await loginRes.json().catch(() => ({}));
            throw new Error(errData.detail || "Authentication failed. Check your credentials.");
          }
        }
      } else {
        // Sign up via Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: roleName,
            },
          },
        });

        if (error) {
          throw error;
        }

        // Also register in backend database so database record is initialized
        try {
          const syncResponse = await fetch(`${API_URL}/auth/signup`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password: password,
              full_name: fullName,
              role_name: roleName,
            }),
          });
          
          if (!syncResponse.ok) {
            const errData = await syncResponse.json().catch(() => ({}));
            console.warn("Backend user registration sync status:", errData.detail);
          }
        } catch (syncErr) {
          console.warn("Failed to synchronize user registration with backend database:", syncErr);
        }

        triggerToast("Account registered successfully! Please check your email or log in.", "success");
        setIsLogin(true);
      }
    } catch (error: any) {
      triggerToast(error.message || "An unexpected error occurred", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#06070c] relative overflow-hidden px-4">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-[440px] glass-card p-6 lg:p-8 space-y-6 relative z-10 border border-[#ffffff0a] shadow-2xl rounded-2xl bg-[#0d0f17]/90 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/10">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl lg:text-2xl font-heading font-extrabold tracking-tight text-white">
              {isLogin ? "Welcome to VaizAI" : "Create Enterprise Account"}
            </h2>
            <p className="text-xs text-slate-400">
              {isLogin 
                ? "Enter your credentials to access the AI Customer Support Platform" 
                : "Register credentials to route support tickets and vector databases"
              }
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex p-1 bg-black/40 border border-[#ffffff08] rounded-xl">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setEmail("");
              setPassword("");
              setFullName("");
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isLogin 
                ? "bg-indigo-500/20 text-white border border-indigo-500/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setEmail("");
              setPassword("");
              setFullName("");
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isLogin 
                ? "bg-indigo-500/20 text-white border border-indigo-500/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Register
          </button>
        </div>

        {/* Form container */}
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black/30 border border-[#ffffff10] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/30 border border-[#ffffff10] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/30 border border-[#ffffff10] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Role is always Customer for new registrations */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-heading font-semibold py-2.5 rounded-xl text-xs hover:shadow-xl hover:shadow-indigo-500/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              "Sign In to Platform"
            ) : (
              "Register Account"
            )}
          </button>
        </form>

        {/* Demo Credentials Alert Helper */}
        {isLogin && (
          <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1">
            <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              Demo Credentials
            </span>
            <div className="text-[10px] text-slate-400 leading-normal space-y-1">
              <div>
                <span className="font-semibold text-slate-300">Admin:</span> admin@vaizai.com / admin123
              </div>
              <div>
                <span className="font-semibold text-slate-300">Team Lead:</span> lead@vaizai.com / lead123
              </div>
              <div>
                <span className="font-semibold text-slate-300">Agent:</span> agent@vaizai.com / agent123
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
