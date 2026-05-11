"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  GitMerge, AlertTriangle, CheckCircle2, XCircle,
  TrendingUp, TrendingDown, Clock, Zap,
  ChevronDown, ChevronRight, Eye, Activity,
} from "lucide-react";
import {
  MOCK_DERIVATIVES, MOCK_DERIVATIVES_APPROVALS,
  MOCK_MARGIN_CALLS,
} from "../../../../lib/mockData";
import { formatKSh, cn } from "../../../../lib/utils";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Progress } from "../../../../components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogBody, DialogFooter,
} from "../../../../components/ui/dialog";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";

import type {
  DerivativePosition, DerivativesApproval, MarginCall,
} from "../../../../types/index";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type ApprovalAction = { id: string; verdict: "approved" | "rejected"; reason?: string };

/* ─────────────────────────────────────────────────────────────
   MARGIN COLOUR HELPERS
───────────────────────────────────────────────────────────── */
function marginVariant(pct: number): "success" | "warning" | "danger" {
  if (pct >= 90) return "danger";
  if (pct >= 70) return "warning";
  return "success";
}

function marginLabel(pct: number): string {
  if (pct >= 90) return "Critical";
  if (pct >= 70) return "Warning";
  return "Safe";
}

function marginLabelColor(pct: number): string {
  if (pct >= 90) return "text-red-700 dark:text-red-400";
  if (pct >= 70) return "text-amber-700 dark:text-amber-400";
  return "text-emerald-700 dark:text-emerald-400";
}

