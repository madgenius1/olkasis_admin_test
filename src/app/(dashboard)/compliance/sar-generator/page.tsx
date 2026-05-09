"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Scale, CheckCircle2, ChevronRight, ChevronLeft,
  User, FileText, BookOpen, Send, Eye,
  AlertTriangle, Clock, Archive, Plus,
} from "lucide-react";

import { MOCK_STR_RECORDS, MOCK_AML_ALERTS, MOCK_USERS } from "../../../../lib/mockData";
import { formatKSh, cn } from "../../../../lib/utils";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogBody, DialogFooter,
} from "../../../../components/ui/dialog";

import type { STRRecord, AMLAlert, PlatformUser } from "../../../../types/index";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type WizardStep = 1 | 2 | 3 | 4;

interface STRDraft {
  /* Step 1 — Subject */
  alertId:     string;
  userId:      string;
  subjectName: string;
  subjectId:   string;
  subjectDob:  string;
  subjectAddr: string;
  subjectPhone:string;
  subjectEmail:string;
  /* Step 2 — Transactions */
  transactions: {
    ref:    string;
    date:   string;
    type:   string;
    amount: number;
    desc:   string;
  }[];
  /* Step 3 — Narrative */
  suspiciousActivity: string;
  regulatoryBasis:    string;
  narrative:          string;
  /* Step 4 — Review */
  referenceNumber: string;
}

const REGULATORY_BASIS_OPTIONS = [
  "Proceeds of Crime and Anti-Money Laundering Act (POCAMLA) s.44",
  "Financial Reporting Centre Act — suspicious transaction",
  "CBK Prudential Guideline CBK/PG/21",
  "CMA Kenya — market manipulation suspicion",
  "FATF Recommendation 20 — suspicious transaction report",
] as const;

/* ─────────────────────────────────────────────────────────────
   STEP INDICATOR
───────────────────────────────────────────────────────────── */
const STEPS = [
  { step: 1 as WizardStep, label: "Subject",       icon: User },
  { step: 2 as WizardStep, label: "Transactions",  icon: FileText },
  { step: 3 as WizardStep, label: "Narrative",     icon: BookOpen },
  { step: 4 as WizardStep, label: "Review & Submit", icon: Send },
] as const;

