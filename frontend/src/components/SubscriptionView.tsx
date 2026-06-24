"use client";

import React, { useState, useEffect } from "react";
import {
  Zap, Crown, CheckCircle, AlertTriangle, CreditCard,
  Calendar, TrendingUp, Shield, Ticket, Clock, RefreshCw
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SubscriptionStatus {
  plan_type: string;
  total_free_tickets_used: number;
  tickets_used_today: number;
  subscription_start: string | null;
  subscription_end: string | null;
  days_remaining: number | null;
  is_active: boolean;
  quota_exceeded: boolean;
  daily_limit: number | null;
  free_tickets_remaining: number | null;
}

interface SubscriptionViewProps {
  token: string;
  triggerToast: (text: string, type?: string) => void;
}

const PLANS = [
  {
    id: "basic_daily",
    name: "Basic",
    tagline: "Daily 20 Tickets",
    price: 99,
    period: "/month",
    color: "from-indigo-500 to-blue-500",
    borderColor: "border-indigo-500/30",
    glowColor: "shadow-indigo-500/10",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    features: [
      "20 tickets per day",
      "Daily quota resets at midnight",
      "AI-powered ticket routing",
      "Basic priority support",
      "30-day billing cycle",
    ],
  },
  {
    id: "pro_unlimited",
    name: "Pro",
    tagline: "Unlimited Tickets",
    price: 299,
    period: "/month",
    color: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500/30",
    glowColor: "shadow-purple-500/10",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    popular: true,
    features: [
      "Unlimited tickets",
      "No daily restrictions",
      "Priority AI resolution",
      "Dedicated support queue",
      "30-day billing cycle",
    ],
  },
];

export default function SubscriptionView({ token, triggerToast }: SubscriptionViewProps) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        triggerToast("Failed to load subscription status", "danger");
      }
    } catch {
      triggerToast("Network error loading subscription", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  const handleSubscribe = async (planId: string) => {
    if (payingPlan) return;
    setPayingPlan(planId);

    try {
      // Step 1: Create Razorpay order on backend
      const orderRes = await fetch(`${API_URL}/subscription/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan_type: planId }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to create payment order");
      }

      const order = await orderRes.json();

      // Step 2: Open Razorpay checkout
      const plan = PLANS.find((p) => p.id === planId)!;
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "VaizAI Platform",
        description: `${plan.name} – ${plan.tagline}`,
        order_id: order.order_id,
        handler: async (response: any) => {
          // Step 3: Verify payment on backend
          const verifyRes = await fetch(`${API_URL}/subscription/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_type: planId,
            }),
          });

          if (verifyRes.ok) {
            triggerToast(`🎉 ${plan.name} plan activated for 30 days!`, "success");
            fetchStatus();
          } else {
            const errData = await verifyRes.json().catch(() => ({}));
            triggerToast(errData.detail || "Payment verification failed", "danger");
          }
        },
        prefill: {},
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: () => {
            triggerToast("Payment cancelled", "warning");
            setPayingPlan(null);
          },
        },
      };

      // @ts-ignore — Razorpay loaded via CDN script
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      triggerToast(err.message || "Payment initiation failed", "danger");
    } finally {
      setPayingPlan(null);
    }
  };

  // Quota usage bar
  const getUsageBar = () => {
    if (!status) return null;
    if (status.plan_type === "free") {
      const pct = Math.min(100, (status.total_free_tickets_used / 20) * 100);
      return { used: status.total_free_tickets_used, total: 20, pct, label: "Free tickets used" };
    }
    if (status.plan_type === "basic_daily") {
      const pct = Math.min(100, (status.tickets_used_today / 20) * 100);
      return { used: status.tickets_used_today, total: 20, pct, label: "Tickets used today" };
    }
    return null; // pro unlimited
  };

  const usageBar = getUsageBar();
  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const planLabel: Record<string, string> = {
    free: "Free Trial",
    basic_daily: "Basic",
    pro_unlimited: "Pro",
  };

  return (
    <main className="p-4 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-heading font-bold text-white">Subscription & Billing</h1>
        <p className="text-sm text-slate-400">Manage your plan, track ticket usage, and upgrade anytime.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Current Plan Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-6 space-y-6 border border-[#ffffff14] rounded-2xl bg-[#0d0f17]/80">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Plan</p>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-heading font-bold text-white">
                      {planLabel[status?.plan_type || "free"]}
                    </h2>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        status?.quota_exceeded
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {status?.quota_exceeded ? "QUOTA EXCEEDED" : "ACTIVE"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={fetchStatus}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                  title="Refresh status"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Quota Warning Banner */}
              {status?.quota_exceeded && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-300">Ticket Quota Reached</p>
                    <p className="text-xs text-amber-400/80 mt-0.5">
                      {status.plan_type === "free"
                        ? "You've used all 20 free tickets. Subscribe below to continue."
                        : "Your daily ticket limit has been reached. It resets at midnight, or upgrade to Pro for unlimited access."}
                    </p>
                  </div>
                </div>
              )}

              {/* Usage bar */}
              {usageBar && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">{usageBar.label}</span>
                    <span className="text-white font-bold">
                      {usageBar.used} / {usageBar.total}
                    </span>
                  </div>
                  <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-[#ffffff0a]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        usageBar.pct >= 90
                          ? "bg-gradient-to-r from-rose-500 to-red-500"
                          : usageBar.pct >= 60
                          ? "bg-gradient-to-r from-amber-500 to-orange-500"
                          : "bg-gradient-to-r from-indigo-500 to-purple-500"
                      }`}
                      style={{ width: `${usageBar.pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {usageBar.pct >= 100
                      ? "Limit reached — upgrade to continue"
                      : `${100 - usageBar.pct}% remaining`}
                  </p>
                </div>
              )}

              {status?.plan_type === "pro_unlimited" && (
                <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-300 font-medium">Unlimited tickets — no restrictions</span>
                </div>
              )}

              {/* Subscription period info */}
              {status?.plan_type !== "free" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-black/30 rounded-xl border border-[#ffffff0a] space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold">Starts</span>
                    </div>
                    <p className="text-sm font-bold text-white">{formatDate(status?.subscription_start || null)}</p>
                  </div>
                  <div className="p-4 bg-black/30 rounded-xl border border-[#ffffff0a] space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold">Expires</span>
                    </div>
                    <p className="text-sm font-bold text-white">{formatDate(status?.subscription_end || null)}</p>
                    {status?.days_remaining !== null && status?.days_remaining !== undefined && (
                      <p className="text-[10px] text-slate-400">{status.days_remaining} days remaining</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stats panel */}
            <div className="glass-card p-6 space-y-4 border border-[#ffffff14] rounded-2xl bg-[#0d0f17]/80">
              <h3 className="text-sm font-bold text-white">Usage Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-[#ffffff08]">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-slate-300">Free tickets used</span>
                  </div>
                  <span className="text-xs font-bold text-white">{status?.total_free_tickets_used ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-[#ffffff08]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-300">Tickets today</span>
                  </div>
                  <span className="text-xs font-bold text-white">{status?.tickets_used_today ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-[#ffffff08]">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-slate-300">Plan type</span>
                  </div>
                  <span className="text-xs font-bold text-white capitalize">{status?.plan_type?.replace("_", " ") ?? "free"}</span>
                </div>
                {status?.plan_type === "free" && (
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1">
                    <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Free Remaining</p>
                    <p className="text-lg font-heading font-bold text-white">{status.free_tickets_remaining ?? 0}</p>
                    <p className="text-[10px] text-slate-400">of 20 lifetime free tickets</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-bold text-white">Choose a Plan</h2>
                <p className="text-xs text-slate-400 mt-0.5">Both plans are billed for 30 days from the date of payment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {PLANS.map((plan) => {
                const isCurrentPlan = status?.plan_type === plan.id;
                const isLoading = payingPlan === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`relative glass-card p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${
                      plan.popular
                        ? "border-purple-500/40 bg-purple-500/5 shadow-lg shadow-purple-500/10"
                        : "border-[#ffffff14] bg-[#0d0f17]/60"
                    } ${isCurrentPlan ? "ring-2 ring-indigo-500/40" : ""}`}
                  >
                    {/* Popular badge */}
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    {/* Current plan badge */}
                    {isCurrentPlan && (
                      <div className="absolute top-4 right-4">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          Current Plan
                        </span>
                      </div>
                    )}

                    <div className="space-y-5">
                      {/* Plan header */}
                      <div className="space-y-2">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${plan.badgeColor}`}>
                          {plan.id === "pro_unlimited" ? (
                            <Crown className="w-3.5 h-3.5" />
                          ) : (
                            <Zap className="w-3.5 h-3.5" />
                          )}
                          {plan.name}
                        </div>
                        <h3 className="text-xl font-heading font-bold text-white">{plan.tagline}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-heading font-extrabold text-white">₹{plan.price}</span>
                          <span className="text-sm text-slate-400">{plan.period}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Valid for 30 days from payment date</p>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2.5">
                        {plan.features.map((feat) => (
                          <li key={feat} className="flex items-center gap-2.5">
                            <CheckCircle className={`w-4 h-4 shrink-0 ${plan.id === "pro_unlimited" ? "text-purple-400" : "text-indigo-400"}`} />
                            <span className="text-xs text-slate-300">{feat}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <button
                        id={`subscribe-${plan.id}`}
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={isLoading || !!payingPlan}
                        className={`w-full py-3 rounded-xl text-sm font-heading font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${
                          isCurrentPlan
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90"
                            : `bg-gradient-to-r ${plan.color} text-white hover:shadow-xl hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none`
                        }`}
                      >
                        {isLoading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                        {isLoading ? "Processing..." : isCurrentPlan ? "Renew Plan" : `Subscribe — ₹${plan.price}/mo`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Free plan info */}
          <div className="glass-card p-5 rounded-2xl border border-[#ffffff0a] bg-[#0d0f17]/40">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-700/50 border border-[#ffffff10] flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Free Tier — 20 Lifetime Tickets</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every new account receives 20 free tickets, valid for lifetime. Once exhausted, you need an active subscription to continue filing tickets. Your AI chat assistant is always available regardless of plan.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
