"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  MessageSquare, Clock, CheckCircle2, AlertTriangle,
  Send, Search, User, Bot, Headphones,
  BarChart3, TrendingUp, TrendingDown, RefreshCw,
  BookOpen, ChevronRight, ArrowRight, Zap,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

import {
  MOCK_TICKETS, MOCK_CANNED_RESPONSES, MOCK_LIVE_CHATS,
} from "../../../lib/mockData";
import { useDebounce } from "../../../hooks/useDebounce";
import { cn } from "../../../lib/utils";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

import type {
  SupportTicket, TicketPriority, LiveChatSession, CannedResponse,
} from "../../../types/index";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface ChatMessage {
  id:         string;
  sender:     string;
  senderType: "user" | "agent" | "system";
  content:    string;
  time:       string;
}

interface ActiveChat extends LiveChatSession {
  messages: ChatMessage[];
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const PRIORITY_CLASSES: Record<TicketPriority, string> = {
  urgent: "badge-danger",
  high:   "badge-warning",
  medium: "badge-info",
  low:    "badge-neutral",
};

const TICKET_VOLUME_DATA = [
  { day: "Mon", opened: 8,  resolved: 7 },
  { day: "Tue", opened: 12, resolved: 10 },
  { day: "Wed", opened: 6,  resolved: 8 },
  { day: "Thu", opened: 15, resolved: 12 },
  { day: "Fri", opened: 10, resolved: 11 },
  { day: "Sat", opened: 4,  resolved: 5 },
  { day: "Sun", opened: 3,  resolved: 3 },
];

const CATEGORY_DATA = [
  { name: "KYC",       value: 28, color: "#1E40AF" },
  { name: "Payments",  value: 35, color: "#0EA5E9" },
  { name: "Account",   value: 18, color: "#10B981" },
  { name: "Technical", value: 12, color: "#8B5CF6" },
  { name: "General",   value: 7,  color: "#F59E0B" },
];

const RESPONSE_TREND = [
  { week: "W1", avgHours: 2.4 },
  { week: "W2", avgHours: 2.1 },
  { week: "W3", avgHours: 1.9 },
  { week: "W4", avgHours: 1.8 },
  { week: "W5", avgHours: 1.6 },
];

const FAQ_PERFORMANCE = [
  { article: "How to complete KYC verification",   views: 1240, helpful: 91, deflected: true },
  { article: "Withdrawal processing times",         views: 890,  helpful: 78, deflected: true },
  { article: "How to add a co-account holder",      views: 654,  helpful: 85, deflected: true },
  { article: "M-Pesa deposit not reflecting",       views: 520,  helpful: 64, deflected: false },
  { article: "Trading fees and commissions",        views: 410,  helpful: 89, deflected: true },
  { article: "How to reset my PIN",                 views: 380,  helpful: 95, deflected: true },
  { article: "Understanding portfolio P&L",         views: 290,  helpful: 82, deflected: true },
  { article: "Account suspension appeal process",   views: 245,  helpful: 71, deflected: false },
];

const TOOLTIP_STYLE: React.CSSProperties = {
  fontSize: 12, borderRadius: 8,
  border: "1px solid #E2E8F0",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
};

/* Initial chat messages per session */
function buildInitialMessages(session: LiveChatSession): ChatMessage[] {
  return [
    {
      id:         "sys-1",
      sender:     "System",
      senderType: "system",
      content:    `Chat started with ${session.userName} regarding: ${session.topic}`,
      time:       session.waitingTime === "0 min" ? "Just now" : `${session.waitingTime} ago`,
    },
    {
      id:         "usr-1",
      sender:     session.userName,
      senderType: "user",
      content:    `Hi, I need help with ${session.topic.toLowerCase()}.`,
      time:       "Just now",
    },
  ];
}

/* ─────────────────────────────────────────────────────────────
   OVERVIEW TAB
───────────────────────────────────────────────────────────── */
function OverviewTab() {
  const openTickets       = MOCK_TICKETS.filter((t) => t.status === "open").length;
  const inProgressTickets = MOCK_TICKETS.filter((t) => t.status === "in-progress").length;
  const resolvedToday     = 22;
  const escalated         = MOCK_TICKETS.filter((t) => t.priority === "urgent").length;

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Open Tickets",    value: String(openTickets),    color: "text-amber-700 dark:text-amber-400",    icon: MessageSquare, bg: "bg-amber-50 dark:bg-amber-900/40" },
          { label: "Avg Response",    value: "1.8h",                 color: "text-blue-700 dark:text-blue-400",      icon: Clock,         bg: "bg-blue-50 dark:bg-blue-900/40" },
          { label: "Resolved Today",  value: String(resolvedToday),  color: "text-emerald-700 dark:text-emerald-400",icon: CheckCircle2,  bg: "bg-emerald-50 dark:bg-emerald-900/40" },
          { label: "Escalated",       value: String(escalated),      color: "text-red-700 dark:text-red-400",        icon: AlertTriangle, bg: "bg-red-50 dark:bg-red-900/40" },
        ].map(({ label, value, color, icon: Icon, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
                <p className={cn("text-xl font-bold font-mono mt-0.5", color)}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent tickets table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Recent Tickets
            </CardTitle>
            <Link href="/support/tickets">
              <Button variant="outline" size="sm" className="h-7 text-xs">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                {["Ticket ID", "User", "Subject", "Priority", "Status", "Opened", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_TICKETS.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{t.id}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{t.user}</td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-medium max-w-[200px] truncate">{t.subject}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", PRIORITY_CLASSES[t.priority])}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{t.openedAt}</td>
                  <td className="px-4 py-3">
                    <Link href="/support/tickets">
                      <Button variant="outline" size="sm" className="h-7 text-xs">Open</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LIVE CHAT TAB
───────────────────────────────────────────────────────────── */
function LiveChatTab() {
  const [sessions,       setSessions]       = useState<ActiveChat[]>(
    MOCK_LIVE_CHATS.map((s) => ({ ...s, messages: buildInitialMessages(s) }))
  );
  const [activeSession,  setActiveSession]  = useState<string | null>(
    MOCK_LIVE_CHATS.find((s) => s.status === "active")?.id ?? null
  );
  const [message,        setMessage]        = useState("");
  const [cannedSearch,   setCannedSearch]   = useState("");
  const [showCanned,     setShowCanned]     = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = sessions.find((s) => s.id === activeSession);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages.length]);

  const debouncedSearch = useDebounce(cannedSearch, 200);

  const filteredCanned = useMemo(() =>
    MOCK_CANNED_RESPONSES.filter((cr: CannedResponse) =>
      !debouncedSearch ||
      cr.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      cr.category.toLowerCase().includes(debouncedSearch.toLowerCase())
    ),
    [debouncedSearch]
  );

  const handleAssign = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => s.id === sessionId
        ? { ...s, status: "active", assignedAgent: "Sarah Kimani" }
        : s)
    );
    setActiveSession(sessionId);
    toast.success("Chat assigned to you");
  };

  const handleSend = () => {
    if (!message.trim() || !activeSession) return;
    const newMsg: ChatMessage = {
      id:         `msg-${Date.now()}`,
      sender:     "Sarah Kimani",
      senderType: "agent",
      content:    message.trim(),
      time:       "Just now",
    };
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession
          ? { ...s, messages: [...s.messages, newMsg] }
          : s
      )
    );
    setMessage("");
  };

  const insertCanned = (content: string) => {
    setMessage(content);
    setShowCanned(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const statusDot: Record<LiveChatSession["status"], string> = {
    waiting:  "bg-amber-500",
    active:   "bg-emerald-500",
    resolved: "bg-slate-400",
  };

  return (
    <div className="flex gap-4 h-[620px]">

      {/* ── LEFT: Chat queue ── */}
      <div className="w-64 shrink-0 flex flex-col gap-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1">
          Queue ({sessions.filter((s) => s.status === "waiting").length} waiting)
        </p>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => session.status === "active" && setActiveSession(session.id)}
              className={cn(
                "w-full text-left p-3 rounded-xl border transition-all",
                activeSession === session.id
                  ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {session.userName}
                </span>
                <span className={cn("w-2 h-2 rounded-full shrink-0", statusDot[session.status])} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{session.topic}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                  session.status === "waiting"
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                    : session.status === "active"
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                )}>
                  {session.status}
                </span>
                {session.status === "waiting" && (
                  <span className="text-[10px] text-slate-400 font-mono">{session.waitingTime}</span>
                )}
              </div>
              {session.status === "waiting" && (
                <Button
                  size="sm"
                  className="w-full h-6 text-[10px] mt-2 bg-blue-700 hover:bg-blue-800"
                  onClick={(e) => { e.stopPropagation(); handleAssign(session.id); }}
                >
                  Accept Chat
                </Button>
              )}
              {session.assignedAgent && (
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  Agent: {session.assignedAgent}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CENTRE: Chat window ── */}
      <div className="flex-1 flex flex-col min-w-0 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        {activeChat ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {activeChat.userName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{activeChat.userName}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{activeChat.topic}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  onClick={() => {
                    setSessions((prev) => prev.map((s) => s.id === activeChat.id ? { ...s, status: "resolved" } : s));
                    setActiveSession(null);
                    toast.success("Chat resolved");
                  }}
                >
                  <CheckCircle2 className="w-3 h-3" /> Resolve
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeChat.messages.map((msg) => (
                <div key={msg.id}>
                  {msg.senderType === "system" ? (
                    <div className="flex items-center justify-center">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {msg.content}
                      </span>
                    </div>
                  ) : (
                    <div className={cn("flex gap-2", msg.senderType === "agent" && "flex-row-reverse")}>
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5",
                        msg.senderType === "agent" ? "bg-blue-600" : "bg-slate-400"
                      )}>
                        {msg.senderType === "agent" ? "A" : msg.sender.charAt(0)}
                      </div>
                      <div className={cn("max-w-[72%]", msg.senderType === "agent" && "items-end")}>
                        <p className={cn(
                          "text-[10px] text-slate-400 mb-0.5",
                          msg.senderType === "agent" && "text-right"
                        )}>
                          {msg.sender} · {msg.time}
                        </p>
                        <div className={cn(
                          "px-3 py-2 rounded-xl text-sm leading-relaxed",
                          msg.senderType === "agent"
                            ? "bg-blue-600 text-white rounded-tr-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-700 space-y-2 shrink-0">
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  className="text-sm resize-none flex-1"
                />
                <Button
                  size="icon"
                  className="h-9 w-9 bg-blue-700 hover:bg-blue-800 shrink-0"
                  onClick={handleSend}
                  disabled={!message.trim()}
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
              <button
                onClick={() => setShowCanned(!showCanned)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                {showCanned ? "Hide canned responses" : "Use canned response"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Headphones className="w-10 h-10" />
            <p className="text-sm font-medium">Select an active chat or accept a waiting user</p>
          </div>
        )}
      </div>

      {/* ── RIGHT: Canned responses + user info ── */}
      <div className="w-60 shrink-0 flex flex-col gap-3">
        {/* User info */}
        {activeChat && (
          <Card className="shadow-sm shrink-0">
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Customer</p>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{activeChat.userName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{activeChat.topic}</p>
                <Link href={`/users/${activeChat.userId}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  View Profile <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Canned responses panel */}
        <Card className="shadow-sm flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-2 pb-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Canned Responses
              </CardTitle>
            </div>
            <div className="relative pb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-[60%] w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search…"
                value={cannedSearch}
                onChange={(e) => setCannedSearch(e.target.value)}
                className="pl-7 h-7 text-xs"
              />
            </div>
          </CardHeader>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredCanned.map((cr) => (
              <button
                key={cr.id}
                onClick={() => insertCanned(cr.content)}
                className="w-full text-left p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{cr.title}</p>
                  <span className="text-[9px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 rounded shrink-0 ml-1">{cr.category}</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">{cr.content}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SELF-SERVICE ANALYTICS TAB
───────────────────────────────────────────────────────────── */
function AnalyticsTab() {
  const deflectionRate = Math.round(
    (FAQ_PERFORMANCE.filter((a) => a.deflected).length / FAQ_PERFORMANCE.length) * 100
  );
  const avgHelpful = Math.round(
    FAQ_PERFORMANCE.reduce((s, a) => s + a.helpful, 0) / FAQ_PERFORMANCE.length
  );
  const totalViews = FAQ_PERFORMANCE.reduce((s, a) => s + a.views, 0);

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "KB Article Views",    value: totalViews.toLocaleString(),  color: "text-blue-700 dark:text-blue-400",     icon: BookOpen   },
          { label: "Deflection Rate",     value: `${deflectionRate}%`,          color: "text-emerald-700 dark:text-emerald-400",icon: TrendingUp },
          { label: "Avg Helpfulness",     value: `${avgHelpful}%`,              color: "text-amber-700 dark:text-amber-400",    icon: BarChart3  },
          { label: "Tickets Self-Served", value: "187",                         color: "text-purple-700 dark:text-purple-400",  icon: CheckCircle2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
                <p className={cn("text-xl font-bold font-mono mt-0.5", color)}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ticket volume chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Ticket Volume This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={TICKET_VOLUME_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="opened"   name="Opened"   fill="#EF4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#10B981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Tickets by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                    {CATEGORY_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {CATEGORY_DATA.map(({ name, value, color }) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                      <span className="text-slate-600 dark:text-slate-300">{name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response time trend */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Avg Response Time Trend (5 Weeks)
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingDown className="w-3.5 h-3.5" />
              Improving
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={RESPONSE_TREND} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}h`}
                domain={[1, 3]}
              />
              <Tooltip
                formatter={(value) => {
                  const v = typeof value === "number" ? value : 0;
                  return [`${v}h avg`, "Response Time"];
                }}
                contentStyle={TOOLTIP_STYLE}
              />
              <Line type="monotone" dataKey="avgHours" stroke="#1E40AF" strokeWidth={2.5}
                dot={{ fill: "#1E40AF", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#1E40AF" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* FAQ performance table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
          <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
            Knowledge Base Article Performance
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                {["Article", "Views", "Helpful %", "Deflected"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FAQ_PERFORMANCE.map((article, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium max-w-[320px] truncate">
                    {article.article}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                    {article.views.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            article.helpful >= 80 ? "bg-emerald-500" :
                            article.helpful >= 65 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${article.helpful}%` }}
                        />
                      </div>
                      <span className={cn(
                        "font-mono text-xs font-semibold",
                        article.helpful >= 80 ? "text-emerald-700 dark:text-emerald-400" :
                        article.helpful >= 65 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400"
                      )}>
                        {article.helpful}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      article.deflected
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    )}>
                      {article.deflected ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function SupportPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const waitingCount = MOCK_LIVE_CHATS.filter((s) => s.status === "waiting").length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Customer Support
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Support dashboard with ticket queue and SLA metrics
          </p>
        </div>
        {waitingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-700 dark:text-amber-400 animate-pulse shrink-0">
            <Headphones className="w-3.5 h-3.5" />
            {waitingCount} user{waitingCount > 1 ? "s" : ""} waiting in chat
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          <TabsTrigger value="overview"   className="gap-1.5 text-xs">
            <MessageSquare className="w-3.5 h-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="live-chat"  className="gap-1.5 text-xs">
            <Headphones className="w-3.5 h-3.5" />
            Live Chat
            {waitingCount > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                {waitingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics"  className="gap-1.5 text-xs">
            <BarChart3 className="w-3.5 h-3.5" />
            Self-Service Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"  className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="live-chat" className="mt-4"><LiveChatTab /></TabsContent>
        <TabsContent value="analytics" className="mt-4"><AnalyticsTab /></TabsContent>
      </Tabs>
    </div>
  );
}