function StepIndicator({ current }: { current: WizardStep }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map(({ step, label, icon: Icon }, i) => {
        const done    = step < current;
        const active  = step === current;
        const pending = step > current;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all",
                  done    && "bg-emerald-600 border-emerald-600 text-white",
                  active  && "bg-blue-700 border-blue-700 text-white shadow-md shadow-blue-200",
                  pending && "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400"
                )}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block whitespace-nowrap",
                  active  && "text-blue-700 dark:text-blue-400",
                  done    && "text-emerald-700 dark:text-emerald-400",
                  pending && "text-slate-400"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mt-[-18px]",
                  step < current
                    ? "bg-emerald-500"
                    : "bg-slate-200 dark:bg-slate-700"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STR WIZARD
───────────────────────────────────────────────────────────── */
function STRWizard({
  prefillAlertId,
  prefillUserId,
  onComplete,
}: {
  prefillAlertId: string;
  prefillUserId:  string;
  onComplete:     (str: Omit<STRRecord, "id">) => void;
}) {
  const prefillAlert = MOCK_AML_ALERTS.find((a) => a.id === prefillAlertId);
  const prefillUser  = MOCK_USERS.find((u) => u.id === prefillUserId);

  const [step, setStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<STRDraft>({
    alertId:      prefillAlertId,
    userId:       prefillUserId,
    subjectName:  prefillUser?.name  ?? prefillAlert?.user ?? "",
    subjectId:    prefillUser?.id    ?? "",
    subjectDob:   "",
    subjectAddr:  prefillUser?.location ? `${prefillUser.location}, Kenya` : "",
    subjectPhone: prefillUser?.phone ?? "",
    subjectEmail: prefillUser?.email ?? "",
    transactions: prefillAlert
      ? [{
          ref:    "TXN-AUTO",
          date:   prefillAlert.timestamp,
          type:   prefillAlert.type,
          amount: prefillAlert.amount,
          desc:   `${prefillAlert.type} — auto-linked from alert ${prefillAlert.id}`,
        }]
      : [{ ref: "", date: "", type: "", amount: 0, desc: "" }],
    suspiciousActivity: prefillAlert?.type ?? "",
    regulatoryBasis:    "",
    narrative: prefillAlert
      ? `On ${prefillAlert.timestamp}, an alert was triggered for ${prefillAlert.user} involving a ${prefillAlert.type.toLowerCase()} of ${formatKSh(prefillAlert.amount)}. The transaction exceeded the regulatory threshold and displays indicators of suspicious activity consistent with ${prefillAlert.type.toLowerCase()} patterns.\n\nThis report is filed in accordance with the Proceeds of Crime and Anti-Money Laundering Act.`
      : "",
    referenceNumber: `CBK-STR-2024-${String(Math.floor(Math.random() * 900) + 100).padStart(4, "0")}`,
  });

  const update = <K extends keyof STRDraft>(key: K, value: STRDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const updateTx = (idx: number, field: string, value: string | number) =>
    setDraft((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx, i) =>
        i === idx ? { ...tx, [field]: value } : tx
      ),
    }));

  const addTx = () =>
    setDraft((prev) => ({
      ...prev,
      transactions: [
        ...prev.transactions,
        { ref: "", date: "", type: "", amount: 0, desc: "" },
      ],
    }));

  const removeTx = (idx: number) =>
    setDraft((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((_, i) => i !== idx),
    }));

  const canAdvance = (): boolean => {
    if (step === 1) return !!draft.subjectName && !!draft.subjectId;
    if (step === 2) return draft.transactions.length > 0 && draft.transactions.every((t) => !!t.ref && t.amount > 0);
    if (step === 3) return !!draft.narrative && !!draft.regulatoryBasis;
    return true;
  };

  const handleSubmit = () => {
    onComplete({
      alertId:        draft.alertId,
      subject:        draft.subjectName,
      userId:         draft.userId,
      transactionIds: draft.transactions.map((t) => t.ref),
      narrative:      draft.narrative,
      status:         "submitted",
      submittedAt:    new Date().toISOString(),
      referenceNumber: draft.referenceNumber,
      submittedBy:    "Sarah Kimani",
    });
  };

  return (
    <div>
      <StepIndicator current={step} />

      {/* ── Step 1: Subject ── */}
      {step === 1 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Subject Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {prefillAlert && (
              <div className="mb-5 flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    Pre-filled from AML Alert {prefillAlert.id}
                  </p>
                  <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                    {prefillAlert.type} · {formatKSh(prefillAlert.amount)} · {prefillAlert.timestamp}
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: "subjectName",  label: "Full Name *",      placeholder: "As on national ID",     field: "subjectName" },
                { id: "subjectId",    label: "Zanari ID / User ID *", placeholder: "USR001",            field: "subjectId" },
                { id: "subjectDob",   label: "Date of Birth",    placeholder: "YYYY-MM-DD",             field: "subjectDob" },
                { id: "subjectAddr",  label: "Address",          placeholder: "Nairobi, Kenya",         field: "subjectAddr" },
                { id: "subjectPhone", label: "Phone Number",     placeholder: "+254 7XX XXX XXX",       field: "subjectPhone" },
                { id: "subjectEmail", label: "Email Address",    placeholder: "user@example.com",       field: "subjectEmail" },
              ].map(({ id, label, placeholder, field }) => (
                <div key={id} className="space-y-1.5">
                  <Label htmlFor={id}>{label}</Label>
                  <Input
                    id={id}
                    placeholder={placeholder}
                    value={(draft as Record<string, unknown>)[field] as string}
                    onChange={(e) => update(field as keyof STRDraft, e.target.value as never)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Transactions ── */}
      {step === 2 && (
        <div className="space-y-4">
          {draft.transactions.map((tx, idx) => (
            <Card key={idx} className="shadow-sm">
              <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between pb-0">
                  <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Transaction #{idx + 1}
                    {idx === 0 && prefillAlert && (
                      <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                        AUTO-LINKED
                      </span>
                    )}
                  </CardTitle>
                  {draft.transactions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-500 hover:text-red-700"
                      onClick={() => removeTx(idx)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Transaction Ref *</Label>
                    <Input
                      placeholder="MPE240413001"
                      value={tx.ref}
                      onChange={(e) => updateTx(idx, "ref", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date & Time *</Label>
                    <Input
                      type="datetime-local"
                      value={tx.date.replace(" ", "T").slice(0, 16)}
                      onChange={(e) => updateTx(idx, "date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Transaction Type *</Label>
                    <Select
                      value={tx.type}
                      onValueChange={(v) => updateTx(idx, "type", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type…" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Deposit", "Withdrawal", "Transfer", "P2P", "Trade", "Large Transaction", "Circular Transfer", "Structuring"].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Amount (KES) *</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={tx.amount || ""}
                      onChange={(e) => updateTx(idx, "amount", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Brief description of the transaction…"
                      value={tx.desc}
                      onChange={(e) => updateTx(idx, "desc", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={addTx}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Another Transaction
          </Button>
        </div>
      )}

      {/* ── Step 3: Narrative ── */}
      {step === 3 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Suspicious Activity Narrative
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="suspicious-activity">Suspicious Activity Type *</Label>
              <Input
                id="suspicious-activity"
                placeholder="e.g. Large Transaction, Circular Transfer, Structuring…"
                value={draft.suspiciousActivity}
                onChange={(e) => update("suspiciousActivity", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="regulatory-basis">Regulatory Basis *</Label>
              <Select
                value={draft.regulatoryBasis}
                onValueChange={(v) => update("regulatoryBasis", v)}
              >
                <SelectTrigger id="regulatory-basis">
                  <SelectValue placeholder="Select applicable regulation…" />
                </SelectTrigger>
                <SelectContent>
                  {REGULATORY_BASIS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="narrative">Full Narrative *</Label>
                <span className="text-xs text-slate-400">
                  {draft.narrative.length} chars
                </span>
              </div>
              <Textarea
                id="narrative"
                placeholder="Describe the suspicious activity in full. Include: date/time, sequence of events, why this is suspicious, and any corroborating evidence…"
                value={draft.narrative}
                onChange={(e) => update("narrative", e.target.value)}
                rows={10}
                className="font-mono text-xs leading-relaxed"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Minimum 200 characters recommended. Use clear, factual language. Avoid speculation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 4: Review & Submit ── */}
      {step === 4 && (
        <div className="space-y-4">
          {/* Reference number */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Scale className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                STR Reference Number
              </p>
              <p className="font-mono text-lg font-bold text-blue-700 dark:text-blue-400 mt-0.5">
                {draft.referenceNumber}
              </p>
            </div>
          </div>

          {/* Subject summary */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 pb-0">
                Subject Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-0">
              {[
                { label: "Name",    value: draft.subjectName },
                { label: "User ID", value: draft.subjectId },
                { label: "Phone",   value: draft.subjectPhone || "—" },
                { label: "Email",   value: draft.subjectEmail || "—" },
                { label: "Address", value: draft.subjectAddr  || "—" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                >
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Transactions summary */}
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 pb-3">
                Linked Transactions ({draft.transactions.length})
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700">
                    {["Ref", "Date", "Type", "Amount", "Description"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {draft.transactions.map((tx, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">{tx.ref}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{tx.date}</td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{tx.type}</td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-slate-800 dark:text-slate-100">{formatKSh(tx.amount)}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[200px] truncate">{tx.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Narrative preview */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 pb-0">
                Narrative Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {draft.narrative}
              </pre>
            </CardContent>
          </Card>

          {/* Submission confirmation */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            By submitting this STR, you confirm that the information provided is accurate and complete to the best of your knowledge, and that this report is filed in accordance with the Proceeds of Crime and Anti-Money Laundering Act (POCAMLA) and Financial Reporting Centre Act obligations.
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1) as WizardStep)}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back
        </Button>

        <div className="flex items-center gap-1">
          {STEPS.map(({ step: s }) => (
            <div
              key={s}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                s === step
                  ? "bg-blue-600"
                  : s < step
                  ? "bg-emerald-500"
                  : "bg-slate-200 dark:bg-slate-600"
              )}
            />
          ))}
        </div>

        {step < 4 ? (
          <Button
            size="sm"
            className="gap-1.5 text-xs bg-blue-700 hover:bg-blue-800"
            disabled={!canAdvance()}
            onClick={() => setStep((s) => Math.min(4, s + 1) as WizardStep)}
          >
            Continue
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmit}
          >
            <Send className="w-3.5 h-3.5" />
            Submit STR to CBK
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE (wrapped in Suspense for useSearchParams)
───────────────────────────────────────────────────────────── */
function STRGeneratorContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const prefillAlert  = searchParams.get("alertId")  ?? "";
  const prefillUser   = searchParams.get("userId")   ?? "";

  const [view,      setView]      = useState<"wizard" | "archive">("wizard");
  const [strList,   setStrList]   = useState<STRRecord[]>(MOCK_STR_RECORDS);
  const [submitted, setSubmitted] = useState(false);
  const [newRef,    setNewRef]    = useState("");
  const [previewStr, setPreviewStr] = useState<STRRecord | null>(null);

  const handleComplete = (draft: Omit<STRRecord, "id">) => {
    const newStr: STRRecord = {
      id: `STR${String(strList.length + 1).padStart(3, "0")}`,
      ...draft,
    };
    setStrList((prev) => [newStr, ...prev]);
    setNewRef(newStr.referenceNumber ?? "");
    setSubmitted(true);
    toast.success(`STR ${newStr.id} submitted — Ref: ${newStr.referenceNumber}`);
  };

  if (submitted) {
    return (
      <div className="space-y-5 animate-fade-in">
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          STR Generator
        </h1>
        <Card className="shadow-sm">
          <CardContent className="py-12 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                STR Submitted Successfully
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Reference:{" "}
                <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                  {newRef}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => { setSubmitted(false); setView("archive"); }}
              >
                <Archive className="w-3.5 h-3.5" />
                View Archive
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-blue-700 hover:bg-blue-800"
                onClick={() => { setSubmitted(false); setView("wizard"); }}
              >
                <Plus className="w-3.5 h-3.5" />
                New STR
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            STR Generator
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Suspicious Transaction Report — CBK / FRC filing
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={view === "archive" ? "default" : "outline"}
            size="sm"
            className={cn("gap-1.5 h-8 text-xs", view === "archive" && "bg-blue-700")}
            onClick={() => setView(view === "archive" ? "wizard" : "archive")}
          >
            {view === "archive" ? (
              <>
                <Plus className="w-3.5 h-3.5" />
                New STR
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5" />
                View Archive ({strList.length})
              </>
            )}
          </Button>
        </div>
      </div>

      {view === "wizard" ? (
        <STRWizard
          prefillAlertId={prefillAlert}
          prefillUserId={prefillUser}
          onComplete={handleComplete}
        />
      ) : (
        /* ── STR Archive ── */
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
              Filed STRs — Archive
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                  {["STR ID", "Subject", "Alert Ref", "Reference No.", "Status", "Submitted", "Submitted By", ""].map(
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
                {strList.map((str) => (
                  <tr
                    key={str.id}
                    className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {str.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {str.subject}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {str.alertId || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {str.referenceNumber ?? "Draft"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={str.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {str.submittedAt
                        ? new Date(str.submittedAt).toLocaleDateString("en-KE")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                      {str.submittedBy}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => setPreviewStr(str)}
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── STR Preview modal ── */}
      {previewStr && (
        <Dialog open onOpenChange={() => setPreviewStr(null)}>
          <DialogContent size="max-w-lg">
            <DialogHeader>
              <DialogTitle>STR — {previewStr.id}</DialogTitle>
              <DialogDescription>
                Reference: {previewStr.referenceNumber ?? "Draft"}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-3">
              {[
                { label: "Subject",       value: previewStr.subject },
                { label: "Alert Ref",     value: previewStr.alertId || "—" },
                { label: "Transactions",  value: previewStr.transactionIds.join(", ") },
                { label: "Status",        value: previewStr.status },
                { label: "Submitted By",  value: previewStr.submittedBy },
                { label: "Submitted At",  value: previewStr.submittedAt
                  ? new Date(previewStr.submittedAt).toLocaleString("en-KE")
                  : "Draft" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 py-2 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                >
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100 text-right capitalize">
                    {value}
                  </span>
                </div>
              ))}
              <div className="pt-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Narrative
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {previewStr.narrative}
                  </pre>
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setPreviewStr(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function STRGeneratorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    }>
      <STRGeneratorContent />
    </Suspense>
  );
}