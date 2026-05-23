"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search, Download, Clock, CheckCircle2, AlertTriangle,
  MessageSquare, User, Filter, UserPlus, XCircle, Eye,
  RefreshCw, ChevronDown,
} from "lucide-react";

import { MOCK_TICKETS } from "../../../../lib/mockData";
import { useDebounce } from "../../../../hooks/useDebounce";
import { usePagination } from "../../../../hooks/usePagination";
import { cn } from "../../../../lib/utils";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { Label } from "../../../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogBody, DialogFooter,
} from "../../../../components/ui/dialog";

import type {
  SupportTicket, TicketPriority, TicketStatus, TicketCategory,
} from "../../../../types/index";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type StatusFilter   = "all" | TicketStatus;
type PriorityFilter = "all" | TicketPriority;
type CategoryFilter = "all" | TicketCategory;

interface LocalTicket extends SupportTicket {
  internalNote?: string;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const PAGE_SIZE = 10;

const PRIORITY_CLASSES: Record<TicketPriority, string> = {
  urgent: "badge-danger",
  high:   "badge-warning",
  medium: "badge-info",
  low:    "badge-neutral",
};

const SLA_CLASSES: Record<string, string> = {
  OVERDUE:  "text-red-700 dark:text-red-400 font-bold",
  Resolved: "text-emerald-600 dark:text-emerald-400",
};

const AGENTS = ["Unassigned", "John Doe", "Jane Smith", "Alice Njoroge", "Tech Team", "Sarah Kimani"];

/* ─────────────────────────────────────────────────────────────
   SLA INDICATOR
───────────────────────────────────────────────────────────── */
function SLAIndicator({ sla }: { sla: string }) {
  const isOverdue  = sla === "OVERDUE";
  const isResolved = sla === "Resolved";

  return (
    <div className="flex items-center gap-1.5">
      {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 animate-pulse" />}
      {!isOverdue && !isResolved && <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
      {isResolved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
      <span className={cn(
        "text-xs font-mono",
        SLA_CLASSES[sla] ?? "text-slate-600 dark:text-slate-400"
      )}>
        {sla}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TICKET DETAIL MODAL
───────────────────────────────────────────────────────────── */
function TicketDetailModal({
  ticket,
  onClose,
  onAssign,
  onResolve,
  onClose_ticket,
}: {
  ticket:        LocalTicket;
  onClose:       () => void;
  onAssign:      (id: string, agent: string) => void;
  onResolve:     (id: string, note: string) => void;
  onClose_ticket:(id: string) => void;
}) {
  const [selectedAgent, setSelectedAgent] = useState(ticket.agent ?? "Unassigned");
  const [resolutionNote, setResolutionNote] = useState("");
  const [activePanel, setActivePanel] = useState<"details" | "resolve">("details");

  /* Mock conversation thread */
  const thread = [
    {
      senderType: "user"  as const,
      sender:     ticket.user,
      content:    `Hi, I'm experiencing an issue with ${ticket.subject.toLowerCase()}. Could you please help me resolve this?`,
      time:       ticket.openedAt,
    },
    {
      senderType: "agent" as const,
      sender:     ticket.agent !== "Unassigned" ? ticket.agent : "Support Team",
      content:    `Hello ${ticket.user.split(" ")[0]}, thank you for reaching out. I can see your issue and will look into it right away.`,
      time:       ticket.openedAt,
    },
    ...(ticket.status === "in-progress" ? [{
      senderType: "agent" as const,
      sender:     ticket.agent,
      content:    "We are currently investigating this issue. We will update you shortly.",
      time:       ticket.sla,
    }] : []),
    ...(ticket.status === "resolved" ? [{
      senderType: "agent" as const,
      sender:     ticket.agent,
      content:    "Your issue has been resolved. Please let us know if you need any further assistance.",
      time:       "Resolved",
    }] : []),
  ];

  const handleAssignSubmit = () => {
    onAssign(ticket.id, selectedAgent);
    toast.success(`Ticket ${ticket.id} assigned to ${selectedAgent}`);
  };

  const handleResolveSubmit = () => {
    if (!resolutionNote.trim()) {
      toast.error("Please provide resolution notes");
      return;
    }
    onResolve(ticket.id, resolutionNote);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="font-mono">{ticket.id}</span>
            <StatusBadge status={ticket.status} size="sm" />
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", PRIORITY_CLASSES[ticket.priority])}>
              {ticket.priority}
            </span>
          </DialogTitle>
          <DialogDescription className="text-left">
            {ticket.subject}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Ticket meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {[
              { label: "User",     value: ticket.user },
              { label: "Category", value: ticket.category },
              { label: "Priority", value: ticket.priority },
              { label: "Agent",    value: ticket.agent },
              { label: "Opened",   value: ticket.openedAt },
              { label: "SLA",      value: ticket.sla },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-0.5 capitalize">{value}</p>
              </div>
            ))}
          </div>

          {/* Panel tabs */}
          <div className="flex gap-1 border-b border-slate-100 dark:border-slate-700">
            {(["details", "resolve"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setActivePanel(p)}
                className={cn(
                  "px-3 py-2 text-xs font-semibold capitalize border-b-2 -mb-px transition-colors",
                  activePanel === p
                    ? "text-blue-700 dark:text-blue-400 border-blue-600"
                    : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700"
                )}
              >
                {p === "details" ? "Conversation Thread" : "Assign & Resolve"}
              </button>
            ))}
          </div>

          {/* Details — conversation thread */}
          {activePanel === "details" && (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {thread.map((msg, i) => (
                <div key={i} className={cn("flex gap-2.5", msg.senderType === "agent" && "flex-row-reverse")}>
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5",
                    msg.senderType === "agent" ? "bg-blue-600" : "bg-slate-400 dark:bg-slate-600"
                  )}>
                    {msg.sender.charAt(0)}
                  </div>
                  <div className={cn("max-w-[75%]", msg.senderType === "agent" && "items-end")}>
                    <p className={cn("text-[10px] text-slate-400 mb-0.5", msg.senderType === "agent" && "text-right")}>
                      {msg.sender} · {msg.time}
                    </p>
                    <div className={cn(
                      "px-3 py-2.5 rounded-xl text-sm leading-relaxed",
                      msg.senderType === "agent"
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resolve panel */}
          {activePanel === "resolve" && (
            <div className="space-y-4">
              {/* Assign agent */}
              <div className="space-y-1.5">
                <Label htmlFor="assign-agent">Assign To Agent</Label>
                <div className="flex gap-2">
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger id="assign-agent" className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENTS.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 shrink-0"
                    onClick={handleAssignSubmit}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign
                  </Button>
                </div>
              </div>

              {/* Resolution notes */}
              {ticket.status !== "resolved" && ticket.status !== "closed" && (
                <div className="space-y-1.5">
                  <Label htmlFor="resolution-note">Resolution Notes *</Label>
                  <Textarea
                    id="resolution-note"
                    placeholder="Describe how the issue was resolved and any actions taken…"
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Internal note */}
              {ticket.internalNote && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                    Internal Note
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{ticket.internalNote}</p>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>

          {ticket.userId && (
            <Link href={`/users/${ticket.userId}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <User className="w-3.5 h-3.5" />
                View User
              </Button>
            </Link>
          )}

          {ticket.status !== "resolved" && ticket.status !== "closed" && activePanel === "resolve" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-slate-600"
                onClick={() => { onClose_ticket(ticket.id); onClose(); }}
              >
                <XCircle className="w-3.5 h-3.5" />
                Close Ticket
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleResolveSubmit}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Resolved
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function TicketsPage() {
  const [rawSearch,      setRawSearch]      = useState("");
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [agentFilter,    setAgentFilter]    = useState("all");
  const [detailTicket,   setDetailTicket]   = useState<LocalTicket | null>(null);
  const [selected,       setSelected]       = useState<string[]>([]);
  const [tickets,        setTickets]        = useState<LocalTicket[]>(
    MOCK_TICKETS.map((t) => ({ ...t }))
  );

  const search = useDebounce(rawSearch, 250);

  /* ── Filter ── */
  const filtered = useMemo<LocalTicket[]>(() => {
    const q = search.toLowerCase();
    return tickets.filter((t) => {
      const matchSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.user.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.agent.toLowerCase().includes(q);
      const matchStatus   = statusFilter   === "all" || t.status   === statusFilter;
      const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
      const matchCategory = categoryFilter === "all" || t.category === categoryFilter;
      const matchAgent    = agentFilter    === "all" || t.agent    === agentFilter;
      return matchSearch && matchStatus && matchPriority && matchCategory && matchAgent;
    });
  }, [search, statusFilter, priorityFilter, categoryFilter, agentFilter, tickets]);

  const pag      = usePagination({ total: filtered.length, pageSize: PAGE_SIZE });
  const pageData = pag.paginate(filtered);

  /* ── Stats ── */
  const openCount       = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in-progress").length;
  const resolvedCount   = tickets.filter((t) => t.status === "resolved").length;
  const overdueCount    = tickets.filter((t) => t.sla === "OVERDUE").length;

  /* ── Selection ── */
  const allSelected  = pageData.length > 0 && selected.length === pageData.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleOne = (id: string) =>
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleAll = () =>
    setSelected(allSelected ? [] : pageData.map((t) => t.id));

  /* ── Actions ── */
  const handleAssign = (id: string, agent: string) => {
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, agent, status: "in-progress" } : t));
  };

  const handleResolve = (id: string, note: string) => {
    setTickets((prev) => prev.map((t) =>
      t.id === id ? { ...t, status: "resolved", sla: "Resolved", internalNote: note } : t
    ));
    toast.success(`Ticket ${id} resolved`);
  };

  const handleClose = (id: string) => {
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status: "closed", sla: "Closed" } : t));
    toast.info(`Ticket ${id} closed`);
  };

  const bulkAssign = (agent: string) => {
    setTickets((prev) => prev.map((t) =>
      selected.includes(t.id) ? { ...t, agent, status: "in-progress" } : t
    ));
    toast.success(`${selected.length} ticket${selected.length > 1 ? "s" : ""} assigned to ${agent}`);
    setSelected([]);
  };

  const bulkResolve = () => {
    setTickets((prev) => prev.map((t) =>
      selected.includes(t.id) ? { ...t, status: "resolved", sla: "Resolved" } : t
    ));
    toast.success(`${selected.length} ticket${selected.length > 1 ? "s" : ""} resolved`);
    setSelected([]);
  };

  /* ── Export ── */
  const handleExport = () => {
    const headers = ["ID", "User", "Subject", "Category", "Priority", "Status", "Agent", "SLA", "Opened"];
    const rows    = filtered.map((t) => [
      t.id, t.user, t.subject, t.category, t.priority, t.status, t.agent, t.sla, t.openedAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a   = Object.assign(document.createElement("a"), {
      href:     URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `tickets-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a); a.click(); a.remove();
    toast.success(`Exported ${filtered.length} tickets`);
  };

  const uniqueAgents = Array.from(new Set(tickets.map((t) => t.agent))).sort();

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Support Tickets
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            All customer support tickets
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selected.length > 0 && (
            <>
              <Select onValueChange={bulkAssign}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <UserPlus className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                  <SelectValue placeholder="Assign to…" />
                </SelectTrigger>
                <SelectContent>
                  {AGENTS.filter((a) => a !== "Unassigned").map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                onClick={bulkResolve}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolve ({selected.length})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Open",        value: openCount,       color: "text-amber-700 dark:text-amber-400",    onClick: () => setStatusFilter("open") },
          { label: "In Progress", value: inProgressCount, color: "text-blue-700 dark:text-blue-400",      onClick: () => setStatusFilter("in-progress") },
          { label: "Resolved",    value: resolvedCount,   color: "text-emerald-700 dark:text-emerald-400",onClick: () => setStatusFilter("resolved") },
          { label: "Overdue SLA", value: overdueCount,    color: "text-red-700 dark:text-red-400",        onClick: () => {} },
        ].map(({ label, value, color, onClick }) => (
          <Card
            key={label}
            className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={onClick}
          >
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
              <p className={cn("text-2xl font-bold font-mono mt-1", color)}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Overdue alert ── */}
      {overdueCount > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 animate-pulse" />
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              {overdueCount} ticket{overdueCount > 1 ? "s" : ""} have breached SLA — immediate attention required
            </p>
          </div>
          <Button
            size="sm"
            className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white shrink-0"
            onClick={() => {
              setStatusFilter("open");
              setRawSearch("OVERDUE");
            }}
          >
            View Overdue
          </Button>
        </div>
      )}

      {/* ── Filters ── */}
      <Card className="shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search tickets…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
              <SelectTrigger className="w-full sm:w-[120px] h-9 text-sm">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
              <SelectTrigger className="w-full sm:w-[120px] h-9 text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="KYC">KYC</SelectItem>
                <SelectItem value="Payments">Payments</SelectItem>
                <SelectItem value="Account">Account</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Trading">Trading</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {uniqueAgents.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Tickets table ── */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              All Tickets
              <span className="ml-2 text-xs font-normal text-slate-400">
                {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
            {(statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all") && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setCategoryFilter("all");
                  setAgentFilter("all");
                  setRawSearch("");
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-blue-600"
                    aria-label="Select all tickets"
                  />
                </th>
                {[
                  { label: "Ticket ID",  align: "left" },
                  { label: "User",       align: "left" },
                  { label: "Subject",    align: "left" },
                  { label: "Category",   align: "left" },
                  { label: "Priority",   align: "left" },
                  { label: "Status",     align: "left" },
                  { label: "Agent",      align: "left" },
                  { label: "SLA",        align: "left" },
                  { label: "Opened",     align: "left" },
                  { label: "",           align: "left" },
                ].map(({ label, align }) => (
                  <th
                    key={label}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide",
                      align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      <p className="text-sm">No tickets match your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={cn(
                      "border-b border-slate-50 dark:border-slate-700/50 transition-colors",
                      ticket.sla === "OVERDUE"
                        ? "bg-red-50/40 dark:bg-red-900/10"
                        : selected.includes(ticket.id)
                        ? "bg-blue-50/60 dark:bg-blue-900/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(ticket.id)}
                        onChange={() => toggleOne(ticket.id)}
                        className="rounded border-slate-300 text-blue-600"
                        aria-label={`Select ticket ${ticket.id}`}
                      />
                    </td>

                    {/* ID */}
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {ticket.id}
                    </td>

                    {/* User */}
                    <td className="px-4 py-3">
                      {ticket.userId ? (
                        <Link href={`/users/${ticket.userId}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                          {ticket.user}
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-700 dark:text-slate-300">{ticket.user}</span>
                      )}
                    </td>

                    {/* Subject */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-sm text-slate-800 dark:text-slate-100 font-medium truncate">
                        {ticket.subject}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                      {ticket.category}
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", PRIORITY_CLASSES[ticket.priority])}>
                        {ticket.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>

                    {/* Agent */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs",
                        ticket.agent === "Unassigned"
                          ? "text-slate-400 dark:text-slate-500 italic"
                          : "text-slate-700 dark:text-slate-300"
                      )}>
                        {ticket.agent}
                      </span>
                    </td>

                    {/* SLA */}
                    <td className="px-4 py-3">
                      <SLAIndicator sla={ticket.sla} />
                    </td>

                    {/* Opened */}
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {ticket.openedAt}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => setDetailTicket(ticket)}
                        >
                          <Eye className="w-3 h-3" />
                          Open
                        </Button>
                        {ticket.status !== "resolved" && ticket.status !== "closed" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => {
                              setDetailTicket(ticket);
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pag.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {pag.rangeLabel("tickets")}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={pag.goPrev} disabled={!pag.hasPrev}>Prev</Button>
              <span className="text-xs px-3 font-medium text-slate-600 dark:text-slate-300">
                {pag.page} / {pag.totalPages}
              </span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={pag.goNext} disabled={!pag.hasNext}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail modal */}
      {detailTicket && (
        <TicketDetailModal
          ticket={detailTicket}
          onClose={() => setDetailTicket(null)}
          onAssign={handleAssign}
          onResolve={handleResolve}
          onClose_ticket={handleClose}
        />
      )}
    </div>
  );
}