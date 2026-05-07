"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  FileText, ZoomIn, RotateCw, Download,
  ShieldCheck, Clock, User, MapPin, Phone, Mail,
} from "lucide-react";

import { MOCK_KYC_QUEUE } from "../../../../../lib/mockData";
import { cn } from "../../../../../lib/utils";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogBody, DialogFooter,
} from "../../../../../components/ui/dialog";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../../../components/ui/select";

import type { KYCQueueItem } from "../../../../../types/index";

/* ── Page props ─────────────────────────────────────────────── */
interface PageProps {
  params: Promise<{ kycId: string }>;
}

/* ── Verification check ─────────────────────────────────────── */
interface VerificationCheck {
  label:  string;
  value:  string;
  status: "pass" | "warn" | "fail";
}

const REJECT_REASONS = [
  { value: "blurry",      label: "Document image is blurry or unclear" },
  { value: "expired",     label: "Document has expired" },
  { value: "mismatch",    label: "Name or details mismatch" },
  { value: "incomplete",  label: "Incomplete submission" },
  { value: "suspicious",  label: "Suspicious or altered document" },
  { value: "wrong_doc",   label: "Wrong document type submitted" },
  { value: "low_quality", label: "Image quality too low for verification" },
] as const;

type RejectReason = typeof REJECT_REASONS[number]["value"];

/* ── Dot indicator ───────────────────────────────────────────── */
function VerificationDot({ status }: { status: "pass" | "warn" | "fail" }) {
  return (
    <span
      className={cn(
        "w-2.5 h-2.5 rounded-full shrink-0 inline-block",
        status === "pass" && "bg-emerald-500",
        status === "warn" && "bg-amber-500",
        status === "fail" && "bg-red-500"
      )}
    />
  );
}

