"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Clock, AlertTriangle, CheckCircle2, XCircle,
  Eye, Users, ShieldCheck, Baby,
} from "lucide-react";

import {
  MOCK_KYC_QUEUE, MOCK_JOINT_KYC, MOCK_JUNIOR_KYC,
} from "../../../lib/mockData";
import { cn } from "../../../lib/utils";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Button } from "../../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

import type {
  KYCQueueItem, JointKYCRecord, JuniorKYCRecord,
} from "../../../types/index";

/* ── Priority badge ──────────────────────────────────────────── */
const PRIORITY_BADGE: Record<string, string> = {
  urgent: "badge-danger",
  high:   "badge-warning",
  normal: "badge-neutral",
};

/* ── Risk score colour ───────────────────────────────────────── */
function RiskColour(score: number): string {
  if (score > 15) return "text-red-600 dark:text-red-400";
  if (score > 8)  return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

/* ── Page ───────────────────────────────────────────────────── */
export default function KYCPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("individual");

  /* Derived counts */
  const pendingCount  = MOCK_KYC_QUEUE.length;
  const urgentCount   = MOCK_KYC_QUEUE.filter((k) => k.priority === "urgent").length;
  const approvedToday = 18;
  const rejectedToday = 3;

  /* Selection helpers */
  const toggleOne = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = (ids: string[], checked: boolean) =>
    setSelected(checked ? ids : []);

  /* Bulk actions */
  const handleBulkApprove = () => {
    toast.success(`Approved ${selected.length} submissions`);
    setSelected([]);
  };

  const handleBulkReject = () => {
    toast.error(`Rejected ${selected.length} submissions`);
    setSelected([]);
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            KYC Review Queue
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {pendingCount} pending verifications
          </p>
        </div>

        {/* Bulk action buttons */}
        {selected.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
              onClick={handleBulkApprove}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve ({selected.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleBulkReject}
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Pending",        value: String(pendingCount),  icon: Clock,         color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/40" },
          { label: "Urgent",         value: String(urgentCount),   icon: AlertTriangle, color: "text-red-600",     bg: "bg-red-50 dark:bg-red-900/40" },
          { label: "Approved Today", value: String(approvedToday), icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/40" },
          { label: "Rejected Today", value: String(rejectedToday), icon: XCircle,       color: "text-slate-600",   bg: "bg-slate-50 dark:bg-slate-700" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest">
                  {label}
                </p>
                <p className={cn("text-xl font-bold font-mono leading-tight mt-0.5", color)}>
                  {value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          <TabsTrigger value="individual" className="gap-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            Individual
            <span className="ml-1 text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full leading-none">
              {MOCK_KYC_QUEUE.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="joint" className="gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" />
            Joint
            <span className="ml-1 text-[10px] font-bold bg-slate-400 text-white px-1.5 py-0.5 rounded-full leading-none">
              {MOCK_JOINT_KYC.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="junior" className="gap-1.5 text-xs">
            <Baby className="w-3.5 h-3.5" />
            Junior
            <span className="ml-1 text-[10px] font-bold bg-slate-400 text-white px-1.5 py-0.5 rounded-full leading-none">
              {MOCK_JUNIOR_KYC.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ─ Individual KYC queue ─ */}
        <TabsContent value="individual" className="mt-4">
          <IndividualQueue
            items={MOCK_KYC_QUEUE}
            selected={selected}
            onToggleOne={toggleOne}
            onToggleAll={(checked) =>
              toggleAll(MOCK_KYC_QUEUE.map((k) => k.id), checked)
            }
          />
        </TabsContent>

        {/* ─ Joint KYC queue ─ */}
        <TabsContent value="joint" className="mt-4">
          <JointQueue items={MOCK_JOINT_KYC} />
        </TabsContent>

        {/* ─ Junior KYC queue ─ */}
        <TabsContent value="junior" className="mt-4">
          <JuniorQueue items={MOCK_JUNIOR_KYC} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Individual queue sub-component ─────────────────────────── */
function IndividualQueue({
  items,
  selected,
  onToggleOne,
  onToggleAll,
}: {
  items:       KYCQueueItem[];
  selected:    string[];
  onToggleOne: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
}) {
  const allChecked  = items.length > 0 && selected.length === items.length;
  const someChecked = selected.length > 0 && !allChecked;

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Pending Approvals
          </CardTitle>
          <span className="text-xs text-slate-400">
            {selected.length > 0 ? `${selected.length} selected` : `${items.length} in queue`}
          </span>
        </div>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked; }}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                  aria-label="Select all"
                />
              </th>
              {["Applicant", "ID Type", "Account", "Priority", "Wait Time", "Risk Score", "Submitted", ""].map(
                (h, i) => (
                  <th
                    key={i}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide",
                      i === 5 ? "text-right" : "text-left"
                    )}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "border-b border-slate-50 dark:border-slate-700/50 transition-colors",
                  selected.includes(item.id)
                    ? "bg-blue-50/60 dark:bg-blue-900/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                )}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => onToggleOne(item.id)}
                    className="rounded border-slate-300 text-blue-600"
                    aria-label={`Select ${item.name}`}
                  />
                </td>

                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800 dark:text-slate-100">{item.name}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.userId}</div>
                </td>

                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.idType}</td>

                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.accountType}</td>

                <td className="px-4 py-3">
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", PRIORITY_BADGE[item.priority])}>
                    {item.priority}
                  </span>
                </td>

                <td className="px-4 py-3 font-mono text-sm text-slate-700 dark:text-slate-300">
                  {item.waitTime}
                </td>

                <td className="px-4 py-3 text-right">
                  <span className={cn("font-mono font-bold text-sm", RiskColour(item.riskScore))}>
                    {item.riskScore}
                  </span>
                  <span className="text-xs text-slate-400 ml-0.5">/100</span>
                </td>

                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                  {item.submittedAt}
                </td>

                <td className="px-4 py-3">
                  <Link href={`/kyc/review/${item.id}`}>
                    <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                      <Eye className="w-3 h-3" />
                      Review
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ── Joint KYC queue ─────────────────────────────────────────── */
function JointQueue({ items }: { items: JointKYCRecord[] }) {
  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
          Joint Account KYC — Co-holder Verification
        </CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
              {["Primary Holder", "Secondary Holder", "Primary KYC", "Secondary KYC", "Consent", "Submitted", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800 dark:text-slate-100">{item.primaryHolder.name}</div>
                  <div className="text-xs text-slate-400">{item.primaryHolder.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800 dark:text-slate-100">{item.secondaryHolder.name}</div>
                  <div className="text-xs text-slate-400">{item.secondaryHolder.email}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.primaryKYCStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.secondaryKYCStatus} />
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    item.consentSigned ? "badge-success" : "badge-warning"
                  )}>
                    {item.consentSigned ? "Signed" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{item.submittedAt}</td>
                <td className="px-4 py-3">
                  <Link href="/kyc/joint-junior">
                    <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                      <Eye className="w-3 h-3" />
                      Review
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ── Junior KYC queue ────────────────────────────────────────── */
function JuniorQueue({ items }: { items: JuniorKYCRecord[] }) {
  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
          Junior Account KYC — Guardian Verification
        </CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
              {["Minor", "Guardian", "Guardian KYC", "Relationship Proof", "Parental Consent", "Submitted", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800 dark:text-slate-100">{item.minor.name}</div>
                  <div className="text-xs text-slate-400">Minor</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800 dark:text-slate-100">{item.guardian.name}</div>
                  <div className="text-xs text-slate-400">{item.guardian.email}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.guardianKYCStatus} />
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    item.relationshipProof ? "badge-success" : "badge-warning"
                  )}>
                    {item.relationshipProof ? "Uploaded" : "Missing"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    item.parentalConsentSigned ? "badge-success" : "badge-warning"
                  )}>
                    {item.parentalConsentSigned ? "Signed" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{item.submittedAt}</td>
                <td className="px-4 py-3">
                  <Link href="/kyc/joint-junior">
                    <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                      <Eye className="w-3 h-3" />
                      Review
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}