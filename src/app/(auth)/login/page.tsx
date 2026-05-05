"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { toast } from "sonner";
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../components/contexts/AuthContext';

import {
  Eye, EyeOff, Shield, Lock, Mail,
  TrendingUp, Users, DollarSign, AlertCircle,
} from "lucide-react";


/* ── Constants ─────────────────────────────────────────────── */
const PLATFORM_STATS = [
  { label: "Active Users",  value: "48,291" },
  { label: "AUM",           value: "KES 2.4B" },
  { label: "Daily Volume",  value: "KES 142M" },
] as const;

const DEMO_ACCOUNTS = [
  { email: "sarah.kimani@olkasis.com",  role: "Super Admin" },
  { email: "john.mwenda@olkasis.com",   role: "Compliance" },
  { email: "alice.njoroge@olkasis.com", role: "Customer Support" },
  { email: "michael.ouma@olkasis.com",  role: "Operations" },
] as const;

type Step = "credentials" | "2fa";

/* ── OTP Input ─────────────────────────────────────────────── */
function OTPInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const handleKey = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      const prev = document.getElementById(`otp-${idx - 1}`) as HTMLInputElement | null;
      prev?.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = char;
    onChange(next.join(""));
    if (char && idx < 5) {
      const nextInput = document.getElementById(`otp-${idx + 1}`) as HTMLInputElement | null;
      nextInput?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          title=""
          placeholder="Enter"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKey(e, i)}
          className={cn(
            "w-11 h-12 text-center text-lg font-mono font-bold rounded-lg border-2 transition-colors",
            "focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20",
            d ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-900"
          )}
        />
      ))}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */
export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";

  const [email,       setEmail]       = useState("sarah.kimani@olkasis.com");
  const [password,    setPassword]    = useState("admin123");
  const [otp,         setOtp]         = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [step,        setStep]        = useState<Step>("credentials");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [showDemoBar, setShowDemoBar] = useState(true);

  /* Step 1 — validate credentials and advance to 2FA */
  const handleCredentials = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!email.trim() || !password) {
        setError("Please enter your email and password.");
        return;
      }
      setStep("2fa");
    },
    [email, password]
  );

  /* Step 2 — complete login */
  const handleLogin = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);

      // In demo mode accept any 6-digit OTP, or bypass with empty
      if (otp && otp.length !== 6) {
        setError("Enter the 6-digit code from your authenticator app.");
        return;
      }

      setLoading(true);
      try {
        const result = await login(email, password);
        if (result.success) {
          toast.success("Welcome back!", {
            description: "Redirecting to your dashboard…",
          });
          router.push(from);
        } else {
          setError(result.error ?? "Invalid credentials. Please try again.");
          setStep("credentials");
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, otp, login, router, from]
  );

  const selectDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("admin123");
    setStep("credentials");
    setError(null);
  };

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ─── dark navy with financial motif ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-[#0F172A]">

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Gradient orbs */}
        <div className="absolute top-[-120px] left-[-80px] w-[480px] h-[480px] rounded-full bg-blue-800/25 blur-[96px]" />
        <div className="absolute bottom-[-80px] right-[-60px] w-[360px] h-[360px] rounded-full bg-sky-700/20 blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg tracking-tight">O</span>
            </div>
            <div>
              <div className="text-white font-bold text-xl tracking-tight">Olkasis</div>
              <div className="text-sky-400 text-xs font-medium tracking-widest uppercase">Admin Console</div>
            </div>
          </div>

          {/* Hero copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-900/60 border border-blue-700/40 rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sky-300 text-xs font-medium">Platform Live</span>
            </div>

            <h1 className="text-white text-[2.6rem] font-black leading-[1.1] tracking-tight mb-4">
              Institutional-grade<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400">
                platform management
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Comprehensive oversight of trading, compliance, user management, and financial operations — all in one console.
            </p>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {PLATFORM_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/8 transition-colors"
                >
                  <div className="text-white font-bold text-xl font-mono tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-slate-500 text-xs mt-1 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Feature pills */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { icon: Users,      text: "User Management" },
                { icon: Shield,     text: "AML & Compliance" },
                { icon: TrendingUp, text: "Trading Oversight" },
                { icon: DollarSign, text: "Wallet & Payments" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5"
                >
                  <Icon className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-slate-300 text-xs font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security footer */}
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Shield className="w-3.5 h-3.5 text-sky-500" />
            <span>256-bit TLS encryption · 2FA required · All access logged and monitored</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ─── white login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-base">O</span>
            </div>
            <div>
              <div className="text-slate-900 font-bold text-lg">Olkasis</div>
              <div className="text-sky-600 text-xs font-medium">Admin Console</div>
            </div>
          </div>

          {/* ─── Demo account quick-select bar ─── */}
          {showDemoBar && (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Demo Accounts — all use password: admin123
                </p>
                <button
                  type="button"
                  onClick={() => setShowDemoBar(false)}
                  className="text-blue-400 hover:text-blue-600 text-xs ml-2 shrink-0"
                >
                  Dismiss
                </button>
              </div>
              <div className="space-y-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => selectDemo(acc.email)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left",
                      email === acc.email
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-blue-100 text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                    )}
                  >
                    <span className="font-medium truncate">{acc.email}</span>
                    <span className={cn(
                      "ml-2 shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      email === acc.email ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      {acc.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── STEP 1: Credentials ─── */}
          {step === "credentials" && (
            <div className="animate-fade-in">
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Sign in to your account
                </h2>
                <p className="text-slate-500 text-sm mt-1.5">
                  Enter your admin credentials to continue
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3.5 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCredentials} className="space-y-4" noValidate>
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@olkasis.com"
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-700 hover:bg-blue-800 font-semibold text-sm"
                >
                  Continue to 2FA
                </Button>
              </form>
            </div>
          )}

          {/* ─── STEP 2: 2FA ─── */}
          {step === "2fa" && (
            <div className="animate-fade-in">
              <div className="mb-7">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-blue-700" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Two-factor authentication
                </h2>
                <p className="text-slate-500 text-sm mt-1.5">
                  Signing in as{" "}
                  <span className="font-medium text-slate-700">{email}</span>
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3.5 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5" noValidate>
                <div className="space-y-3">
                  <Label className="block text-center text-sm text-slate-600">
                    Enter the 6-digit code from your authenticator app
                  </Label>
                  <OTPInput value={otp} onChange={setOtp} />
                  <p className="text-center text-xs text-slate-400">
                    Demo: leave blank or enter any 6 digits to continue
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-blue-700 hover:bg-blue-800 font-semibold text-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in…
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep("credentials"); setError(null); }}
                  className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors py-1"
                >
                  ← Back to credentials
                </button>
              </form>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Authorized personnel only. All access is logged and monitored.
            </p>
            <p className="text-xs text-slate-300 mt-1">
              © {new Date().getFullYear()} Olkasis Financial Technologies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}