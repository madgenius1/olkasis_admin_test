"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  FileText, Users, Baby, Shield, User, Mail,
  Phone, Download, ZoomIn, RotateCw, Clock,
} from "lucide-react";

import { MOCK_JOINT_KYC, MOCK_JUNIOR_KYC } from "../../../../lib/mockData";
import { cn } from "../../../../lib/utils";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Button } from "../../../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogBody, DialogFooter,
} from "../../../../components/ui/dialog";

import type { JointKYCRecord, JuniorKYCRecord, KYCStatus } from "../../../../types/index";

/* ─────────────────────────────────────────────────────────────
   LOCAL TYPES
───────────────────────────────────────────────────────────── */
type RejectReason =
  | "blurry"
  | "expired"
  | "mismatch"
  | "incomplete"
  | "suspicious"
  | "no_consent";

interface RecordVerdict {
  status:  "approved" | "rejected" | null;
  reason?: string;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const REJECT_REASONS: { value: RejectReason; label: string }[] = [
  { value: "blurry",     label: "Document image is blurry or unclear" },
  { value: "expired",    label: "Document has expired" },
  { value: "mismatch",   label: "Name or details mismatch" },
  { value: "incomplete", label: "Incomplete submission" },
  { value: "suspicious", label: "Suspicious or altered document" },
  { value: "no_consent", label: "Consent form not signed" },
];

/* ─────────────────────────────────────────────────────────────
   SHARED SUB-COMPONENTS
───────────────────────────────────────────────────────────── */

/** Holder info field row */
function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={cn(
          "text-sm font-medium text-slate-800 dark:text-slate-100",
          mono && "font-mono"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** KYC status check row */
function CheckRow({
  label,
  value,
  passed,
}: {
  label:  string;
  value:  string;
  passed: boolean | null; // null = neutral
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "text-sm font-semibold",
            passed === true  && "text-emerald-700 dark:text-emerald-400",
            passed === false && "text-red-700 dark:text-red-400",
            passed === null  && "text-amber-700 dark:text-amber-400"
          )}
        >
          {value}
        </span>
        <span
          className={cn(
            "w-2.5 h-2.5 rounded-full shrink-0",
            passed === true  && "bg-emerald-500",
            passed === false && "bg-red-500",
            passed === null  && "bg-amber-500"
          )}
        />
      </div>
    </div>
  );
}

/** Compact document placeholder */
function DocPlaceholder({
  label,
  sublabel,
  onZoom,
}: {
  label:    string;
  sublabel: string;
  onZoom:   () => void;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {label}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={onZoom}
              aria-label={`Zoom ${label}`}
            >
              <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              aria-label={`Rotate ${label}`}
              onClick={() => toast.info("Document rotated")}
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-400" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              aria-label={`Download ${label}`}
              onClick={() => toast.info("Download started")}
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <button
          className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl h-40 flex flex-col items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors group"
          onClick={onZoom}
          aria-label={`View ${label} full resolution`}
        >
          <FileText className="w-8 h-8 text-slate-400 group-hover:text-slate-500 mb-2 transition-colors" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{sublabel}</p>
          <p className="text-xs text-slate-400 mt-1">Click to view full resolution</p>
        </button>
      </CardContent>
    </Card>
  );
}

/** Verdict action strip */
function VerdictStrip({
  recordId,
  name,
  verdict,
  onApprove,
  onReject,
}: {
  recordId: string;
  name:     string;
  verdict:  RecordVerdict;
  onApprove: (id: string) => void;
  onReject:  (id: string, name: string) => void;
}) {
  if (verdict.status === "approved") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          Approved — {name}
        </span>
      </div>
    );
  }

  if (verdict.status === "rejected") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
        <span className="text-sm font-semibold text-red-700 dark:text-red-400">
          Rejected — {name}
        </span>
        {verdict.reason && (
          <span className="text-xs text-red-500 ml-1">({verdict.reason})</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => onApprove(recordId)}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
        onClick={() => onReject(recordId, name)}
      >
        <XCircle className="w-3.5 h-3.5" />
        Reject
      </Button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   JOINT KYC TAB
───────────────────────────────────────────────────────────── */
function JointKYCTab() {
  const [verdicts, setVerdicts] = useState<Record<string, RecordVerdict>>(
    () => Object.fromEntries(MOCK_JOINT_KYC.map((r) => [r.id, { status: null }]))
  );
  const [rejectTarget, setRejectTarget]   = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason]   = useState<RejectReason | "">("");
  const [rejectNote,   setRejectNote]     = useState("");
  const [zoomOpen,     setZoomOpen]       = useState(false);
  const [zoomLabel,    setZoomLabel]      = useState("");

  const openZoom = (label: string) => { setZoomLabel(label); setZoomOpen(true); };

  const handleApprove = (id: string) => {
    setVerdicts((v) => ({ ...v, [id]: { status: "approved" } }));
    const rec = MOCK_JOINT_KYC.find((r) => r.id === id);
    toast.success(`Joint KYC approved — ${rec?.primaryHolder.name}`);
  };

  const openReject = (id: string, name: string) => {
    setRejectTarget({ id, name });
    setRejectReason("");
    setRejectNote("");
  };

  const confirmReject = () => {
    if (!rejectTarget || !rejectReason) {
      toast.error("Please select a rejection reason");
      return;
    }
    const reasonLabel =
      REJECT_REASONS.find((r) => r.value === rejectReason)?.label ?? rejectReason;
    setVerdicts((v) => ({
      ...v,
      [rejectTarget.id]: { status: "rejected", reason: reasonLabel },
    }));
    toast.error(`Joint KYC rejected — ${rejectTarget.name}`);
    setRejectTarget(null);
  };

  return (
    <>
      <div className="space-y-8">
        {MOCK_JOINT_KYC.map((record, idx) => {
          const verdict = verdicts[record.id] ?? { status: null };

          return (
            <Card key={record.id} className="shadow-sm overflow-hidden">
              {/* Record header */}
              <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Joint Account — Record {idx + 1}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        <span className="font-mono">{record.id}</span>
                        {" · "}
                        Submitted {record.submittedAt}
                      </p>
                    </div>
                  </div>

                  {/* Overall status chips */}
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full border",
                      record.consentSigned
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                        : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                    )}>
                      {record.consentSigned ? "Consent Signed" : "Consent Pending"}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-5 space-y-5">
                {/* Side-by-side holder sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* Primary holder */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Primary Holder
                      </span>
                      <StatusBadge status={record.primaryKYCStatus} size="sm" />
                    </div>

                    <Card className="shadow-none border-slate-200 dark:border-slate-600">
                      <CardContent className="p-4">
                        <InfoRow label="Full Name" value={record.primaryHolder.name} />
                        <InfoRow label="Email"     value={record.primaryHolder.email ?? "—"} />
                        <InfoRow label="Phone"     value={record.primaryHolder.phone ?? "—"} />
                        <InfoRow label="Location"  value={record.primaryHolder.location ?? "—"} />
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-sm text-slate-500">KYC Status</span>
                          <StatusBadge status={record.primaryKYCStatus} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Primary docs */}
                    <DocPlaceholder
                      label="Primary — National ID"
                      sublabel="ID Document (Front)"
                      onZoom={() => openZoom("Primary Holder — National ID")}
                    />
                  </div>

                  {/* Secondary holder */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Secondary Holder
                      </span>
                      <StatusBadge status={record.secondaryKYCStatus} size="sm" />
                    </div>

                    <Card className="shadow-none border-slate-200 dark:border-slate-600">
                      <CardContent className="p-4">
                        <InfoRow label="Full Name" value={record.secondaryHolder.name   ?? "—"} />
                        <InfoRow label="Email"     value={record.secondaryHolder.email  ?? "—"} />
                        <InfoRow label="Phone"     value={record.secondaryHolder.phone  ?? "—"} />
                        <InfoRow label="Location"  value="—" />
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-sm text-slate-500">KYC Status</span>
                          <StatusBadge status={record.secondaryKYCStatus} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Secondary docs */}
                    <DocPlaceholder
                      label="Secondary — National ID"
                      sublabel="ID Document (Front)"
                      onZoom={() => openZoom("Secondary Holder — National ID")}
                    />
                  </div>
                </div>

                {/* Verification checks */}
                <Card className="shadow-none border-slate-200 dark:border-slate-600">
                  <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 pb-3">
                      Joint Account Verification Checks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                      <div>
                        <CheckRow label="Primary OCR Match"        value="98% confidence"         passed={true} />
                        <CheckRow label="Primary Liveness Check"   value="Passed"                 passed={true} />
                        <CheckRow label="Secondary OCR Match"      value={record.secondaryKYCStatus === "rejected" ? "Failed" : "Pending"} passed={record.secondaryKYCStatus !== "rejected"} />
                        <CheckRow label="Secondary Liveness Check" value={record.secondaryKYCStatus === "pending"  ? "Pending" : "Failed"} passed={null} />
                      </div>
                      <div>
                        <CheckRow label="Consent Form Signed"      value={record.consentSigned ? "Signed" : "Not signed"} passed={record.consentSigned} />
                        <CheckRow label="Duplicate Check"          value="No duplicates"          passed={true} />
                        <CheckRow label="Sanctions Screening"      value="Clear"                  passed={true} />
                        <CheckRow label="Risk Score"               value="8 / 100"                passed={true} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Consent document */}
                <DocPlaceholder
                  label="Joint Account Consent Form"
                  sublabel="Signed consent — both holders"
                  onZoom={() => openZoom("Joint Account Consent Form")}
                />

                {/* Action strip */}
                <div className="pt-1">
                  <VerdictStrip
                    recordId={record.id}
                    name={record.primaryHolder.name}
                    verdict={verdict}
                    onApprove={handleApprove}
                    onReject={openReject}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent size="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Reject Joint KYC
            </DialogTitle>
            <DialogDescription>
              Rejecting{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {rejectTarget?.name}
              </span>
              's joint KYC application.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="joint-reject-reason">Rejection Reason</Label>
              <Select
                value={rejectReason}
                onValueChange={(v) => setRejectReason(v as RejectReason)}
              >
                <SelectTrigger id="joint-reject-reason">
                  <SelectValue placeholder="Select a reason…" />
                </SelectTrigger>
                <SelectContent>
                  {REJECT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="joint-reject-note">
                Notes{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="joint-reject-note"
                placeholder="Additional context for the applicant…"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={confirmReject} className="gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zoom dialog */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent size="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{zoomLabel}</DialogTitle>
            <DialogDescription>Full-resolution document preview</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-xl h-72 flex flex-col items-center justify-center">
              <FileText className="w-14 h-14 text-slate-400 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{zoomLabel}</p>
              <p className="text-xs text-slate-400 mt-1">
                Backend integration will render the actual document here
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setZoomOpen(false)}>Close</Button>
            <Button size="sm" className="gap-1.5" onClick={() => toast.info("Download started")}>
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   JUNIOR KYC TAB
───────────────────────────────────────────────────────────── */
function JuniorKYCTab() {
  const [verdicts, setVerdicts] = useState<Record<string, RecordVerdict>>(
    () => Object.fromEntries(MOCK_JUNIOR_KYC.map((r) => [r.id, { status: null }]))
  );
  const [rejectTarget, setRejectTarget]   = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason]   = useState<RejectReason | "">("");
  const [rejectNote,   setRejectNote]     = useState("");
  const [zoomOpen,     setZoomOpen]       = useState(false);
  const [zoomLabel,    setZoomLabel]      = useState("");

  const openZoom = (label: string) => { setZoomLabel(label); setZoomOpen(true); };

  const handleApprove = (id: string) => {
    setVerdicts((v) => ({ ...v, [id]: { status: "approved" } }));
    const rec = MOCK_JUNIOR_KYC.find((r) => r.id === id);
    toast.success(`Junior KYC approved — ${rec?.minor.name}`);
  };

  const openReject = (id: string, name: string) => {
    setRejectTarget({ id, name });
    setRejectReason("");
    setRejectNote("");
  };

  const confirmReject = () => {
    if (!rejectTarget || !rejectReason) {
      toast.error("Please select a rejection reason");
      return;
    }
    const reasonLabel =
      REJECT_REASONS.find((r) => r.value === rejectReason)?.label ?? rejectReason;
    setVerdicts((v) => ({
      ...v,
      [rejectTarget.id]: { status: "rejected", reason: reasonLabel },
    }));
    toast.error(`Junior KYC rejected — ${rejectTarget.name}`);
    setRejectTarget(null);
  };

  return (
    <>
      <div className="space-y-8">
        {MOCK_JUNIOR_KYC.map((record, idx) => {
          const verdict = verdicts[record.id] ?? { status: null };

          return (
            <Card key={record.id} className="shadow-sm overflow-hidden">
              {/* Record header */}
              <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
                      <Baby className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Junior Account — Record {idx + 1}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        <span className="font-mono">{record.id}</span>
                        {" · "}
                        Submitted {record.submittedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full border",
                      record.parentalConsentSigned
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                        : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                    )}>
                      {record.parentalConsentSigned ? "Consent Signed" : "Consent Pending"}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-5 space-y-5">
                {/* Minor + Guardian side-by-side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* Minor info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center">
                        <Baby className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Minor (Account Holder)
                      </span>
                    </div>

                    <Card className="shadow-none border-slate-200 dark:border-slate-600">
                      <CardContent className="p-4">
                        <InfoRow label="Full Name"    value={record.minor.name  ?? "—"} />
                        <InfoRow label="Phone"        value={record.minor.phone ?? "—"} />
                        <InfoRow label="Account Type" value="Junior" />
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-sm text-slate-500">KYC Status</span>
                          <StatusBadge status={record.minor.kycStatus as KYCStatus ?? "pending"} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Minor birth certificate */}
                    <DocPlaceholder
                      label="Minor — Birth Certificate"
                      sublabel="Required for age verification"
                      onZoom={() => openZoom("Minor — Birth Certificate")}
                    />
                  </div>

                  {/* Guardian info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Guardian / Parent
                      </span>
                      <StatusBadge status={record.guardianKYCStatus} size="sm" />
                    </div>

                    <Card className="shadow-none border-slate-200 dark:border-slate-600">
                      <CardContent className="p-4">
                        <InfoRow label="Full Name" value={record.guardian.name} />
                        <InfoRow label="Email"     value={record.guardian.email} />
                        <InfoRow label="Phone"     value={record.guardian.phone} />
                        <InfoRow label="Location"  value={record.guardian.location ?? "—"} />
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-sm text-slate-500">Guardian KYC</span>
                          <StatusBadge status={record.guardianKYCStatus} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Guardian ID */}
                    <DocPlaceholder
                      label="Guardian — National ID"
                      sublabel="Guardian identity verification"
                      onZoom={() => openZoom("Guardian — National ID")}
                    />
                  </div>
                </div>

                {/* Verification checks */}
                <Card className="shadow-none border-slate-200 dark:border-slate-600">
                  <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 pb-3">
                      Junior Account Verification Checks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                      <div>
                        <CheckRow label="Guardian OCR Match"       value="97% confidence"                                   passed={true} />
                        <CheckRow label="Guardian Liveness Check"  value="Passed"                                            passed={true} />
                        <CheckRow label="Birth Certificate"        value={record.minor.name ? "Uploaded" : "Missing"}        passed={!!record.minor.name} />
                        <CheckRow label="Age Verification"         value="Minor confirmed (< 18)"                           passed={true} />
                      </div>
                      <div>
                        <CheckRow label="Relationship Proof"       value={record.relationshipProof ? "Uploaded" : "Missing"} passed={record.relationshipProof} />
                        <CheckRow label="Parental Consent"         value={record.parentalConsentSigned ? "Signed" : "Pending"} passed={record.parentalConsentSigned ? true : null} />
                        <CheckRow label="Duplicate Check"          value="No duplicates"                                     passed={true} />
                        <CheckRow label="Guardian Risk Score"      value="5 / 100"                                           passed={true} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Supporting documents */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DocPlaceholder
                    label="Relationship Proof"
                    sublabel={record.relationshipProof ? "Document uploaded" : "Not uploaded yet"}
                    onZoom={() => openZoom("Relationship Proof Document")}
                  />
                  <DocPlaceholder
                    label="Parental Consent Form"
                    sublabel={record.parentalConsentSigned ? "Signed and uploaded" : "Not signed yet"}
                    onZoom={() => openZoom("Parental Consent Form")}
                  />
                </div>

                {/* Missing items notice */}
                {(!record.relationshipProof || !record.parentalConsentSigned) && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-amber-800 dark:text-amber-300">
                        Missing required documents
                      </p>
                      <ul className="mt-1 list-disc list-inside text-amber-700 dark:text-amber-400 text-xs space-y-0.5">
                        {!record.relationshipProof    && <li>Relationship proof not uploaded</li>}
                        {!record.parentalConsentSigned && <li>Parental consent form not signed</li>}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Action strip */}
                <div className="pt-1">
                  <VerdictStrip
                    recordId={record.id}
                    name={record.minor.name ?? "Minor"}
                    verdict={verdict}
                    onApprove={handleApprove}
                    onReject={openReject}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent size="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Reject Junior KYC
            </DialogTitle>
            <DialogDescription>
              Rejecting the junior KYC for{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {rejectTarget?.name}
              </span>
              . The guardian will be notified.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="junior-reject-reason">Rejection Reason</Label>
              <Select
                value={rejectReason}
                onValueChange={(v) => setRejectReason(v as RejectReason)}
              >
                <SelectTrigger id="junior-reject-reason">
                  <SelectValue placeholder="Select a reason…" />
                </SelectTrigger>
                <SelectContent>
                  {REJECT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="junior-reject-note">
                Notes{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="junior-reject-note"
                placeholder="Additional context for the guardian…"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={confirmReject} className="gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zoom dialog */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent size="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{zoomLabel}</DialogTitle>
            <DialogDescription>Full-resolution document preview</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-xl h-72 flex flex-col items-center justify-center">
              <FileText className="w-14 h-14 text-slate-400 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{zoomLabel}</p>
              <p className="text-xs text-slate-400 mt-1">
                Backend integration will render the actual document here
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setZoomOpen(false)}>Close</Button>
            <Button size="sm" className="gap-1.5" onClick={() => toast.info("Download started")}>
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function JointJuniorKYCPage() {
  const [activeTab, setActiveTab] = useState("joint");

  const pendingJoint  = MOCK_JOINT_KYC.length;
  const pendingJunior = MOCK_JUNIOR_KYC.length;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-center gap-3">
          <Link href="/kyc">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs shrink-0">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to KYC Queue
            </Button>
          </Link>
        </div>
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Joint & Junior KYC Review
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {pendingJoint} joint · {pendingJunior} junior pending verification
          </p>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Joint Pending",  value: pendingJoint,  icon: Users, color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/40" },
          { label: "Junior Pending", value: pendingJunior, icon: Baby,  color: "text-sky-600",    bg: "bg-sky-50 dark:bg-sky-900/40" },
          { label: "Missing Consent",value: MOCK_JOINT_KYC.filter((r) => !r.consentSigned).length + MOCK_JUNIOR_KYC.filter((r) => !r.parentalConsentSigned).length, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/40" },
          { label: "Avg Wait Time",  value: "1.5h",       icon: Clock, color: "text-slate-600",  bg: "bg-slate-100 dark:bg-slate-700" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">
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
          <TabsTrigger value="joint" className="gap-1.5 text-sm">
            <Users className="w-3.5 h-3.5" />
            Joint Accounts
            {pendingJoint > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full leading-none">
                {pendingJoint}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="junior" className="gap-1.5 text-sm">
            <Baby className="w-3.5 h-3.5" />
            Junior Accounts
            {pendingJunior > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-sky-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                {pendingJunior}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="joint" className="mt-5">
          <JointKYCTab />
        </TabsContent>

        <TabsContent value="junior" className="mt-5">
          <JuniorKYCTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}