"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search, Mail, Download, Users, Filter,
  CheckCircle2, Send, X,
} from "lucide-react";

import { MOCK_WAITLIST } from '../../../../lib/mockData';
import { useDebounce } from "../../../../hooks/useDebounce";
import { cn } from "../../../../lib/utils";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogBody, DialogFooter,
} from "../../../../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";

import type { Metadata } from "next";

/* ── Constants ──────────────────────────────────────────────── */
const REGIONS = [
  "All Regions", "Nairobi", "Mombasa", "Eldoret",
  "Kisumu", "Nakuru", "Thika",
] as const;

type Region = typeof REGIONS[number];

interface WaitlistMember {
  id:       string;
  name:     string;
  email:    string;
  region:   string;
  joinedAt: string;
  status:   "pending" | "approved";
}

/* ── Page ───────────────────────────────────────────────────── */
export default function WaitlistPage() {
  const [rawSearch,  setRawSearch]  = useState("");
  const [region,     setRegion]     = useState<Region>("All Regions");
  const [selected,   setSelected]   = useState<string[]>([]);
  const [emailOpen,  setEmailOpen]  = useState(false);
  const [subject,    setSubject]    = useState("");
  const [body,       setBody]       = useState("");
  const [sending,    setSending]    = useState(false);

  const search = useDebounce(rawSearch, 250);

  const members = MOCK_WAITLIST as WaitlistMember[];

  /* Filtered list */
  const filtered = useMemo<WaitlistMember[]>(() => {
    const q = search.toLowerCase();
    return members.filter((m) => {
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q);
      const matchRegion = region === "All Regions" || m.region === region;
      return matchSearch && matchRegion;
    });
  }, [search, region, members]);

  /* Summary stats */
  const totalCount    = members.length;
  const pendingCount  = members.filter((m) => m.status === "pending").length;
  const approvedCount = members.filter((m) => m.status === "approved").length;

  /* Selection helpers */
  const allSelected     = filtered.length > 0 && selected.length === filtered.length;
  const someSelected    = selected.length > 0 && !allSelected;

  const toggleAll = () =>
    setSelected(allSelected ? [] : filtered.map((m) => m.id));

  const toggleOne = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  /* Send email */
  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    if (selected.length === 0) {
      toast.error("Select at least one member");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    toast.success(`Email sent to ${selected.length} member${selected.length > 1 ? "s" : ""}`);
    setEmailOpen(false);
    setSubject("");
    setBody("");
    setSelected([]);
  };

  /* CSV export */
  const handleExport = () => {
    const headers = ["Name", "Email", "Region", "Joined", "Status"];
    const rows    = filtered.map((m) => [m.name, m.email, m.region, m.joinedAt, m.status]);
    const csv     = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const a = Object.assign(document.createElement("a"), {
      href:     URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `waitlist-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Exported ${filtered.length} members`);
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Waitlist Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Manage and communicate with waitlist members
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Members",
            value:     totalCount,
            icon:      Users,
            iconBg:    "bg-blue-50 dark:bg-blue-900/40",
            iconColor: "text-blue-700 dark:text-blue-400",
          },
          {
            label:     "Pending",
            value:     pendingCount,
            icon:      Filter,
            iconBg:    "bg-amber-50 dark:bg-amber-900/40",
            iconColor: "text-amber-700 dark:text-amber-400",
          },
          {
            label:     "Approved",
            value:     approvedCount,
            icon:      CheckCircle2,
            iconBg:    "bg-emerald-50 dark:bg-emerald-900/40",
            iconColor: "text-emerald-700 dark:text-emerald-400",
          },
        ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {label}
                  </p>
                  <p className="text-[28px] font-bold font-mono text-slate-900 dark:text-slate-50 mt-1.5 leading-none">
                    {value}
                  </p>
                </div>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
                  <Icon className={cn("w-5 h-5", iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filter + actions bar ── */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="Name or email…"
                  value={rawSearch}
                  onChange={(e) => setRawSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            {/* Region filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                Region
              </Label>
              <Select
                value={region}
                onValueChange={(v) => setRegion(v as Region)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                Actions
              </Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-9 flex-1 text-xs"
                  disabled={selected.length === 0}
                  onClick={() => setEmailOpen(true)}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email
                  {selected.length > 0 && (
                    <span className="ml-1 text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                      {selected.length}
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-9 text-xs"
                  onClick={handleExport}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Waitlist Members ({filtered.length})
            </CardTitle>
            <button
              onClick={toggleAll}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
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
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Select all members"
                  />
                </th>
                {["Name", "Email", "Region", "Joined", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-slate-400 text-sm"
                  >
                    No members match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((member) => (
                  <tr
                    key={member.id}
                    className={cn(
                      "border-b border-slate-50 dark:border-slate-700/50 transition-colors",
                      selected.includes(member.id)
                        ? "bg-blue-50/60 dark:bg-blue-900/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(member.id)}
                        onChange={() => toggleOne(member.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select ${member.name}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {member.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {member.email}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {member.region}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {member.joinedAt}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full border",
                          member.status === "approved"
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                        )}
                      >
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Email dialog ── */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent size="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send to{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {selected.length}
              </span>{" "}
              selected member{selected.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSend}>
            <DialogBody className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="wl-subject">Subject</Label>
                <Input
                  id="wl-subject"
                  placeholder="Email subject…"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wl-body">Message</Label>
                <Textarea
                  id="wl-body"
                  placeholder="Email message…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEmailOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={sending}
                className="gap-1.5 bg-blue-700 hover:bg-blue-800"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? "Sending…" : "Send Email"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}