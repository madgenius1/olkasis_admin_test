import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * OLKASIS ADMIN — Next.js Middleware
 *
 * Responsibilities:
 *  1. Auth guard    — redirect unauthenticated requests to /login
 *  2. Role guard    — block roles without access to specific route segments
 *  3. Security headers — CSP, HSTS, frame options, etc.
 *  4. Login redirect  — send already-authed users away from /login
 *  5. Audit hints     — attach request-id header for server-side logging
 *
 * Auth mechanism (frontend-only demo):
 *   AuthContext sets cookie "olk_session=<role>" on login.
 *   Middleware reads this cookie to determine auth state and role.
 *   Replace with JWT verification (jose) when backend is ready.
 *
 * ──────────────────────────────────────────────────────────────
 * COOKIE SHAPE (demo)
 *   olk_session = "<AdminRole>"
 *   e.g.  olk_session=super_admin
 *         olk_session=compliance
 *         olk_session=customer_support
 * ──────────────────────────────────────────────────────────────
 */

/* ─────────────────────────────────────────────────────────────
   ROUTE DEFINITIONS
───────────────────────────────────────────────────────────── */

/** Paths accessible without any session cookie */
const PUBLIC_PATHS: string[] = [
  "/login",
];

/**
 * Routes that require a specific role (or set of roles).
 * Checked in order — first match wins.
 * Roles not listed here are accessible to ALL authenticated users.
 */
const ROLE_RESTRICTED: Array<{
  /** Path prefix to match */
  prefix: string;
  /** Roles that ARE allowed */
  allowed: string[];
  /** Custom redirect when blocked (defaults to /dashboard) */
  redirect?: string;
}> = [
  /* STR Generator — compliance + super admin only */
  {
    prefix:  "/compliance/str-generator",
    allowed: ["super_admin", "compliance"],
    redirect:"/compliance",
  },
  /* Full compliance module — compliance + super admin */
  {
    prefix:  "/compliance",
    allowed: ["super_admin", "compliance"],
    redirect:"/dashboard",
  },
  /* Admin users management — super admin only */
  {
    prefix:  "/admins",
    allowed: ["super_admin"],
    redirect:"/dashboard",
  },
  /* System configuration — super admin only */
  {
    prefix:  "/system",
    allowed: ["super_admin"],
    redirect:"/dashboard",
  },
  /* Derivatives — operations + super admin */
  {
    prefix:  "/trading/derivatives",
    allowed: ["super_admin", "operations"],
    redirect:"/trading",
  },
  /* Wallet reconciliation — operations + super admin */
  {
    prefix:  "/wallets/reconciliation",
    allowed: ["super_admin", "operations"],
    redirect:"/wallets",
  },
  /* Rafiki AI — super admin only */
  {
    prefix:  "/rafiki",
    allowed: ["super_admin"],
    redirect:"/dashboard",
  },
  /* Marketing — super admin + data analyst */
  {
    prefix:  "/marketing",
    allowed: ["super_admin", "data_analyst"],
    redirect:"/dashboard",
  },
  /* Reports — super admin, compliance, data analyst, operations */
  {
    prefix:  "/reports",
    allowed: ["super_admin", "compliance", "data_analyst", "operations"],
    redirect:"/dashboard",
  },
  /* Risk management — super admin + operations */
  {
    prefix:  "/risk",
    allowed: ["super_admin", "operations"],
    redirect:"/dashboard",
  },
  /* Settings — all authenticated roles (no restriction) */
  /* Support — all authenticated roles (no restriction) */
  /* KYC — compliance, super admin, (not customer_support by default) */
  {
    prefix:  "/kyc",
    allowed: ["super_admin", "compliance"],
    redirect:"/dashboard",
  },
];

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/images/") ||
    pathname.includes(".")
  );
}

/**
 * Generate a compact request ID for tracing.
 * Format: <8 random hex chars>-<timestamp last 4 digits>
 */
