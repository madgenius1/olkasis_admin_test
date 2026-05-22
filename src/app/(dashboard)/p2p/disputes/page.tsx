"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle, CheckCircle2, Clock, Eye,
  MessageSquare, ArrowLeftRight, Search, Download,
  User, ChevronRight, XCircle,
} from "lucide-react";

import { P2P_DISPUTES, P2P_TRANSFERS } from "../../../../lib/walletMockData";
import { useDebounce } from "../../../../hooks/useDebounce";
import { formatKSh, timeAgo, cn } from "../../../../lib/utils";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Textarea } from "../../../../components/ui/textarea";
import { Label } from "../../../../components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogBody, DialogFooter,
} from "../../../../components/ui/dialog";

import type { P2PDispute, DisputeStatus } from "../../../../types";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type StatusFilter  = "all" | DisputeStatus;

interface DisputeNote {
  id:         string;
  author:     string;
  content:    string;
  timestamp:  string;
  isInternal: boolean;
}

interface LocalDispute extends P2PDispute {
  localNotes?: DisputeNote[];
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const RESOLUTION_OPTIONS = [
  { value: "refund_sender",    label: "Refund full amount to sender" },
  { value: "release_receiver", label: "Release funds to recipient" },
  { value: "split_amount",     label: "Split amount between parties" },
  { value: "no_action",        label: "No action required — dispute invalid" },
  { value: "escalate_legal",   label: "Escalate to legal / law enforcement" },
] as const;

type ResolutionType = typeof RESOLUTION_OPTIONS[number]["value"];

const STATUS_COLOURS: Record<DisputeStatus, string> = {
  open:          "border-l-4 border-l-red-500",
  investigating: "border-l-4 border-l-amber-500",
  resolved:      "border-l-4 border-l-emerald-500",
  escalated:     "border-l-4 border-l-purple-500",
};

/* ─────────────────────────────────────────────────────────────
   DISPUTE REVIEW MODAL
───────────────────────────────────────────────────────────── */
function DisputeReviewModal({
  dispute,
  onClose,
  onInvestigate,
  onResolve,
  onEscalate,
}: {
  dispute:       LocalDispute;
  onClose:       () => void;
  onInvestigate: (id: string) => void;
  onResolve:     (id: string, resolution: string, note: string) => void;
  onEscalate:    (id: string, note: string) => void;
}) {
  const [newNote,       setNewNote]       = useState("");
  const [resolution,    setResolution]    = useState<ResolutionType | "">("");
  const [activePanel,   setActivePanel]   = useState<"details" | "resolve" | "escalate">("details");

  const transfer = P2P_TRANSFERS.find((t) => t.id === dispute.transferId);

  /* Timeline events */
  const timeline = [
    {
      label:     "Transfer initiated",
      time:      transfer?.timestamp ?? "—",
      icon:      ArrowLeftRight,
      color:     "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
    },
    {
      label:     `Dispute raised by ${dispute.raisedBy}`,
      time:      dispute.openedAt,
      icon:      AlertTriangle,
      color:     "text-red-600 bg-red-50 dark:bg-red-900/30",
    },
    ...(dispute.status === "investigating" || dispute.status === "resolved" || dispute.status === "escalated"
      ? [{ label: "Investigation started", time: dispute.openedAt, icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30" }]
      : []),
    ...(dispute.status === "resolved"
      ? [{ label: `Resolved — ${dispute.resolution ?? ""}`, time: dispute.resolvedAt ?? "—", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" }]
      : []),
    ...(dispute.status === "escalated"
      ? [{ label: "Escalated for further review", time: "—", icon: XCircle, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30" }]
      : []),
  ];

  const handleResolve = () => {
    if (!resolution) { toast.error("Please select a resolution type"); return; }
    if (!newNote.trim()) { toast.error("Please provide resolution notes"); return; }
    onResolve(dispute.id, resolution, newNote);
    onClose();
  };

  const handleEscalate = () => {
    if (!newNote.trim()) { toast.error("Please provide escalation reason"); return; }
    onEscalate(dispute.id, newNote);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-amber-600" />
            Dispute Review —{" "}
            <span className="font-mono">{dispute.id}</span>
            <StatusBadge status={dispute.status} size="sm" />
          </DialogTitle>
          <DialogDescription>
            {dispute.sender} → {dispute.receiver} · {formatKSh(dispute.amount)} ·{" "}
            {dispute.reason}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Transfer context */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {[
              { label: "Transfer ID",  value: dispute.transferId,        mono: true },
              { label: "Raised By",    value: dispute.raisedBy,          mono: false },
              { label: "Amount",       value: formatKSh(dispute.amount), mono: true },
              { label: "Sender",       value: dispute.sender,            mono: false },
              { label: "Receiver",     value: dispute.receiver,          mono: false },
              { label: "Opened",       value: dispute.openedAt,          mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
                <p className={cn("text-sm font-medium text-slate-800 dark:text-slate-100 mt-0.5", mono && "font-mono")}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Panel tabs */}
          <div className="flex gap-1 border-b border-slate-100 dark:border-slate-700">
            {(["details", "resolve", "escalate"] as const).map((panel) => (
              <button
                key={panel}
                onClick={() => setActivePanel(panel)}
                className={cn(
                  "px-3 py-2 text-xs font-semibold capitalize border-b-2 -mb-px transition-colors",
                  activePanel === panel
                    ? "text-blue-700 dark:text-blue-400 border-blue-600"
                    : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {panel === "details" ? "Timeline & Details" : panel === "resolve" ? "Resolve" : "Escalate"}
              </button>
            ))}
          </div>

          {/* Details panel */}
          {activePanel === "details" && (
            <div className="space-y-4">
              {/* Reason card */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                  Dispute Reason
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-300">{dispute.reason}</p>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Event Timeline
                </p>
                <div className="space-y-3">
                  {timeline.map((event, i) => {
                    const Icon = event.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", event.color)}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{event.label}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{event.time}</p>
                        </div>
                        {i < timeline.length - 1 && (
                          <div className="absolute ml-3.5 mt-7 w-px h-3 bg-slate-200 dark:bg-slate-700" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Existing notes */}
              {(dispute.notes || (dispute.localNotes?.length ?? 0) > 0) && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Investigation Notes
                  </p>
                  {dispute.notes && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{dispute.notes}</p>
                    </div>
                  )}
                  {dispute.localNotes?.map((note) => (
                    <div key={note.id} className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{note.author}</span>
                        <span className="text-xs text-slate-400 font-mono">{timeAgo(note.timestamp)}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add note + investigate */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dispute-note">Add Investigation Note</Label>
                  <Textarea
                    id="dispute-note"
                    placeholder="Document investigation steps, contacted parties, evidence gathered…"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resolve panel */}
          {activePanel === "resolve" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="resolution-type">Resolution Type *</Label>
                <Select value={resolution} onValueChange={(v) => setResolution(v as ResolutionType)}>
                  <SelectTrigger id="resolution-type">
                    <SelectValue placeholder="Select a resolution…" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {resolution && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400">
                  {resolution === "refund_sender"    && `KES ${formatKSh(dispute.amount)} will be returned to ${dispute.sender}.`}
                  {resolution === "release_receiver" && `KES ${formatKSh(dispute.amount)} will be released to ${dispute.receiver}.`}
                  {resolution === "split_amount"     && `Both parties will be notified for negotiated split.`}
                  {resolution === "no_action"        && `Dispute will be closed with no financial action.`}
                  {resolution === "escalate_legal"   && `Case will be referred to legal team and flagged for law enforcement.`}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="resolution-note">Resolution Notes *</Label>
                <Textarea
                  id="resolution-note"
                  placeholder="Summarise the resolution decision and rationale…"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Escalate panel */}
          {activePanel === "escalate" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="text-sm text-purple-800 dark:text-purple-300">
                  <p className="font-semibold mb-1">Escalation will:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Flag this dispute for senior compliance review</li>
                    <li>Freeze all transactions between the two parties</li>
                    <li>Generate an audit log entry</li>
                    <li>Send notifications to both users</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="escalate-note">Escalation Reason *</Label>
                <Textarea
                  id="escalate-note"
                  placeholder="Explain why this dispute needs escalation beyond standard resolution…"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>

          {dispute.status === "open" && activePanel === "details" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50"
              onClick={() => { onInvestigate(dispute.id); onClose(); }}
            >
              <Clock className="w-3.5 h-3.5" />
              Start Investigation
            </Button>
          )}

          {activePanel === "resolve" && dispute.status !== "resolved" && (
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleResolve}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Confirm Resolution
            </Button>
          )}

          {activePanel === "escalate" && dispute.status !== "escalated" && (
            <Button
              size="sm"
              className="gap-1.5 bg-purple-700 hover:bg-purple-800 text-white"
              onClick={handleEscalate}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Escalate Dispute
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function DisputesPage() {
  const [rawSearch,    setRawSearch]    = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [reviewId,     setReviewId]     = useState<string | null>(null);
  const [disputes,     setDisputes]     = useState<LocalDispute[]>(
    P2P_DISPUTES.map((d) => ({ ...d, localNotes: [] }))
  );

  const search = useDebounce(rawSearch, 250);

  /* ── Filter ── */
  const filtered = useMemo<LocalDispute[]>(() => {
    const q = search.toLowerCase();
    return disputes.filter((d) => {
      const matchSearch =
        !q ||
        d.id.toLowerCase().includes(q) ||
        d.transferId.toLowerCase().includes(q) ||
        d.raisedBy.toLowerCase().includes(q) ||
        d.reason.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, disputes]);

  /* ── Counts ── */
  const openCount          = disputes.filter((d) => d.status === "open").length;
  const investigatingCount = disputes.filter((d) => d.status === "investigating").length;
  const resolvedCount      = disputes.filter((d) => d.status === "resolved").length;
  const escalatedCount     = disputes.filter((d) => d.status === "escalated").length;

  /* ── Actions ── */
  const handleInvestigate = (id: string) => {
    setDisputes((prev) =>
      prev.map((d) => d.id === id ? { ...d, status: "investigating" } : d)
    );
    toast.info(`DIS${id.slice(3)} — investigation started`);
  };

  const handleResolve = (id: string, resolution: string, note: string) => {
    const resLabel = RESOLUTION_OPTIONS.find((o) => o.value === resolution)?.label ?? resolution;
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status:     "resolved",
              resolution: resLabel,
              resolvedBy: "Sarah Kimani",
              resolvedAt: new Date().toISOString(),
              localNotes: [
                ...(d.localNotes ?? []),
                {
                  id:         `note-${Date.now()}`,
                  author:     "Sarah Kimani",
                  content:    `Resolution: ${resLabel}. ${note}`,
                  timestamp:  new Date().toISOString(),
                  isInternal: true,
                },
              ],
            }
          : d
      )
    );
    toast.success(`Dispute ${id} resolved`);
  };

  const handleEscalate = (id: string, note: string) => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status:     "escalated",
              localNotes: [
                ...(d.localNotes ?? []),
                {
                  id:         `note-${Date.now()}`,
                  author:     "Sarah Kimani",
                  content:    `Escalated: ${note}`,
                  timestamp:  new Date().toISOString(),
                  isInternal: true,
                },
              ],
            }
          : d
      )
    );
    toast.warning(`Dispute ${id} escalated`);
  };

  /* ── Export ── */
  const handleExport = () => {
    const headers = ["Dispute ID", "Transfer ID", "Raised By", "Sender", "Receiver", "Amount", "Reason", "Status", "Opened"];
    const rows    = filtered.map((d) => [
      d.id, d.transferId, d.raisedBy, d.sender, d.receiver,
      d.amount.toString(), d.reason, d.status, d.openedAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a   = Object.assign(document.createElement("a"), {
      href:     URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `p2p-disputes-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a); a.click(); a.remove();
    toast.success(`Exported ${filtered.length} disputes`);
  };

  const reviewDispute = disputes.find((d) => d.id === reviewId) ?? null;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            P2P Disputes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Manage and resolve peer-to-peer transfer disputes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 text-xs shrink-0"
          onClick={handleExport}
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Open",          value: openCount,          color: "text-red-700 dark:text-red-400",     bg: "bg-red-50 dark:bg-red-900/40",     icon: AlertTriangle },
          { label: "Investigating", value: investigatingCount, color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/40", icon: Clock },
          { label: "Resolved",      value: resolvedCount,      color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/40", icon: CheckCircle2 },
          { label: "Escalated",     value: escalatedCount,     color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/40", icon: XCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
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

      {/* ── Urgent banner ── */}
      {openCount > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              {openCount} open dispute{openCount > 1 ? "s" : ""} awaiting investigation — total{" "}
              <span className="font-mono">
                {formatKSh(disputes.filter((d) => d.status === "open").reduce((s, d) => s + d.amount, 0))}
              </span>{" "}
              at risk
            </p>
          </div>
          <Button
            size="sm"
            className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white shrink-0"
            onClick={() => setStatusFilter("open")}
          >
            View Open
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
                placeholder="Search by dispute ID, transfer ID, user, or reason…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Disputes table ── */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
          <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
            Open Disputes
            <span className="ml-2 text-xs font-normal text-slate-400">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
          </CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                {[
                  { label: "Dispute ID",   align: "left" },
                  { label: "Transfer ID",  align: "left" },
                  { label: "Raised By",    align: "left" },
                  { label: "Reason",       align: "left" },
                  { label: "Amount",       align: "right" },
                  { label: "Status",       align: "left" },
                  { label: "Opened",       align: "left" },
                  { label: "",             align: "left" },
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      <p className="text-sm">No disputes match your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((dispute) => (
                  <tr
                    key={dispute.id}
                    className={cn(
                      "border-b border-slate-50 dark:border-slate-700/50 transition-colors",
                      STATUS_COLOURS[dispute.status],
                      "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    )}
                  >
                    {/* Dispute ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded">
                        {dispute.id}
                      </span>
                    </td>

                    {/* Transfer ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
                        {dispute.transferId}
                      </span>
                    </td>

                    {/* Raised By */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          {dispute.raisedBy}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 pl-5">
                        {dispute.sender}
                        <ChevronRight className="w-3 h-3 inline mx-0.5" />
                        {dispute.receiver}
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        {dispute.reason}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                      {formatKSh(dispute.amount)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={dispute.status} />
                    </td>

                    {/* Opened */}
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {dispute.openedAt}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => setReviewId(dispute.id)}
                        >
                          <Eye className="w-3 h-3" />
                          Review
                        </Button>
                        {dispute.status === "open" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => {
                              setReviewId(dispute.id);
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
      </Card>

      {/* ── Review modal ── */}
      {reviewId && reviewDispute && (
        <DisputeReviewModal
          dispute={reviewDispute}
          onClose={() => setReviewId(null)}
          onInvestigate={handleInvestigate}
          onResolve={handleResolve}
          onEscalate={handleEscalate}
        />
      )}
    </div>
  );
}