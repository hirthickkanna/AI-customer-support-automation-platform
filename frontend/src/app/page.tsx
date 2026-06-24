"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ToastContainer from "@/components/ToastContainer";
import AgentDashboardView from "@/components/AgentDashboardView";
import TicketWorkspaceView from "@/components/TicketWorkspaceView";
import AIChatbotView from "@/components/AIChatbotView";
import KnowledgeBaseView from "@/components/KnowledgeBaseView";
import SentimentLogsView from "@/components/SentimentLogsView";
import WorkflowRulesView from "@/components/WorkflowRulesView";
import PlatformAnalyticsView from "@/components/PlatformAnalyticsView";
import IntegrationsView from "@/components/IntegrationsView";
import MyProfileView from "@/components/MyProfileView";
import SubscriptionView from "@/components/SubscriptionView";
import LoginSignup from "@/components/LoginSignup";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  citation: {
    title: string;
    matchPercent: number;
  } | null;
}

export default function PlatformDashboard() {
  // --- States ---
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    role: string;
    actualRole?: string;
    email: string;
    mfaEnabled: boolean;
  } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [activeTab, setActiveTab] = useState("agent-dashboard");
  const [ticketSearch, setTicketSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>("TKT-1024");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Create state stores mimicking backend for fallback
  const [tickets, setTickets] = useState([
    {
      id: "TKT-1024",
      title: "Unable to access database nodes",
      description: "Getting timeout errors when connecting to the analytics postgres db node in the west region.",
      priority: "HIGH",
      category: "Database",
      status: "Open",
      assignedAgent: "Sarah Connor",
      createdAt: "2 hours ago",
      messages: [
        { sender: "customer", text: "I am getting timeout errors when running analytics queries.", timestamp: "2 hours ago" },
        { sender: "ai", text: "Hi, this could be due to network security groups or high database load. Let me escalate this.", timestamp: "2 hours ago" }
      ],
      notes: "Database cluster is currently running at 92% CPU.",
      slaRemaining: 84
    },
    {
      id: "TKT-1025",
      title: "Billing dispute for extra agent licenses",
      description: "We were billed for 15 seats instead of 12. Please refund the difference.",
      priority: "MEDIUM",
      category: "Billing",
      status: "Pending",
      assignedAgent: "John Doe",
      createdAt: "12 hours ago",
      messages: [
        { sender: "customer", text: "Our monthly bill is showing 15 seats, but we only have 12 active users.", timestamp: "12 hours ago" }
      ],
      notes: "Awaiting invoice adjustment authorization from finance.",
      slaRemaining: 180
    },
    {
      id: "TKT-1026",
      title: "Argon2 password hashing configuration error",
      description: "Getting salt validation error when setting up enterprise SSO with Microsoft.",
      priority: "HIGH",
      category: "Security",
      status: "Escalated",
      assignedAgent: "Alex Mercer",
      createdAt: "30 min ago",
      messages: [
        { sender: "customer", text: "SSO fails with Argon2 salt length exception.", timestamp: "30 min ago" }
      ],
      notes: "Escalated due to high-risk login failures for enterprise clients.",
      slaRemaining: 30
    }
  ]);

  const [kbArticles, setKbArticles] = useState([
    {
      id: "KB-201",
      title: "Configuring Argon2 Hashing Guidelines",
      category: "Security",
      content: "To prevent authentication bypasses and strengthen credential storage, configure Argon2 with standard parameters. Ensure the salt length is at least 16 bytes and memory cost is set to 65536 KB. Output hash verification must run on the authentication service container with rate-limits.",
      tags: ["argon2", "security", "passwords"],
      embeddings: Array.from({length: 40}, () => Math.random().toFixed(4))
    },
    {
      id: "KB-202",
      title: "Handling High Sentiment Anger Escalation",
      category: "Workflows",
      content: "If the customer emotion analyzer flags a message as ANGRY (score > 0.8), immediately route the ticket to the SLA Escalation Queue. The system assigns a Lead agent, sends an automated priority response, and logs details in the sentiment audit service.",
      tags: ["sentiment", "escalation", "agents"],
      embeddings: Array.from({length: 40}, () => Math.random().toFixed(4))
    },
    {
      id: "KB-203",
      title: "API Gateway Rate Limiting Details",
      category: "Infrastructure",
      content: "The platform enforces a strict rate limit of 100 requests per minute per IP address. If this limit is exceeded, the API Gateway returns a 429 Too Many Requests status. Verify CORS origins and JWT validity if client request loops are observed.",
      tags: ["api-gateway", "rate-limit", "infrastructure"],
      embeddings: Array.from({length: 40}, () => Math.random().toFixed(4))
    }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, sender: "bot", text: "Hello! I am the automated customer assistant for VaizAI. You can ask me technical configuration details about SSO connection (Argon2), API throttling parameters, or tickets escalation procedures.", citation: null }
  ]);

  const [sentimentLogs, setSentimentLogs] = useState([
    { timestamp: "11:02:14", text: "Your app is constantly timing out, I need this fixed now!", score: 0.92, status: "Escalated" },
    { timestamp: "10:55:03", text: "Thank you for the quick support, the database access works fine.", score: 0.05, status: "Resolved" }
  ]);

  const [workflows, setWorkflows] = useState([
    { id: "WF-1", name: "Escalate Angry Sentiment", trigger: "Sentiment = Negative", action: "Escalate to Team Lead & Alert Slack", status: "Active" },
    { id: "WF-2", name: "High Priority Alert", trigger: "Priority = HIGH", action: "Set SLA timer to 60m & assign Agent", status: "Active" }
  ]);

  const [workflowNodes, setWorkflowNodes] = useState([
    { id: "node-trigger", type: "trigger", title: "IF: Ticket Created", body: "Detects a new ticket event.", x: 50, y: 150 },
    { id: "node-condition", type: "condition", title: "AND: Sentiment = Negative", body: "Evaluates text scoring models.", x: 280, y: 80 },
    { id: "node-action", type: "action", title: "THEN: Escalate Lead", body: "Reassigns role and alerts lead.", x: 500, y: 180 }
  ]);

  const [selectedKbId, setSelectedKbId] = useState<string | null>("KB-201");
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string; type: string }[]>([]);
  
  // Create references for drag-drop visual canvas
  const canvasRef = useRef<HTMLDivElement>(null);
  const activeDragNode = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Ticket creation states
  const [newTktTitle, setNewTktTitle] = useState("");
  const [newTktDesc, setNewTktDesc] = useState("");
  const [newTktPriority, setNewTktPriority] = useState("MEDIUM");
  const [newTktCategory, setNewTktCategory] = useState("General");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // KB creation states
  const [newKbTitle, setNewKbTitle] = useState("");
  const [newKbCategory, setNewKbCategory] = useState("Security");
  const [newKbContent, setNewKbContent] = useState("");
  const [newKbTags, setNewKbTags] = useState("");
  const [lastEmbedding, setLastEmbedding] = useState<string[]>([]);

  // Profile configuration states
  const [profileName, setProfileName] = useState("Hirthick Kanna");
  const [staffUsers, setStaffUsers] = useState<{ id: number; email: string; full_name: string; role_name: string }[]>([]);

  // Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    plan_type: string;
    quota_exceeded: boolean;
    free_tickets_remaining: number | null;
    tickets_used_today: number;
    days_remaining: number | null;
  } | null>(null);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<{
    total_tickets: number;
    open_tickets: number;
    pending_tickets: number;
    escalated_tickets: number;
    closed_tickets: number;
    priority_breakdown: { low: number; medium: number; high: number };
    weekly_trends: { [key: string]: number };
    infra_health: { cpu_load: number; cache_hit: number; api_latency: number };
  } | null>(null);

  // Channels configuration state
  const [channels, setChannels] = useState<{
    id: number;
    name: string;
    api_key?: string;
    webhook_url?: string;
    config_settings?: any;
    is_enabled: boolean;
  }[]>([]);

  // Channel integration logs state
  const [channelLogs, setChannelLogs] = useState<{
    timestamp: string;
    text: string;
    type: string;
  }[]>([]);


  // --- Functions ---
  // Restore saved session from localStorage on mount (sync - no async fetch to avoid race condition)
  useEffect(() => {
    const savedToken = localStorage.getItem("vaizai_token");
    const savedUser = localStorage.getItem("vaizai_user");
    if (savedToken && savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        setToken(savedToken);
        setCurrentUser(userObj);
        setProfileName(userObj.name || "");
      } catch (e) {
        console.error("Error restoring saved session:", e);
        localStorage.removeItem("vaizai_token");
        localStorage.removeItem("vaizai_user");
      }
    }
    setIsLoaded(true);
  }, []);

  // Fetch tickets from API
  const fetchTickets = async (tkn?: string) => {
    const activeToken = tkn || token;
    if (!activeToken) return;
    try {
      const response = await fetch(`${API_URL}/tickets`, {
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Map backend response fields to frontend component expectations
        const mapped = data.map((t: any) => ({
          id: `TKT-${t.id}`,
          title: t.title,
          description: t.description,
          priority: t.priority,
          category: t.category || "General",
          status: t.status,
          assignedAgent: t.assigned_agent_name || "Unassigned",
          createdAt: new Date(t.created_at).toLocaleDateString(),
          messages: (t.messages || []).map((m: any) => ({
            sender: m.sender_type,
            text: m.message_text,
            timestamp: new Date(m.created_at).toLocaleTimeString(),
            fileAttachmentUrl: m.file_attachment_url || null
          })),
          notes: t.notes || "",
          slaRemaining: t.priority === "HIGH" ? 60 : 120
        }));
        setTickets(mapped);
      } else if (response.status === 401) {
        // Token is expired/invalid — just log it, don't auto-logout (would break fresh logins)
        console.warn("Tickets fetch 401: token may be expired. Please log out and log in again.");
      }
    } catch (err) {
      console.warn("Backend tickets fetch error:", err);
    }
  };

  // Fetch KB Articles from API
  const fetchKbArticles = async () => {
    try {
      const response = await fetch(`${API_URL}/kb/articles`);
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((art: any) => ({
          id: `KB-${art.id}`,
          title: art.title,
          category: art.category,
          content: art.content,
          tags: art.tags || [],
          embeddings: art.embedding || []
        }));
        setKbArticles(mapped);
      }
    } catch (err) {
      console.warn("Backend KB articles fetch error:", err);
    }
  };

  // Fetch subscription status
  const fetchSubscription = async (tkn?: string) => {
    const activeToken = tkn || token;
    if (!activeToken) return;
    try {
      const res = await fetch(`${API_URL}/subscription/status`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptionStatus(data);
      }
    } catch {
      // silent
    }
  };

  const fetchStaffUsers = async (tkn?: string) => {
    const activeToken = tkn || token;
    if (!activeToken) return;
    try {
      const response = await fetch(`${API_URL}/users/staff`, {
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStaffUsers(data);
      }
    } catch (err) {
      console.warn("Error fetching staff users:", err);
    }
  };

  const handleUpdateTicket = async (ticketId: string, updates: { status?: string; priority?: string; assigned_agent_id?: number; notes?: string }) => {
    if (!token) {
      triggerToast("Authentication required", "danger");
      return;
    }
    const numericId = ticketId.replace("TKT-", "");
    try {
      const response = await fetch(`${API_URL}/tickets/${numericId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        triggerToast("Ticket updated successfully", "success");
        fetchTickets();
      } else {
        const errData = await response.json().catch(() => ({}));
        triggerToast(errData.detail || "Failed to update ticket", "danger");
      }
    } catch (err) {
      triggerToast("Error updating ticket", "danger");
    }
  };

  const fetchSentimentLogs = async (tkn?: string) => {
    const activeToken = tkn || token;
    if (!activeToken) return;
    try {
      const response = await fetch(`${API_URL}/sentiment-logs`, {
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((log: any) => ({
          timestamp: new Date(log.created_at).toLocaleTimeString(),
          text: log.raw_text,
          score: log.anger_score,
          status: log.anger_score > 0.75 ? "Escalated" : "Processed"
        }));
        setSentimentLogs(mapped);
      }
    } catch (err) {
      console.warn("Error fetching sentiment logs:", err);
    }
  };

  const fetchAnalytics = async (tkn?: string) => {
    const activeToken = tkn || token;
    if (!activeToken) return;
    try {
      const response = await fetch(`${API_URL}/analytics/stats`, {
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.warn("Error fetching analytics data:", err);
    }
  };

  const fetchChannels = async (tkn?: string) => {
    const activeToken = tkn || token;
    if (!activeToken) return;
    try {
      const response = await fetch(`${API_URL}/channels`, {
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setChannels(data);
      }
    } catch (err) {
      console.warn("Error fetching channels:", err);
    }
  };

  const fetchChannelLogs = async (tkn?: string) => {
    const activeToken = tkn || token;
    if (!activeToken) return;
    try {
      const response = await fetch(`${API_URL}/channels/logs`, {
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setChannelLogs(data);
      }
    } catch (err) {
      console.warn("Error fetching channel logs:", err);
    }
  };

  const handleToggleChannel = async (channelId: number, isEnabled: boolean) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/channels/${channelId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_enabled: isEnabled })
      });
      if (response.ok) {
        triggerToast("Channel configuration updated", "success");
        fetchChannels();
        fetchChannelLogs();
      } else {
        const err = await response.json().catch(() => ({}));
        triggerToast(err.detail || "Failed to update channel", "danger");
      }
    } catch (err) {
      triggerToast("Error updating channel", "danger");
    }
  };

  // Run dynamic fetch on token state updates
  useEffect(() => {
    if (token) {
      fetchTickets();
      fetchKbArticles();
      fetchStaffUsers();
      fetchSubscription();

      // Poll every 5 seconds for tickets database sync
      const interval = setInterval(() => {
        fetchTickets();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Poll active tab-related data every 5 seconds
  useEffect(() => {
    if (!token || !currentUser || currentUser.role === "customer") return;

    // Fetch once immediately when tab changes or loads
    if (activeTab === "sentiment-dashboard" || activeTab === "agent-dashboard") {
      fetchSentimentLogs();
    }
    if (activeTab === "analytics-dashboard") {
      fetchAnalytics();
    }
    if (activeTab === "channel-settings") {
      fetchChannels();
      fetchChannelLogs();
    }

    const interval = setInterval(() => {
      if (activeTab === "sentiment-dashboard" || activeTab === "agent-dashboard") {
        fetchSentimentLogs();
      }
      if (activeTab === "analytics-dashboard") {
        fetchAnalytics();
      }
      if (activeTab === "channel-settings") {
        fetchChannels();
        fetchChannelLogs();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token, activeTab, currentUser?.role]);


  // Load Razorpay SDK dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleLoginSuccess = (newToken: string, user: { name: string; email: string; role: string }) => {
    const userContext = {
      id: `u-${user.role}-${Date.now()}`,
      name: user.name,
      role: user.role,
      actualRole: user.role,
      email: user.email,
      mfaEnabled: true
    };
    setToken(newToken);
    setCurrentUser(userContext);
    setProfileName(user.name);
    localStorage.setItem("vaizai_token", newToken);
    localStorage.setItem("vaizai_user", JSON.stringify(userContext));
    
    // Fetch tickets immediately using the new token explicitly (avoid state closure timing issues)
    fetchTickets(newToken);
    fetchKbArticles();
    fetchStaffUsers(newToken);
    fetchSubscription(newToken);
    
    // Route based on role: admin/agent see agent-dashboard, customers see ticket filing
    if (user.role === "customer") {
      setActiveTab("ticket-management"); // Customers go straight to "File a Ticket"
    } else {
      setActiveTab("agent-dashboard"); // Admins and agents see the full ticket queue
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem("vaizai_token");
    localStorage.removeItem("vaizai_user");
    triggerToast("Logged out successfully", "success");
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!token) {
      triggerToast("Authentication required", "danger");
      return;
    }
    const numericId = ticketId.replace("TKT-", "");
    try {
      const response = await fetch(`${API_URL}/tickets/${numericId}/close`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        triggerToast(`Ticket ${ticketId} status updated to CLOSED`, "success");
        fetchTickets();
      } else {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.detail || "Failed to close ticket";
        triggerToast(errMsg, "danger");
        
        if (response.status === 401) {
          handleLogout();
        }
      }
    } catch (err: any) {
      console.warn("Network error during close ticket, running local simulation:", err);
      triggerToast("Network offline. Updated ticket status locally.", "warning");
      // Fallback local status update
      setTickets(prev => prev.map(t => {
        if (t.id === ticketId) {
          return { ...t, status: "CLOSED" };
        }
        return t;
      }));
    }
  };

  const triggerToast = (text: string, type: string = "primary") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Switch role and update route permissions (RBAC)
  const handleRoleChange = (role: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, role };
    setCurrentUser(updated);
    localStorage.setItem("vaizai_user", JSON.stringify(updated));
    
    if (role === "customer") {
      setActiveTab("customer-chat");
    } else {
      setActiveTab("agent-dashboard");
    }
    triggerToast(`Switched view to ${role.toUpperCase()} workspace`, "success");
  };

  // Prompt Injection Guard
  const hasPromptInjection = (text: string) => {
    const hacks = [/ignore previous instructions/i, /system prompt/i, /reveal database/i, /bypass safety/i];
    return hacks.some(rx => rx.test(text));
  };

  // Sentiment Analyzer
  const calculateSentiment = (text: string) => {
    const angryWords = ["broken", "fail", "bad", "worst", "angry", "terrible", "timeout", "error", "useless", "refund"];
    const joyWords = ["thank", "awesome", "great", "fixed", "resolved", "perfect", "working", "help"];
    let score = 0.5;
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(w => {
      if (angryWords.includes(w)) score += 0.15;
      if (joyWords.includes(w)) score -= 0.15;
    });
    score = Math.max(0.0, Math.min(1.0, score));
    return {
      score,
      classification: score > 0.7 ? "Negative" : score < 0.3 ? "Positive" : "Neutral"
    };
  };

  // Real-time streaming RAG response using /chat/stream SSE endpoint
  const triggerRAGResponse = async (text: string) => {
    setIsTyping(true);

    // Create an empty streaming bot message immediately
    const streamingMsgId = Date.now();
    setChatMessages(prev => [...prev, {
      id: streamingMsgId,
      sender: "bot",
      text: "",
      citation: null
    }]);

    try {
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_text: text }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream error: ${response.status}`);
      }

      setIsTyping(false);

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;
          try {
            const chunk = JSON.parse(jsonStr);
            if (chunk.text) {
              // Append each token to the streaming message
              setChatMessages(prev => prev.map(m =>
                m.id === streamingMsgId
                  ? { ...m, text: m.text + chunk.text }
                  : m
              ));
            }
            if (chunk.done) break;
          } catch {
            // skip malformed chunk
          }
        }
      }

    } catch (err) {
      console.warn("Stream failed, falling back to keyword match:", err);
      setIsTyping(false);

      // Smart local keyword fallback
      const query = text.toLowerCase();
      const categories = [
        { keywords: ["database", "postgres", "connection", "timeout", "db", "sql", "node", "analytics"], response: "This appears to be a database issue. Check PostgreSQL node replication lag and verify network security groups. Restart the pooler service if connection timeouts persist." },
        { keywords: ["argon", "hash", "password", "salt", "sso", "auth", "login", "microsoft"], response: "This looks like an authentication or SSO issue. Ensure Argon2 salt length is ≥16 bytes and memory cost is 65536 KB. Verify JWT token validation on the auth service." },
        { keywords: ["rate", "limit", "429", "throttle", "gateway", "quota", "requests"], response: "You're hitting the API rate limit (100 req/min per IP). Implement exponential backoff in your client and check for request loops in your application code." },
        { keywords: ["billing", "invoice", "seat", "license", "refund", "payment", "subscription"], response: "This is a billing concern. Review your active seat count in the admin panel and compare against the invoice. Submit a finance adjustment request if a discrepancy is found." },
        { keywords: ["slow", "performance", "lag", "latency", "speed", "loading", "delay"], response: "Detected a performance issue. Run a trace to identify bottlenecks. Check server response times, CDN caching, and DB index coverage. Consider horizontal scaling if CPU > 80%." },
        { keywords: ["access", "permission", "role", "locked", "unauthorized", "forbidden", "403"], response: "This is an access/permissions issue. Verify the user's role in the access control panel. Check if the session token is expired or an IP blocklist rule is blocking access." },
      ];

      let bestScore = 0;
      let fallbackResponse = "I couldn't find an exact match. Please provide system logs and environment details so a support agent can investigate further.";
      for (const cat of categories) {
        const score = cat.keywords.filter(kw => query.includes(kw)).length;
        if (score > bestScore) { bestScore = score; fallbackResponse = cat.response; }
      }

      setChatMessages(prev => prev.map(m =>
        m.id === streamingMsgId ? { ...m, text: fallbackResponse } : m
      ));
    }
  };


  // Submit User Chat Message
  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    
    // Add user message to state
    setChatMessages(prev => [...prev, { id: Date.now(), sender: "user", text: msg, citation: null }]);
    setChatInput("");

    // Check Prompt Injection
    if (hasPromptInjection(msg)) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          sender: "bot",
          text: "⚠️ SECURITY GUARDRAIL WARNING: Malicious pattern detected. Interception active.",
          citation: null
        }]);
      }, 800);
      return;
    }

    // Sentiment check
    const sent = calculateSentiment(msg);
    if (sent.score > 0.75) {
      setSentimentLogs(prev => [
        { timestamp: new Date().toLocaleTimeString(), text: msg, score: sent.score, status: "Escalated" },
        ...prev
      ]);
      triggerToast("🔥 Escalation: Angry sentiment triggers Workflow WF-1", "danger");
    }

    // Run AI RAG query
    triggerRAGResponse(msg);
  };

  // Create Ticket Form Handler
  const handleTicketCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTktTitle.trim() || !newTktDesc.trim()) return;

    let fileAttachmentUrl = "";
    if (attachmentFile) {
      try {
        const fileExt = attachmentFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `tickets/${fileName}`;

        // Upload attachment to Supabase Storage bucket
        const { data, error } = await supabase.storage
          .from("ticket-attachments")
          .upload(filePath, attachmentFile);

        if (error) {
          throw error;
        }

        // Retrieve public URL for the uploaded attachment
        const { data: { publicUrl } } = supabase.storage
          .from("ticket-attachments")
          .getPublicUrl(filePath);

        fileAttachmentUrl = publicUrl;
      } catch (uploadErr: any) {
        triggerToast(`Attachment upload failed: ${uploadErr.message}`, "danger");
        return;
      }
    }

    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: newTktTitle,
          description: newTktDesc,
          priority: newTktPriority,
          category: newTktCategory,
          file_attachment_url: fileAttachmentUrl
        })
      });

      if (response.ok) {
        triggerToast("Ticket filed successfully!", "success");
        setNewTktTitle("");
        setNewTktDesc("");
        setAttachmentFile(null);
        fetchTickets(token || "");
        fetchSubscription(token || "");
        // After filing, show agent-dashboard (ticket list) for all roles
        setActiveTab("agent-dashboard");
      } else {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.detail || "Failed to create ticket in backend";
        // Show upgrade banner if quota exceeded (402)
        if (response.status === 402) {
          triggerToast(`⚠️ ${errMsg}`, "warning");
          setActiveTab("subscription");
        } else {
          triggerToast(errMsg, "danger");
        }
        if (response.status === 401) {
          console.warn("Ticket creation returned 401. Token may be expired.");
        }
      }
    } catch (err) {
      console.warn("Backend ticket creation offline, falling back to local simulation:", err);
      // Fallback local logic
      const newTicket = {
        id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        title: newTktTitle,
        description: newTktDesc,
        priority: newTktPriority,
        category: newTktCategory,
        status: "Open",
        assignedAgent: "Unassigned",
        createdAt: "Just now",
        messages: [{ 
          sender: "customer", 
          text: newTktDesc, 
          timestamp: "Just now",
          fileAttachmentUrl: fileAttachmentUrl || null
        }],
        notes: "",
        slaRemaining: newTktPriority === "HIGH" ? 60 : 120
      };

      const sent = calculateSentiment(newTktDesc);
      if (sent.score > 0.75) {
        newTicket.status = "Escalated";
        triggerToast("⚡ Workflow Trigger: Ticket auto-escalated to Team Lead Marcus Wright", "warning");
      }

      setTickets(prev => [newTicket, ...prev]);
      setNewTktTitle("");
      setNewTktDesc("");
      setAttachmentFile(null);
      triggerToast(`Ticket ${newTicket.id} filed locally (simulation)!`, "success");
      setActiveTab("agent-dashboard");
    }
  };

  // Publish KB Article Form Handler
  const handleKbCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbTitle.trim() || !newKbContent.trim()) return;
    
    const embedArray = Array.from({length: 40}, () => Math.random().toFixed(4));
    const newArt = {
      id: `KB-${Math.floor(200 + Math.random() * 800)}`,
      title: newKbTitle,
      category: newKbCategory,
      content: newKbContent,
      tags: newKbTags.split(",").map(t => t.trim()),
      embeddings: embedArray
    };

    setKbArticles(prev => [newArt, ...prev]);
    setLastEmbedding(embedArray);
    setNewKbTitle("");
    setNewKbContent("");
    setNewKbTags("");
    triggerToast(`Published article ${newArt.id} with calculated embeddings`, "success");
  };

  // Dragging nodes handler inside visual workflow engine
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    activeDragNode.current = nodeId;
    const node = workflowNodes.find(n => n.id === nodeId);
    if (node) {
      dragOffset.current = {
        x: e.clientX - node.x,
        y: e.clientY - node.y
      };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!activeDragNode.current) return;
    const nodeId = activeDragNode.current;
    
    setWorkflowNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y
        };
      }
      return node;
    }));
  };

  const handleCanvasMouseUp = () => {
    activeDragNode.current = null;
  };

  const handleAddWorkflowNode = () => {
    const id = `node-${Math.floor(Math.random() * 1000)}`;
    setWorkflowNodes(prev => [...prev, {
      id,
      type: "action",
      title: "THEN: Update status",
      body: "Marks status to validating logic",
      x: 100 + Math.random() * 150,
      y: 100 + Math.random() * 150
    }]);
    triggerToast("Action automation node appended", "info");
  };

  const handleDeleteNode = (nodeId: string) => {
    setWorkflowNodes(prev => prev.filter(n => n.id !== nodeId));
    triggerToast("Node deleted from rules editor", "warning");
  };

  // SLA Timers ticking decrement (mock)
  useEffect(() => {
    const interval = setInterval(() => {
      setTickets(prev => prev.map(t => {
        if (t.status !== "Closed" && t.slaRemaining > 0) {
          return { ...t, slaRemaining: t.slaRemaining - 1 };
        }
        return t;
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#06070c] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase font-sans">
            Loading System Environment...
          </span>
        </div>
      </div>
    );
  }

  if (!token || !currentUser) {
    return (
      <>
        <LoginSignup onLoginSuccess={handleLoginSuccess} triggerToast={triggerToast} />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onLogout={handleLogout}
      />
      
      <div className="flex-grow pl-0 lg:pl-[260px] min-h-screen flex flex-col transition-all duration-300">
        <Header 
          currentUser={currentUser} 
          handleRoleChange={handleRoleChange} 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        
        {activeTab === "agent-dashboard" && (
          <AgentDashboardView
            tickets={tickets}
            selectedTicketId={selectedTicketId}
            setSelectedTicketId={setSelectedTicketId}
            ticketSearch={ticketSearch}
            setTicketSearch={setTicketSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            triggerToast={triggerToast}
            currentUser={currentUser}
            onCloseTicket={handleCloseTicket}
            token={token || ""}
            onRefreshTickets={fetchTickets}
            staffUsers={staffUsers}
            onUpdateTicket={handleUpdateTicket}
          />
        )}
        
        {activeTab === "ticket-management" && (
          <TicketWorkspaceView
            newTktTitle={newTktTitle}
            setNewTktTitle={setNewTktTitle}
            newTktDesc={newTktDesc}
            setNewTktDesc={setNewTktDesc}
            newTktPriority={newTktPriority}
            setNewTktPriority={setNewTktPriority}
            newTktCategory={newTktCategory}
            setNewTktCategory={setNewTktCategory}
            handleTicketCreate={handleTicketCreate}
            attachmentFile={attachmentFile}
            setAttachmentFile={setAttachmentFile}
          />
        )}
        
        {activeTab === "customer-chat" && (
          <AIChatbotView
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            isTyping={isTyping}
            handleChatSend={handleChatSend}
            triggerToast={triggerToast}
            triggerRAGResponse={triggerRAGResponse}
          />
        )}
        
        {activeTab === "kb-dashboard" && (
          <KnowledgeBaseView
            currentUser={currentUser}
            kbArticles={kbArticles}
            selectedKbId={selectedKbId}
            setSelectedKbId={setSelectedKbId}
            newKbTitle={newKbTitle}
            setNewKbTitle={setNewKbTitle}
            newKbContent={newKbContent}
            setNewKbContent={setNewKbContent}
            newKbCategory={newKbCategory}
            setNewKbCategory={setNewKbCategory}
            newKbTags={newKbTags}
            setNewKbTags={setNewKbTags}
            handleKbCreate={handleKbCreate}
            lastEmbedding={lastEmbedding}
          />
        )}
        
        {activeTab === "sentiment-dashboard" && (
          <SentimentLogsView sentimentLogs={sentimentLogs} />
        )}
        
        {activeTab === "workflow-dashboard" && (
          <WorkflowRulesView
            workflows={workflows}
            workflowNodes={workflowNodes}
            handleAddWorkflowNode={handleAddWorkflowNode}
            handleDeleteNode={handleDeleteNode}
            canvasRef={canvasRef}
            handleNodeMouseDown={handleNodeMouseDown}
            handleCanvasMouseMove={handleCanvasMouseMove}
            handleCanvasMouseUp={handleCanvasMouseUp}
          />
        )}
        
        {activeTab === "analytics-dashboard" && (
          <PlatformAnalyticsView analyticsData={analyticsData} />
        )}
        
        {activeTab === "channel-settings" && (
          <IntegrationsView
            channels={channels}
            channelLogs={channelLogs}
            onToggleChannel={handleToggleChannel}
            token={token || ""}
            triggerToast={triggerToast}
          />
        )}
        
        {activeTab === "profile-view" && (
          <MyProfileView
            currentUser={currentUser}
            profileName={profileName}
            setProfileName={setProfileName}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === "subscription" && (
          <SubscriptionView
            token={token || ""}
            triggerToast={triggerToast}
          />
        )}
      </div>
      
      <ToastContainer toasts={toasts} />
    </div>
  );
}