/* ─────────────────────────────────────────────────────────────
   APPROVAL REVIEW MODAL
───────────────────────────────────────────────────────────── */
function ApprovalModal({
  approval,
  onClose,
  onDecide,
}: {
  approval:  DerivativesApproval;
  onClose:   () => void;
  onDecide:  (action: ApprovalAction) => void;
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm,  setShowRejectForm]   = useState(false);

  const handleApprove = () => {
    onDecide({ id: approval.id, verdict: "approved" });
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    onDecide({ id: approval.id, verdict: "rejected", reason: rejectionReason });
    onClose();
  };

  /* Risk profile colour */
  const riskColor = {
    conservative: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
    moderate:     "text-amber-600 bg-amber-50 dark:bg-amber-900/30",
    aggressive:   "text-red-600 bg-red-50 dark:bg-red-900/30",
  }[approval.riskProfile];

  /* Quiz score colour */
  const scoreColor =
    approval.quizScore >= 80 ? "text-emerald-700 dark:text-emerald-400" :
    approval.quizScore >= 60 ? "text-amber-700 dark:text-amber-400"    :
    "text-red-700 dark:text-red-400";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="max-w-lg">
        <DialogHeader>
          <DialogTitle>Derivatives Access Review</DialogTitle>
          <DialogDescription>
            {approval.userName} · {approval.email}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Applicant details */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Applicant",    value: approval.userName },
              { label: "Applied",      value: approval.appliedAt },
              { label: "Email",        value: approval.email },
              { label: "Risk Profile", value: approval.riskProfile },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className={cn(
                  "text-sm font-medium mt-0.5",
                  label === "Risk Profile"
                    ? `capitalize px-2 py-0.5 rounded inline-block ${riskColor}`
                    : "text-slate-800 dark:text-slate-100"
                )}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Quiz score */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Investment Knowledge Assessment
            </p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">Quiz Score</span>
              <span className={cn("text-2xl font-black font-mono", scoreColor)}>
                {approval.quizScore}
                <span className="text-sm font-normal text-slate-400">/100</span>
              </span>
            </div>
            <Progress
              value={approval.quizScore}
              variant={
                approval.quizScore >= 80 ? "success" :
                approval.quizScore >= 60 ? "warning"  : "danger"
              }
            />
            <p className="text-xs text-slate-400 mt-2">
              {approval.quizScore >= 80
                ? "✓ Score meets minimum threshold (80+)"
                : approval.quizScore >= 60
                ? "⚠ Score below recommended threshold — manual review required"
                : "✗ Score below minimum (60) — rejection recommended"}
            </p>
          </div>

          {/* Rejection form */}
          {showRejectForm && (
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="Explain why this application is being rejected…"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          {!showRejectForm ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowRejectForm(true)}
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleApprove}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve Access
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={handleReject}
            >
              <XCircle className="w-3.5 h-3.5" />
              Confirm Rejection
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
export default function DerivativesPage() {
  const [activeTab,     setActiveTab]     = useState("positions");
  const [approvals,     setApprovals]     = useState<DerivativesApproval[]>(MOCK_DERIVATIVES_APPROVALS);
  const [reviewApproval,setReviewApproval]= useState<DerivativesApproval | null>(null);
  const [positions,     setPositions]     = useState<DerivativePosition[]>(MOCK_DERIVATIVES);
  const [expandedPos,   setExpandedPos]   = useState<string | null>(null);

  /* ── Derived stats ── */
  const totalNotional   = positions.reduce((s, p) => s + p.notionalValue, 0);
  const marginCallCount = positions.filter((p) => p.status === "margin_call").length;
  const liquidateCount  = positions.filter((p) => p.status === "pending_liquidation").length;
  const pendingApprovals= approvals.filter((a) => a.status === "pending").length;
  const totalPnL        = positions.reduce((s, p) => s + p.unrealizedPnL, 0);

  /* ── Sorted by margin % descending ── */
  const sortedByMargin  = [...positions].sort((a, b) => b.marginPercent - a.marginPercent);
  const liquidationQueue= positions.filter((p) => p.status === "pending_liquidation");
  const marginCallQueue = positions.filter((p) => p.status === "margin_call");

  /* ── Approval actions ── */
  const handleDecide = ({ id, verdict, reason }: ApprovalAction) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status:          verdict,
              reviewedBy:      "Sarah Kimani",
              reviewedAt:      new Date().toISOString(),
              rejectionReason: reason,
            }
          : a
      )
    );
    toast[verdict === "approved" ? "success" : "error"](
      `Application ${verdict} — ${approvals.find((a) => a.id === id)?.userName}`
    );
  };

  /* ── Liquidate a position ── */
  const handleLiquidate = (posId: string) => {
    setPositions((prev) =>
      prev.map((p) => p.id === posId ? { ...p, status: "active" as const } : p)
    );
    toast.error(`Position ${posId} force-liquidated`);
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Derivatives Oversight
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Options, futures, margin management, and certification approvals
          </p>
        </div>
        {(marginCallCount + liquidateCount) > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              {marginCallCount + liquidateCount} critical
            </div>
          </div>
        )}
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Notional",
            value: formatKSh(totalNotional),
            color: "text-blue-700 dark:text-blue-400",
            icon:  GitMerge,
            bg:    "bg-blue-50 dark:bg-blue-900/40",
          },
          {
            label: "Unrealised P&L",
            value: `${totalPnL >= 0 ? "+" : ""}${formatKSh(totalPnL)}`,
            color: totalPnL >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400",
            icon:  totalPnL >= 0 ? TrendingUp : TrendingDown,
            bg:    totalPnL >= 0 ? "bg-emerald-50 dark:bg-emerald-900/40" : "bg-red-50 dark:bg-red-900/40",
          },
          {
            label: "Margin Calls",
            value: String(marginCallCount + liquidateCount),
            color: (marginCallCount + liquidateCount) > 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400",
            icon:  AlertTriangle,
            bg:    (marginCallCount + liquidateCount) > 0 ? "bg-red-50 dark:bg-red-900/40" : "bg-emerald-50 dark:bg-emerald-900/40",
          },
          {
            label: "Pending Approvals",
            value: String(pendingApprovals),
            color: pendingApprovals > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-700 dark:text-slate-300",
            icon:  Clock,
            bg:    pendingApprovals > 0 ? "bg-amber-50 dark:bg-amber-900/40" : "bg-slate-100 dark:bg-slate-700",
          },
        ].map(({ label, value, color, icon: Icon, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {label}
                </p>
                <p className={cn("text-[18px] font-bold font-mono mt-1.5 leading-tight", color)}>
                  {value}
                </p>
              </div>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          <TabsTrigger value="positions"  className="gap-1.5 text-xs">
            <Activity className="w-3.5 h-3.5" />
            Positions ({positions.length})
          </TabsTrigger>
          <TabsTrigger value="margin"     className="gap-1.5 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            Margin Monitor
            {(marginCallCount + liquidateCount) > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                {marginCallCount + liquidateCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="liquidation" className="gap-1.5 text-xs">
            <Zap className="w-3.5 h-3.5" />
            Liquidation Queue ({liquidationQueue.length})
          </TabsTrigger>
          <TabsTrigger value="approvals"  className="gap-1.5 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approvals
            {pendingApprovals > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                {pendingApprovals}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── Positions tab ─── */}
        <TabsContent value="positions" className="mt-4">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
                Active Derivative Positions
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    {[
                      { label: "User",           align: "left" },
                      { label: "Instrument",     align: "left" },
                      { label: "Type",           align: "left" },
                      { label: "Side",           align: "left" },
                      { label: "Qty",            align: "right" },
                      { label: "Notional",       align: "right" },
                      { label: "Unrealised P&L", align: "right" },
                      { label: "Margin",         align: "left" },
                      { label: "Liq. Price",     align: "right" },
                      { label: "Status",         align: "left" },
                      { label: "",               align: "left" },
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
                  {positions.map((pos: DerivativePosition) => {
                    const pnlUp = pos.unrealizedPnL >= 0;
                    return (
                      <tr
                        key={pos.id}
                        className={cn(
                          "border-b border-slate-50 dark:border-slate-700/50 transition-colors",
                          pos.status === "pending_liquidation"
                            ? "bg-red-50/50 dark:bg-red-900/10"
                            : pos.status === "margin_call"
                            ? "bg-amber-50/50 dark:bg-amber-900/10"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        )}
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/users/${pos.userId}`}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {pos.userName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {pos.instrument}
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-400 text-xs">
                          {pos.instrumentType}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded",
                            pos.side === "LONG"
                              ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                              : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          )}>
                            {pos.side}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-slate-800 dark:text-slate-100">
                          {pos.quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {formatKSh(pos.notionalValue)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            "font-mono text-sm font-semibold",
                            pnlUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          )}>
                            {pnlUp ? "+" : ""}{formatKSh(pos.unrealizedPnL)}
                          </span>
                        </td>
                        <td className="px-4 py-3 min-w-[130px]">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={pos.marginPercent}
                              variant={marginVariant(pos.marginPercent)}
                              className="flex-1"
                            />
                            <span className={cn(
                              "text-xs font-mono font-semibold shrink-0",
                              marginLabelColor(pos.marginPercent)
                            )}>
                              {pos.marginPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                          {pos.liquidationPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={pos.status} />
                        </td>
                        <td className="px-4 py-3">
                          {pos.status === "pending_liquidation" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1 bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => handleLiquidate(pos.id)}
                            >
                              <Zap className="w-3 h-3" />
                              Liquidate
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ─── Margin Monitor tab ─── */}
        <TabsContent value="margin" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Margin utilisation sorted */}
            <Card className="shadow-sm">
              <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
                  Margin Utilisation — All Positions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-4">
                {sortedByMargin.map((pos) => (
                  <div key={pos.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {pos.userName}
                        </span>
                        <span className="text-xs text-slate-400 ml-2 font-mono">{pos.instrument}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-semibold", marginLabelColor(pos.marginPercent))}>
                          {marginLabel(pos.marginPercent)}
                        </span>
                        <span className={cn("font-mono text-sm font-bold", marginLabelColor(pos.marginPercent))}>
                          {pos.marginPercent}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={pos.marginPercent}
                      variant={marginVariant(pos.marginPercent)}
                    />
                    <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                      <span>Used: {formatKSh(pos.marginUsed)}</span>
                      <span>Liq. price: {pos.liquidationPrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Margin calls */}
            <Card className="shadow-sm">
              <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400 pb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Active Margin Calls
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                {marginCallQueue.length === 0 && MOCK_MARGIN_CALLS.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    No active margin calls
                  </div>
                ) : (
                  <div className="space-y-4">
                    {MOCK_MARGIN_CALLS.map((mc: MarginCall) => (
                      <div
                        key={mc.positionId}
                        className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <Link
                              href={`/users/${mc.userId}`}
                              className="font-semibold text-sm text-red-800 dark:text-red-300 hover:underline"
                            >
                              {mc.userName}
                            </Link>
                            <p className="text-xs text-red-600 dark:text-red-400 font-mono mt-0.5">
                              {mc.instrument}
                            </p>
                          </div>
                          <span className="badge-danger text-xs">Margin Call</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-red-500 dark:text-red-400">Current Margin</p>
                            <p className="font-mono font-bold text-red-800 dark:text-red-300 mt-0.5">
                              {formatKSh(mc.currentMargin)}
                            </p>
                          </div>
                          <div>
                            <p className="text-red-500 dark:text-red-400">Required</p>
                            <p className="font-mono font-bold text-red-800 dark:text-red-300 mt-0.5">
                              {formatKSh(mc.maintenanceMargin)}
                            </p>
                          </div>
                          <div>
                            <p className="text-red-500 dark:text-red-400">Deficit</p>
                            <p className="font-mono font-bold text-red-800 dark:text-red-300 mt-0.5">
                              {formatKSh(mc.deficit)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-red-500">Due: {mc.dueBy}</p>
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1 bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => toast.info(`Notification sent to ${mc.userName}`)}
                          >
                            Notify User
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Liquidation Queue tab ─── */}
        <TabsContent value="liquidation" className="mt-4">
          {liquidationQueue.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-16 text-center text-slate-400 text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
                No positions in the liquidation queue
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {liquidationQueue.map((pos) => (
                <Card
                  key={pos.id}
                  className="shadow-sm border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="badge-danger text-xs">Pending Liquidation</span>
                          <span className="font-mono text-xs text-slate-500">{pos.id}</span>
                        </div>
                        <Link href={`/users/${pos.userId}`}>
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 hover:text-blue-600">
                            {pos.userName}
                          </h3>
                        </Link>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                          {pos.instrument} · {pos.side} · {pos.instrumentType}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => toast.info("Override applied — position held")}
                        >
                          Manual Override
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handleLiquidate(pos.id)}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Force Liquidate
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: "Notional Value",   value: formatKSh(pos.notionalValue) },
                        { label: "Margin Used",      value: formatKSh(pos.marginUsed) },
                        { label: "Margin %",         value: `${pos.marginPercent}%` },
                        { label: "Liquidation Price",value: `KES ${pos.liquidationPrice.toFixed(2)}` },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                          <p className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100 mt-0.5">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Margin Utilisation
                        </span>
                        <span className="text-xs font-bold font-mono text-red-600 dark:text-red-400">
                          {pos.marginPercent}% — {marginLabel(pos.marginPercent)}
                        </span>
                      </div>
                      <Progress value={pos.marginPercent} variant="danger" />
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      Unrealised P&L:{" "}
                      <span className={cn(
                        "font-mono font-semibold",
                        pos.unrealizedPnL >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}>
                        {pos.unrealizedPnL >= 0 ? "+" : ""}{formatKSh(pos.unrealizedPnL)}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Approvals tab ─── */}
        <TabsContent value="approvals" className="mt-4">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
                Derivatives Access Applications
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    {[
                      { label: "Applicant",     align: "left" },
                      { label: "Email",         align: "left" },
                      { label: "Applied",       align: "left" },
                      { label: "Quiz Score",    align: "right" },
                      { label: "Risk Profile",  align: "left" },
                      { label: "Status",        align: "left" },
                      { label: "Reviewed By",   align: "left" },
                      { label: "",              align: "left" },
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
                  {approvals.map((approval: DerivativesApproval) => {
                    const scoreColor =
                      approval.quizScore >= 80 ? "text-emerald-700 dark:text-emerald-400" :
                      approval.quizScore >= 60 ? "text-amber-700 dark:text-amber-400"    :
                      "text-red-700 dark:text-red-400";

                    return (
                      <tr
                        key={approval.id}
                        className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                          {approval.userName}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {approval.email}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {approval.appliedAt}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn("font-mono font-bold text-sm", scoreColor)}>
                            {approval.quizScore}
                          </span>
                          <span className="text-xs text-slate-400">/100</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded capitalize",
                            approval.riskProfile === "conservative" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                            approval.riskProfile === "moderate"     ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                            "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          )}>
                            {approval.riskProfile}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={approval.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {approval.reviewedBy ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          {approval.status === "pending" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => setReviewApproval(approval)}
                            >
                              <Eye className="w-3 h-3" />
                              Review
                            </Button>
                          ) : (
                            <span className={cn(
                              "text-xs font-medium",
                              approval.status === "approved" ? "text-emerald-600" : "text-red-600"
                            )}>
                              {approval.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Approval review modal ── */}
      {reviewApproval && (
        <ApprovalModal
          approval={reviewApproval}
          onClose={() => setReviewApproval(null)}
          onDecide={handleDecide}
        />
      )}
    </div>
  );
}