function generateRequestId(): string {
  const hex  = Math.random().toString(16).slice(2, 10);
  const time = Date.now().toString(16).slice(-4);
  return `${hex}-${time}`;
}

/**
 * Check whether the role is allowed for the given pathname.
 * Returns the redirect URL if blocked, undefined if allowed.
 */
function getRoleRedirect(
  pathname: string,
  role: string
): string | undefined {
  for (const rule of ROLE_RESTRICTED) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")) {
      if (!rule.allowed.includes(role)) {
        return rule.redirect ?? "/dashboard";
      }
      // Matched and allowed — stop checking further rules
      return undefined;
    }
  }
  return undefined; // No rule matched → allowed
}

/* ─────────────────────────────────────────────────────────────
   SECURITY HEADERS
   Applied to every response that passes the middleware.
───────────────────────────────────────────────────────────── */
function applySecurityHeaders(response: NextResponse): NextResponse {
  const h = response.headers;

  /* Prevent clickjacking */
  h.set("X-Frame-Options", "DENY");

  /* Disable MIME sniffing */
  h.set("X-Content-Type-Options", "nosniff");

  /* Referrer policy */
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");

  /* Permissions policy — deny camera/mic/location for admin tool */
  h.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  /*
   * HSTS — enforce HTTPS for 1 year.
   * Remove/adjust if running on HTTP in development.
   */
  h.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  /*
   * Content Security Policy (admin tool — no external scripts allowed).
   * Adjust 'connect-src' when your backend API domain is known.
   */
  h.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval in dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://api.dicebear.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  return response;
}

/* ─────────────────────────────────────────────────────────────
   MIDDLEWARE
───────────────────────────────────────────────────────────── */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId    = generateRequestId();

  /* ── 1. Skip static assets and Next.js internals ── */
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  /* ── 2. Always allow public paths ── */
  if (isPublicPath(pathname)) {
    const session = request.cookies.get("olk_session");

    /* If already authenticated and hitting /login, redirect to dashboard */
    if (session?.value && pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    const response = NextResponse.next();
    response.headers.set("X-Request-Id", requestId);
    return applySecurityHeaders(response);
  }

  /* ── 3. Read session cookie ── */
  const session = request.cookies.get("olk_session");
  const role    = session?.value ?? "";

  /* ── 4. No session → redirect to /login ── */
  if (!role) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";

    /* Preserve the intended path so login can redirect back */
    if (pathname !== "/" && pathname !== "/login") {
      loginUrl.searchParams.set("from", pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  /* ── 5. Role-based access check ── */
  const roleRedirect = getRoleRedirect(pathname, role);

  if (roleRedirect) {
    const blockedUrl  = request.nextUrl.clone();
    blockedUrl.pathname = roleRedirect;

    /*
     * Add a query param so the target page can show an "access denied" toast.
     * The dashboard layout can read this and display a notification.
     */
    blockedUrl.searchParams.set("denied", "1");
    blockedUrl.searchParams.set("from",   pathname);

    const response = NextResponse.redirect(blockedUrl);
    response.headers.set("X-Request-Id",   requestId);
    response.headers.set("X-Denied-Path",  pathname);
    response.headers.set("X-Denied-Role",  role);
    return applySecurityHeaders(response);
  }

  /* ── 6. Authenticated and authorised — allow through ── */
  const response = NextResponse.next();

  /* Attach request ID for server-side tracing */
  response.headers.set("X-Request-Id",    requestId);
  response.headers.set("X-Authenticated", "1");
  response.headers.set("X-Role",          role);

  return applySecurityHeaders(response);
}

/* ─────────────────────────────────────────────────────────────
   MATCHER
   Run middleware on all routes except Next.js internals,
   static files, and the favicon.
───────────────────────────────────────────────────────────── */
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation API)
     *  - favicon.ico
     *  - .png / .jpg / .svg etc (public assets)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf)).*)",
  ],
};