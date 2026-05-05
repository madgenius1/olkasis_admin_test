/*
 * OLKASIS ADMIN — Role-Based Access Control (RBAC)
 * Updated for Next.js App Router routes.
 */

import type { AdminRole } from '../types/index';
export type { AdminRole };

export interface RolePermissions {
  pages: string[];
  description: string;
  label: string;
  colour: string; // Tailwind text colour for role badge
}

export const ROLE_PERMISSIONS: Record<AdminRole, RolePermissions> = {
  super_admin: {
    label: "Super Admin",
    colour: "text-violet-600",
    pages: [
      "/dashboard",
      "/users",
      "/users/[userId]",
      "/users/waitlist",
      "/kyc",
      "/kyc/review/[kycId]",
      "/kyc/joint-junior",
      "/compliance",
      "/compliance/aml-alerts",
      "/compliance/audit-logs",
      "/compliance/str-generator",
      "/trading",
      "/trading/orders",
      "/trading/holdings",
      "/trading/market-data",
      "/trading/derivatives",
      "/wallets",
      "/wallets/transactions",
      "/wallets/reconciliation",
      "/p2p",
      "/p2p/disputes",
      "/support",
      "/support/tickets",
      "/content",
      "/content/learning",
      "/rafiki",
      "/reports",
      "/reports/financial",
      "/reports/trading",
      "/reports/regulatory",
      "/marketing",
      "/risk",
      "/system",
      "/admins",
      "/settings",
    ],
    description: "Full access to all admin features and system configuration",
  },

  // product: {
  //   label: "Product",
  //   colour: "text-blue-600",
  //   pages: [
  //     "/dashboard",
  //     "/users",
  //     "/users/[userId]",
  //     "/kyc",
  //     "/kyc/review/[kycId]",
  //     "/kyc/joint-junior",
  //     "/compliance",
  //     "/compliance/aml-alerts",
  //     "/compliance/audit-logs",
  //     "/compliance/str-generator",
  //     "/reports",
  //     "/reports/financial",
  //     "/reports/regulatory",
  //     "/settings",
  //   ],
  //   description: "Access to product aspects, KYC, AML, STR, and regulatory reporting",
  // },

  compliance: {
    label: "Compliance",
    colour: "text-blue-600",
    pages: [
      "/dashboard",
      "/users",
      "/users/[userId]",
      "/kyc",
      "/kyc/review/[kycId]",
      "/kyc/joint-junior",
      "/compliance",
      "/compliance/aml-alerts",
      "/compliance/audit-logs",
      "/compliance/str-generator",
      "/reports",
      "/reports/financial",
      "/reports/regulatory",
      "/settings",
    ],
    description: "Access to compliance, KYC, AML, STR, and regulatory reporting",
  },

  operations: {
    label: "Operations",
    colour: "text-emerald-600",
    pages: [
      "/dashboard",
      "/trading",
      "/trading/orders",
      "/trading/holdings",
      "/trading/market-data",
      "/trading/derivatives",
      "/wallets",
      "/wallets/transactions",
      "/wallets/reconciliation",
      "/p2p",
      "/p2p/disputes",
      "/reports",
      "/reports/financial",
      "/reports/trading",
      "/settings",
    ],
    description: "Access to trading, wallets, reconciliation, and P2P operations",
  },

  customer_support: {
    label: "Customer Support",
    colour: "text-amber-600",
    pages: [
      "/dashboard",
      "/users",
      "/users/[userId]",
      "/support",
      "/support/tickets",
      "/content",
      "/content/learning",
      "/settings",
    ],
    description: "Access to user management, support tickets, and content",
  },

  data_analyst: {
    label: "Data Analyst",
    colour: "text-slate-600",
    pages: [
      "/dashboard",
      "/reports",
      "/reports/financial",
      "/reports/trading",
      "/marketing",
      "/risk",
      "/settings",
    ],
    description: "Read-only access to analytics, reports, and marketing data",
  },
};

/**
 * Check if a user with given role can access a specific page path.
 * Supports Next.js dynamic segments like [userId].
 */
export function canAccessPage(role: AdminRole, path: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  if (permissions.pages.includes(path)) return true;

  return permissions.pages.some((allowedPath) => {
    const allowedParts = allowedPath.split("/");
    const pathParts    = path.split("/");
    if (allowedParts.length !== pathParts.length) return false;
    return allowedParts.every(
      (part, i) => part === pathParts[i] || (part.startsWith("[") && part.endsWith("]"))
    );
  });
}

/** Get all accessible pages for a role */
export function getAccessiblePages(role: AdminRole): string[] {
  return ROLE_PERMISSIONS[role]?.pages ?? [];
}

/** Get role display label */
export function getRoleLabel(role: AdminRole): string {
  return ROLE_PERMISSIONS[role]?.label ?? role;
}

/** Get role description */
export function getRoleDescription(role: AdminRole): string {
  return ROLE_PERMISSIONS[role]?.description ?? "Unknown role";
}

/** Get role badge colour class */
export function getRoleColour(role: AdminRole): string {
  return ROLE_PERMISSIONS[role]?.colour ?? "text-slate-600";
}