/* ── Document panel ──────────────────────────────────────────── */
function DocPanel({
  title,
  sublabel,
  onZoom,
}: {
  title:    string;
  sublabel: string;
  onZoom:   () => void;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between pb-0">
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {title}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={onZoom}
              aria-label="Zoom document"
            >
              <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              aria-label="Rotate document"
              onClick={() => toast.info("Document rotated")}
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              aria-label="Download document"
              onClick={() => toast.info("Download started")}
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <button
          className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl h-52 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors group"
          onClick={onZoom}
          aria-label={`View ${title} full resolution`}
        >
          <FileText className="w-10 h-10 text-slate-400 group-hover:text-slate-500 transition-colors mb-2.5" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{sublabel}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Click to view full resolution</p>
        </button>
      </CardContent>
    </Card>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default async function KYCReviewPage({ params }: PageProps) {
  const { kycId } = await params;
  const item = MOCK_KYC_QUEUE.find((k) => k.id === kycId);
  if (!item) notFound();
  return <KYCReviewClient item={item} />;
}

/* ── Client component ────────────────────────────────────────── */
function KYCReviewClient({ item }: { item: KYCQueueItem }) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showZoom, setShowZoom]               = useState(false);
  const [zoomTitle, setZoomTitle]             = useState("");
  const [rejectReason, setRejectReason]       = useState<RejectReason | "">("");
  const [rejectNote, setRejectNote]           = useState("");
  const [requestNote, setRequestNote]         = useState("");
  const [resolved, setResolved]               = useState(false);
  const [verdict, setVerdict]                 = useState<"approved" | "rejected" | null>(null);

  /* Build verification checks from mock data */
  const checks: VerificationCheck[] = [
    { label: "OCR Data Match",        value: "98% confidence",   status: "pass" },
    { label: "Liveness Check",        value: "Passed",           status: "pass" },
    { label: "Smile ID Verification", value: "Verified",         status: "pass" },
    { label: "Duplicate Check",       value: "No duplicates",    status: "pass" },
    { label: "Sanctions Screening",   value: "Review required",  status: "warn" },
    {
      label:  "Risk Score",
      value:  `${item.riskScore} / 100`,
      status: item.riskScore > 15 ? "fail" : item.riskScore > 8 ? "warn" : "pass",
    },
  ];

  const handleApprove = () => {
    setVerdict("approved");
    setResolved(true);
    toast.success(`KYC approved for ${item.name}`);
  };

  const handleReject = () => {
    if (!rejectReason) {
      toast.error("Please select a rejection reason");
      return;
    }
    setShowRejectDialog(false);
    setVerdict("rejected");
    setResolved(true);
    toast.error(`KYC rejected for ${item.name}`);
  };

  const handleRequest = () => {
    if (!requestNote.trim()) {
      toast.error("Please describe what documents are needed");
      return;
    }
    setShowRequestDialog(false);
    toast.info(`Additional documents requested from ${item.name}`);
  };

  const openZoom = (title: string) => {
    setZoomTitle(title);
    setShowZoom(true);
  };

  /* Submitted info rows */
  const submittedInfo = [
    { icon: User,    label: "Full Name",    value: item.name },
    { icon: Clock,   label: "Date of Birth",value: "1992-05-14" },
    { icon: FileText,label: "ID Number",    value: "12345678" },
    { icon: FileText,label: "ID Type",      value: item.idType },
    { icon: Phone,   label: "Phone",        value: "+254 723 456 789" },
    { icon: Mail,    label: "Email",        value: "amina.hassan@email.com" },
    { icon: MapPin,  label: "Address",      value: "Mombasa, Kenya" },
  ] as const;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Link href="/kyc">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Queue
          </Button>
        </Link>

        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            KYC Review —{" "}
            <span className="text-blue-700 dark:text-blue-400">{item.name}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            <span className="font-mono font-medium">{item.id}</span>
            {" · "}
            Submitted {item.submittedAt}
            {" · "}
            Wait time:{" "}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {item.waitTime}
            </span>
          </p>
        </div>

        {/* Verdict banner */}
        {resolved && verdict && (
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shrink-0",
              verdict === "approved"
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
            )}
          >
            {verdict === "approved" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {verdict === "approved" ? "KYC Approved" : "KYC Rejected"}
          </div>
        )}
      </div>

      {/* ── Priority + risk strip ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className={cn(
          "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border",
          item.priority === "urgent"
            ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
            : item.priority === "high"
            ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"
        )}>
          <AlertTriangle className="w-3.5 h-3.5" />
          {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600">
          <ShieldCheck className="w-3.5 h-3.5" />
          {item.accountType} Account
        </div>

        <div className={cn(
          "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border",
          item.riskScore > 15
            ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200"
            : item.riskScore > 8
            ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200"
            : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200"
        )}>
          Risk Score: {item.riskScore}/100
        </div>
      </div>

      {/* ── Main two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Submitted information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 pb-0">
              Submitted Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-0">
              {submittedInfo.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                >
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-sm">{label}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100 text-right">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Verification status */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 pb-0">
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-0">
              {checks.map((check) => (
                <div
                  key={check.label}
                  className="flex items-center justify-between py-3.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                >
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {check.label}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        check.status === "pass" && "text-slate-700 dark:text-slate-200",
                        check.status === "warn" && "text-amber-700 dark:text-amber-400",
                        check.status === "fail" && "text-red-700 dark:text-red-400"
                      )}
                    >
                      {check.value}
                    </span>
                    <VerificationDot status={check.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Document viewer ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DocPanel
          title="National ID — Front"
          sublabel="ID Document (Front)"
          onZoom={() => openZoom("National ID — Front")}
        />
        <DocPanel
          title="Selfie / Liveness"
          sublabel="Selfie Photo — Liveness check: PASSED"
          onZoom={() => openZoom("Selfie / Liveness")}
        />
      </div>

      {/* ── Action bar ── */}
      {!resolved ? (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleApprove}
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve KYC
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowRejectDialog(true)}
          >
            <XCircle className="w-4 h-4" />
            Reject
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
            onClick={() => setShowRequestDialog(true)}
          >
            <AlertTriangle className="w-4 h-4" />
            Request Additional Docs
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-1">
          <Link href="/kyc">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Queue
            </Button>
          </Link>
        </div>
      )}

      {/* ── Reject dialog ── */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent size="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-4 h-4" />
              Reject KYC Application
            </DialogTitle>
            <DialogDescription>
              This will notify{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {item.name}
              </span>{" "}
              with the rejection reason so they can resubmit.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Select
                value={rejectReason}
                onValueChange={(v) => setRejectReason(v as RejectReason)}
              >
                <SelectTrigger id="reject-reason">
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
              <Label htmlFor="reject-note">
                Additional Notes{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="reject-note"
                placeholder="Provide any additional context for the user…"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={handleReject}
            >
              <XCircle className="w-3.5 h-3.5" />
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Request additional docs dialog ── */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent size="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
              Request Additional Documents
            </DialogTitle>
            <DialogDescription>
              Describe what documents or information are needed from{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {item.name}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <div className="space-y-1.5">
              <Label htmlFor="request-note">Documents Required</Label>
              <Textarea
                id="request-note"
                placeholder="e.g. Please resubmit your National ID — the image was too blurry to read the ID number…"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                rows={4}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRequestDialog(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleRequest}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Zoom / lightbox dialog ── */}
      <Dialog open={showZoom} onOpenChange={setShowZoom}>
        <DialogContent size="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{zoomTitle}</DialogTitle>
            <DialogDescription>Full-resolution document view</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-xl h-80 flex flex-col items-center justify-center">
              <FileText className="w-16 h-16 text-slate-400 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {zoomTitle} — Full Resolution
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Backend integration will render the actual document image here
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowZoom(false)}
            >
              Close
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => toast.info("Download started")}
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}