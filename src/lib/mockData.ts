/*
 * OLKASIS ADMIN — Mock Data (Expanded)
 * Realistic Kenyan fintech demo data for all dashboard sections.
 * Replace these exports with API/react-query calls when backend is ready.
 */

import type {
  PlatformUser, KYCQueueItem, AMLAlert, AuditLog, STRRecord,
  Order, Holding, NSEStock, NSEOption, DerivativePosition, DerivativesApproval,
  Transaction, ReconciliationItem, P2PTransfer, P2PDispute,
  SupportTicket, CannedResponse, LiveChatSession,
  Campaign, ChurnPrediction, Referral,
  RiskIncident, MarginCall,
  RevenueDataPoint, RegulatorySubmission,
  AIConversation, BlacklistTopic,
  FeatureFlag, TradingHoliday, FeeConfig,
  SessionRecord, IPWhitelistEntry, APIKey, NotificationPreference,
  AdminUser, Notification, JointKYCRecord, JuniorKYCRecord,
} from "../types/index";

/* ============================================================
   PLATFORM USERS
   ============================================================ */

export const MOCK_USERS: PlatformUser[] = [
  { id: "USR001", name: "James Mwangi",   email: "james.mwangi@email.com",   phone: "+254 712 345 678", kycStatus: "verified", accountType: "Individual", status: "active",    portfolioValue: 284500,   registeredAt: "2024-01-15", location: "Nairobi" },
  { id: "USR002", name: "Amina Hassan",   email: "amina.hassan@email.com",   phone: "+254 723 456 789", kycStatus: "pending",  accountType: "Individual", status: "active",    portfolioValue: 52300,    registeredAt: "2024-02-20", location: "Mombasa" },
  { id: "USR003", name: "Peter Ochieng",  email: "peter.ochieng@email.com",  phone: "+254 734 567 890", kycStatus: "rejected", accountType: "Joint",      status: "suspended", portfolioValue: 0,        registeredAt: "2024-03-10", location: "Kisumu" },
  { id: "USR004", name: "Grace Wanjiku",  email: "grace.wanjiku@email.com",  phone: "+254 745 678 901", kycStatus: "verified", accountType: "Junior",     status: "active",    portfolioValue: 18900,    registeredAt: "2024-01-28", location: "Nakuru" },
  { id: "USR005", name: "David Kamau",    email: "david.kamau@email.com",    phone: "+254 756 789 012", kycStatus: "verified", accountType: "Individual", status: "active",    portfolioValue: 1250000,  registeredAt: "2023-11-05", location: "Nairobi" },
  { id: "USR006", name: "Faith Njeri",    email: "faith.njeri@email.com",    phone: "+254 767 890 123", kycStatus: "pending",  accountType: "Individual", status: "inactive",  portfolioValue: 0,        registeredAt: "2024-04-01", location: "Thika" },
  { id: "USR007", name: "Samuel Otieno", email: "samuel.otieno@email.com",  phone: "+254 778 901 234", kycStatus: "verified", accountType: "Individual", status: "active",    portfolioValue: 456700,   registeredAt: "2023-09-12", location: "Nairobi" },
  { id: "USR008", name: "Lucy Akinyi",    email: "lucy.akinyi@email.com",    phone: "+254 789 012 345", kycStatus: "verified", accountType: "Individual", status: "active",    portfolioValue: 89200,    registeredAt: "2024-02-14", location: "Eldoret" },
];

export const MOCK_USER_ACTIVITY: Record<string, { event: string; detail: string; ip: string; timestamp: string }[]> = {
  USR001: [
    { event: "Login",             detail: "Chrome / Windows — Nairobi",         ip: "196.201.12.45", timestamp: "2024-04-13 09:01" },
    { event: "Order placed",      detail: "BUY 5,000 SCOM @ KSH 18.50",          ip: "196.201.12.45", timestamp: "2024-04-13 09:10" },
    { event: "Deposit",           detail: "M-Pesa KSH 50,000 — ref MPE240413001",ip: "196.201.12.45", timestamp: "2024-04-13 08:00" },
    { event: "Password changed",  detail: "—",                                   ip: "196.201.12.45", timestamp: "2024-04-10 14:22" },
    { event: "KYC submitted",     detail: "National ID — under review",           ip: "196.201.12.45", timestamp: "2024-01-14 11:30" },
    { event: "Account created",   detail: "Individual account",                   ip: "196.201.12.45", timestamp: "2024-01-15 10:00" },
  ],
  USR005: [
    { event: "Login",             detail: "Safari / macOS — Nairobi",            ip: "196.201.14.22", timestamp: "2024-04-13 08:45" },
    { event: "AML flagged",       detail: "Large transaction Ksh. 2,500,000",     ip: "—",             timestamp: "2024-04-13 08:23" },
    { event: "Withdrawal",        detail: "Bank KSH 200,000 — ref BNK240413002", ip: "196.201.14.22", timestamp: "2024-04-13 08:30" },
    { event: "Dividend received", detail: "KCB dividend KSH 5,000",              ip: "—",             timestamp: "2024-04-13 07:00" },
  ],
};

export const MOCK_ADMIN_NOTES: Record<string, { authorName: string; note: string; createdAt: string; flagged: boolean }[]> = {
  USR002: [
    { authorName: "John Mwenda", note: "User submitted blurry ID — sent re-submission request via email.", createdAt: "2024-04-13 09:20", flagged: false },
  ],
  USR003: [
    { authorName: "Sarah Kimani", note: "Account suspended pending AML investigation. Do not reinstate without compliance sign-off.", createdAt: "2024-04-11 16:00", flagged: true },
  ],
};

/* ============================================================
   KYC
   ============================================================ */

export const MOCK_KYC_QUEUE: KYCQueueItem[] = [
  { id: "KYC001", userId: "USR002", name: "Amina Hassan",  accountType: "Individual", submittedAt: "2024-04-13 09:15", waitTime: "2h 45m", accountValue: 52300,  idType: "National ID", riskScore: 12, priority: "high" },
  { id: "KYC002", userId: "USR006", name: "Faith Njeri",   accountType: "Individual", submittedAt: "2024-04-13 10:30", waitTime: "1h 30m", accountValue: 0,      idType: "Passport",    riskScore: 8,  priority: "normal" },
  { id: "KYC003", userId: "USR009", name: "Brian Mutua",   accountType: "Individual", submittedAt: "2024-04-13 11:00", waitTime: "1h 00m", accountValue: 0,      idType: "National ID", riskScore: 5,  priority: "normal" },
  { id: "KYC004", userId: "USR010", name: "Carol Waweru",  accountType: "Individual", submittedAt: "2024-04-13 11:45", waitTime: "0h 15m", accountValue: 0,      idType: "National ID", riskScore: 22, priority: "urgent" },
  { id: "KYC005", userId: "USR011", name: "Dennis Kiprop", accountType: "Individual", submittedAt: "2024-04-13 12:00", waitTime: "0h 00m", accountValue: 15000,  idType: "National ID", riskScore: 6,  priority: "normal" },
];

export const MOCK_JOINT_KYC: JointKYCRecord[] = [
  {
    id: "JKYC001",
    primaryHolder:   { id: "USR012", name: "Beatrice Waweru", email: "bea.waweru@email.com", phone: "+254 711 100 001", kycStatus: "verified",  accountType: "Joint", status: "active", portfolioValue: 320000, registeredAt: "2024-03-01", location: "Nairobi" },
    secondaryHolder: { name: "Michael Waweru", email: "mike.waweru@email.com", phone: "+254 711 100 002", kycStatus: "pending" },
    primaryKYCStatus: "verified", secondaryKYCStatus: "pending",
    consentSigned: false, submittedAt: "2024-04-13 08:30",
  },
  {
    id: "JKYC002",
    primaryHolder:   { id: "USR013", name: "John Oduya", email: "john.oduya@email.com", phone: "+254 722 200 001", kycStatus: "verified", accountType: "Joint", status: "active", portfolioValue: 85000, registeredAt: "2024-03-15", location: "Kisumu" },
    secondaryHolder: { name: "Jane Oduya", email: "jane.oduya@email.com", phone: "+254 722 200 002", kycStatus: "rejected" },
    primaryKYCStatus: "verified", secondaryKYCStatus: "rejected",
    consentSigned: true, submittedAt: "2024-04-12 14:00",
  },
];

export const MOCK_JUNIOR_KYC: JuniorKYCRecord[] = [
  {
    id: "JRKYC001",
    minor:   { name: "Tia Wanjiku",  phone: "+254 —", kycStatus: "pending" },
    guardian: { id: "USR004", name: "Grace Wanjiku", email: "grace.wanjiku@email.com", phone: "+254 745 678 901", kycStatus: "verified", accountType: "Junior", status: "active", portfolioValue: 18900, registeredAt: "2024-01-28", location: "Nakuru" },
    guardianKYCStatus: "verified", relationshipProof: true, parentalConsentSigned: false,
    submittedAt: "2024-04-13 10:00",
  },
  {
    id: "JRKYC002",
    minor:   { name: "Kevin Otieno", phone: "+254 —", kycStatus: "pending" },
    guardian: { id: "USR007", name: "Samuel Otieno", email: "samuel.otieno@email.com", phone: "+254 778 901 234", kycStatus: "verified", accountType: "Individual", status: "active", portfolioValue: 456700, registeredAt: "2023-09-12", location: "Nairobi" },
    guardianKYCStatus: "verified", relationshipProof: false, parentalConsentSigned: false,
    submittedAt: "2024-04-13 11:00",
  },
];

/* ============================================================
   COMPLIANCE
   ============================================================ */

export const MOCK_AML_ALERTS: AMLAlert[] = [
  { id: "AML001", type: "Large Transaction",    user: "David Kamau",      userId: "USR005", amount: 2500000, threshold: 1000000, timestamp: "2024-04-13 08:23", status: "open",      severity: "high" },
  { id: "AML002", type: "Circular Transfer",    user: "James Mwangi",     userId: "USR001", amount: 450000,  threshold: 0,       timestamp: "2024-04-13 09:45", status: "open",      severity: "critical" },
  { id: "AML003", type: "Rapid Fund Movement",  user: "Unknown USR011",   userId: undefined, amount: 890000,  threshold: 500000,  timestamp: "2024-04-13 10:12", status: "reviewing", severity: "medium" },
  { id: "AML004", type: "Dormant Reactivation", user: "Samuel Otieno",    userId: "USR007", amount: 120000,  threshold: 0,       timestamp: "2024-04-13 11:30", status: "resolved",  severity: "low" },
  { id: "AML005", type: "Structuring Pattern",  user: "Faith Njeri",      userId: "USR006", amount: 280000,  threshold: 300000,  timestamp: "2024-04-12 16:00", status: "open",      severity: "high" },
  { id: "AML006", type: "Multiple Accounts",    user: "Unknown USR014",   userId: undefined, amount: 0,       threshold: 0,       timestamp: "2024-04-12 14:30", status: "reviewing", severity: "medium" },
  { id: "AML007", type: "High-Risk Country Tx", user: "Amina Hassan",     userId: "USR002", amount: 95000,   threshold: 50000,   timestamp: "2024-04-11 09:00", status: "resolved",  severity: "medium" },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: "AUD001", admin: "Sarah Kimani",  adminId: "ADM001", action: "User suspended",       target: "Peter Ochieng (USR003)",            ip: "196.201.12.45", timestamp: "2024-04-13 11:30:22", category: "user" },
  { id: "AUD002", admin: "John Mwenda",   adminId: "ADM002", action: "KYC approved",         target: "James Mwangi (USR001)",             ip: "196.201.12.46", timestamp: "2024-04-13 10:45:15", category: "compliance" },
  { id: "AUD003", admin: "Alice Njoroge", adminId: "ADM003", action: "Ticket resolved",       target: "TKT004",                            ip: "196.201.12.47", timestamp: "2024-04-13 10:20:08", category: "support" },
  { id: "AUD004", admin: "Sarah Kimani",  adminId: "ADM001", action: "Feature flag updated", target: "P2P Transfers: enabled",            ip: "196.201.12.45", timestamp: "2024-04-13 09:55:33", category: "system" },
  { id: "AUD005", admin: "Michael Ouma",  adminId: "ADM004", action: "Manual credit",        target: "David Kamau (USR005) — Ksh 5,000", ip: "196.201.12.48", timestamp: "2024-04-13 09:30:11", category: "trading" },
  { id: "AUD006", admin: "John Mwenda",   adminId: "ADM002", action: "AML alert reviewed",   target: "AML001 — Escalated",               ip: "196.201.12.46", timestamp: "2024-04-13 09:00:44", category: "compliance" },
  { id: "AUD007", admin: "Sarah Kimani",  adminId: "ADM001", action: "Admin role changed",   target: "Michael Ouma → Operations",        ip: "196.201.12.45", timestamp: "2024-04-12 17:15:00", category: "system" },
  { id: "AUD008", admin: "Alice Njoroge", adminId: "ADM003", action: "KYC rejected",         target: "Peter Ochieng (USR003)",            ip: "196.201.12.47", timestamp: "2024-04-12 16:00:00", category: "compliance" },
];

export const MOCK_STR_RECORDS: STRRecord[] = [
  { id: "STR001", alertId: "AML002", subject: "James Mwangi", userId: "USR001", transactionIds: ["TXN001", "P2P001"], narrative: "Circular transfer pattern detected over 48 hours involving multiple accounts.", status: "submitted", submittedAt: "2024-04-13 14:00", referenceNumber: "CBK-STR-2024-0042", submittedBy: "John Mwenda" },
  { id: "STR002", alertId: "AML001", subject: "David Kamau",  userId: "USR005", transactionIds: ["WTX002"],           narrative: "Single large withdrawal exceeding KSH 2M threshold requiring CBK notification.",   status: "draft",     submittedBy: "Sarah Kimani" },
];

/* ============================================================
   TRADING
   ============================================================ */

export const MOCK_ORDERS: Order[] = [
  { id: "ORD001", user: "David Kamau",   userId: "USR005", stock: "SCOM", type: "BUY",  quantity: 5000,  price: 18.50, value: 92500,  status: "pending",   placedAt: "2024-04-13 09:00" },
  { id: "ORD002", user: "James Mwangi",  userId: "USR001", stock: "EQTY", type: "SELL", quantity: 2000,  price: 52.75, value: 105500, status: "filled",    placedAt: "2024-04-13 09:15" },
  { id: "ORD003", user: "Grace Wanjiku", userId: "USR004", stock: "KCB",  type: "BUY",  quantity: 1500,  price: 38.00, value: 57000,  status: "pending",   placedAt: "2024-04-13 09:30" },
  { id: "ORD004", user: "Lucy Akinyi",   userId: "USR008", stock: "COOP", type: "BUY",  quantity: 3000,  price: 14.25, value: 42750,  status: "cancelled", placedAt: "2024-04-13 09:45" },
  { id: "ORD005", user: "Samuel Otieno", userId: "USR007", stock: "SCOM", type: "SELL", quantity: 10000, price: 18.75, value: 187500, status: "filled",    placedAt: "2024-04-13 10:00" },
  { id: "ORD006", user: "Amina Hassan",  userId: "USR002", stock: "KCB",  type: "BUY",  quantity: 800,   price: 38.50, value: 30800,  status: "pending",   placedAt: "2024-04-13 10:15" },
  { id: "ORD007", user: "David Kamau",   userId: "USR005", stock: "EQTY", type: "BUY",  quantity: 3500,  price: 52.00, value: 182000, status: "filled",    placedAt: "2024-04-13 10:30" },
];

export const MOCK_HOLDINGS: Holding[] = [
  { id: "HLD001", symbol: "KCB",    name: "KCB Group Holdings",       quantity: 5000,  entryPrice: 35.20, currentPrice: 38.50,  value: 192500,  gain: 16250,  gainPercent: 9.2,  sector: "Banking" },
  { id: "HLD002", symbol: "SCOM",   name: "Safaricom PLC",            quantity: 10000, entryPrice: 19.50, currentPrice: 18.75,  value: 187500,  gain: -7500,  gainPercent: -3.8, sector: "Telecom" },
  { id: "HLD003", symbol: "EQTY",   name: "Equity Group Holdings",    quantity: 2000,  entryPrice: 54.00, currentPrice: 52.75,  value: 105500,  gain: -2500,  gainPercent: -2.3, sector: "Banking" },
  { id: "HLD004", symbol: "KPLC",   name: "Kenya Power & Lighting",   quantity: 3500,  entryPrice: 21.00, currentPrice: 22.50,  value: 78750,   gain: 5250,   gainPercent: 7.1,  sector: "Energy" },
  { id: "HLD005", symbol: "NASI",   name: "NSE All-Share Index ETF",  quantity: 1200,  entryPrice: 142.50,currentPrice: 145.80, value: 174960,  gain: 3960,   gainPercent: 2.3,  sector: "Mixed" },
  { id: "HLD006", symbol: "BRITAM", name: "Britam Holdings",          quantity: 8000,  entryPrice: 6.50,  currentPrice: 6.75,   value: 54000,   gain: 2000,   gainPercent: 3.8,  sector: "Insurance" },
];

export const MOCK_NSE_STOCKS: NSEStock[] = [
  { symbol: "KCB",     name: "KCB Group Holdings",        sector: "Banking",   price: 38.50,  change: 2.15,  changePercent: 5.9,  volume: 2850000,  marketCap: 145000000000, pe: 8.2,  dividend: 2.50 },
  { symbol: "EQTY",    name: "Equity Group Holdings",     sector: "Banking",   price: 52.75,  change: -1.25, changePercent: -2.3, volume: 1920000,  marketCap: 210000000000, pe: 12.4, dividend: 1.80 },
  { symbol: "SCBK",    name: "Standard Chartered Bank",   sector: "Banking",   price: 185.00, change: 3.50,  changePercent: 1.9,  volume: 450000,   marketCap: 185000000000, pe: 9.8,  dividend: 4.20 },
  { symbol: "COOP",    name: "Co-operative Bank",         sector: "Banking",   price: 14.25,  change: 0.50,  changePercent: 3.6,  volume: 5200000,  marketCap: 28500000000,  pe: 7.1,  dividend: 1.20 },
  { symbol: "SCOM",    name: "Safaricom PLC",             sector: "Telecom",   price: 18.75,  change: -0.50, changePercent: -2.6, volume: 8900000,  marketCap: 375000000000, pe: 15.2, dividend: 1.05 },
  { symbol: "KPLC",    name: "Kenya Power & Lighting",    sector: "Energy",    price: 22.50,  change: 1.25,  changePercent: 5.9,  volume: 3400000,  marketCap: 112500000000, pe: 13.8, dividend: 1.50 },
  { symbol: "BRITAM",  name: "Britam Holdings",           sector: "Insurance", price: 6.75,   change: 0.25,  changePercent: 3.8,  volume: 2100000,  marketCap: 13500000000,  pe: 6.9,  dividend: 0.30 },
  { symbol: "JUBILEE", name: "Jubilee Holdings",          sector: "Insurance", price: 42.50,  change: -0.75, changePercent: -1.7, volume: 450000,   marketCap: 42500000000,  pe: 9.2,  dividend: 2.10 },
  { symbol: "BAMBURI", name: "Bamburi Cement",            sector: "Consumer",  price: 6.85,   change: 0.15,  changePercent: 2.2,  volume: 2300000,  marketCap: 13700000000,  pe: 10.1, dividend: 0.35 },
  { symbol: "UNILEVER",name: "Unilever Kenya",        sector: "Consumer",  price: 18.90,  change: 0.40,  changePercent: 2.2,  volume: 1200000,  marketCap: 18900000000,  pe: 14.5, dividend: 1.25 },
];

export const MOCK_NSE_OPTIONS: NSEOption[] = [
  { symbol: "KCB_CALL_40",  underlying: "KCB",  type: "CALL", strikePrice: 40.00, expiry: "2024-05-17", bid: 1.50, ask: 1.75, volume: 125000, openInterest: 850000,  impliedVol: 0.28 },
  { symbol: "KCB_PUT_35",   underlying: "KCB",  type: "PUT",  strikePrice: 35.00, expiry: "2024-05-17", bid: 0.85, ask: 1.10, volume: 95000,  openInterest: 620000,  impliedVol: 0.26 },
  { symbol: "SCOM_CALL_20", underlying: "SCOM", type: "CALL", strikePrice: 20.00, expiry: "2024-05-17", bid: 0.45, ask: 0.65, volume: 250000, openInterest: 1200000, impliedVol: 0.32 },
  { symbol: "SCOM_PUT_17",  underlying: "SCOM", type: "PUT",  strikePrice: 17.00, expiry: "2024-05-17", bid: 0.30, ask: 0.50, volume: 180000, openInterest: 850000,  impliedVol: 0.30 },
  { symbol: "EQTY_CALL_55", underlying: "EQTY", type: "CALL", strikePrice: 55.00, expiry: "2024-06-21", bid: 2.10, ask: 2.40, volume: 85000,  openInterest: 520000,  impliedVol: 0.25 },
];

export const MOCK_DERIVATIVES: DerivativePosition[] = [
  { id: "DRV001", userId: "USR005", userName: "David Kamau",   instrument: "KCB_CALL_40",  instrumentType: "option", side: "LONG",  quantity: 50000,  notionalValue: 2000000, entryPrice: 1.50, currentPrice: 1.75, unrealizedPnL: 12500,  marginUsed: 200000, marginPercent: 68, liquidationPrice: 36.20, status: "active" },
  { id: "DRV002", userId: "USR007", userName: "Samuel Otieno", instrument: "SCOM_PUT_17",  instrumentType: "option", side: "LONG",  quantity: 100000, notionalValue: 1875000, entryPrice: 0.30, currentPrice: 0.50, unrealizedPnL: 20000,  marginUsed: 187500, marginPercent: 45, liquidationPrice: 17.50, status: "active" },
  { id: "DRV003", userId: "USR001", userName: "James Mwangi",  instrument: "EQTY_CALL_55", instrumentType: "option", side: "SHORT", quantity: 20000,  notionalValue: 1055000, entryPrice: 2.40, currentPrice: 2.10, unrealizedPnL: 6000,   marginUsed: 211000, marginPercent: 88, liquidationPrice: 54.20, status: "margin_call" },
  { id: "DRV004", userId: "USR008", userName: "Lucy Akinyi",   instrument: "KCB_PUT_35",   instrumentType: "option", side: "LONG",  quantity: 30000,  notionalValue: 1155000, entryPrice: 0.85, currentPrice: 0.40, unrealizedPnL: -13500, marginUsed: 115500, marginPercent: 95, liquidationPrice: 35.80, status: "pending_liquidation" },
];

export const MOCK_DERIVATIVES_APPROVALS: DerivativesApproval[] = [
  { id: "DA001", userId: "USR002", userName: "Amina Hassan",   email: "amina.hassan@email.com", appliedAt: "2024-04-13 08:00", quizScore: 82, riskProfile: "moderate",     status: "pending" },
  { id: "DA002", userId: "USR006", userName: "Faith Njeri",    email: "faith.njeri@email.com",  appliedAt: "2024-04-12 14:00", quizScore: 61, riskProfile: "conservative", status: "pending" },
  { id: "DA003", userId: "USR009", userName: "Brian Mutua",    email: "brian.mutua@email.com",  appliedAt: "2024-04-11 10:00", quizScore: 91, riskProfile: "aggressive",   status: "approved", reviewedBy: "Sarah Kimani", reviewedAt: "2024-04-11 15:00" },
  { id: "DA004", userId: "USR010", userName: "Carol Waweru",   email: "carol.waweru@email.com", appliedAt: "2024-04-10 09:00", quizScore: 45, riskProfile: "conservative", status: "rejected", reviewedBy: "John Mwenda",  reviewedAt: "2024-04-10 11:00", rejectionReason: "Quiz score below 60% threshold" },
];

/* ============================================================
   WALLETS & PAYMENTS
   ============================================================ */

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "TXN001", user: "James Mwangi",  userId: "USR001", type: "deposit",    method: "M-Pesa", amount: 50000,  fee: 0,   status: "completed",  timestamp: "2024-04-13 08:00", ref: "MPE240413001", description: "M-Pesa deposit" },
  { id: "TXN002", user: "David Kamau",   userId: "USR005", type: "withdrawal", method: "Bank",   amount: 200000, fee: 500, status: "processing", timestamp: "2024-04-13 08:30", ref: "BNK240413002", description: "Bank withdrawal" },
  { id: "TXN003", user: "Amina Hassan",  userId: "USR002", type: "deposit",    method: "Card",   amount: 25000,  fee: 250, status: "completed",  timestamp: "2024-04-13 09:00", ref: "CRD240413003", description: "Debit card deposit" },
  { id: "TXN004", user: "Grace Wanjiku", userId: "USR004", type: "p2p",        method: "P2P",    amount: 15000,  fee: 0,   status: "completed",  timestamp: "2024-04-13 09:30", ref: "P2P240413004", description: "P2P transfer" },
  { id: "TXN005", user: "Peter Ochieng", userId: "USR003", type: "withdrawal", method: "M-Pesa", amount: 8000,   fee: 0,   status: "failed",     timestamp: "2024-04-13 10:00", ref: "MPE240413005", description: "M-Pesa withdrawal failed" },
  { id: "TXN006", user: "Samuel Otieno",userId: "USR007", type: "deposit",    method: "M-Pesa", amount: 100000, fee: 0,   status: "completed",  timestamp: "2024-04-13 10:30", ref: "MPE240413006", description: "M-Pesa deposit" },
  { id: "TXN007", user: "Lucy Akinyi",   userId: "USR008", type: "withdrawal", method: "Bank",   amount: 45000,  fee: 200, status: "completed",  timestamp: "2024-04-13 11:00", ref: "BNK240413007", description: "Bank withdrawal" },
];

export const MOCK_RECONCILIATION: ReconciliationItem[] = [
  { id: "REC001", mpesaRef: "QHB72KN1P8", amount: 50000,  phone: "+254 712 345 678", timestamp: "2024-04-13 08:00", status: "matched",       matchedTxId: "TXN001" },
  { id: "REC002", mpesaRef: "QHB84MN2Q9", amount: 25000,  phone: "+254 723 456 789", timestamp: "2024-04-13 09:00", status: "matched",       matchedTxId: "TXN003" },
  { id: "REC003", mpesaRef: "QHC91NP3R2", amount: 12500,  phone: "+254 700 111 222", timestamp: "2024-04-13 10:15", status: "unmatched",     discrepancy: 12500 },
  { id: "REC004", mpesaRef: "QHC03KL4S7", amount: 100000, phone: "+254 778 901 234", timestamp: "2024-04-13 10:30", status: "matched",       matchedTxId: "TXN006" },
  { id: "REC005", mpesaRef: "QHD14MK5T1", amount: 35000,  phone: "+254 799 333 444", timestamp: "2024-04-13 11:45", status: "manual_review", discrepancy: 200 },
  { id: "REC006", mpesaRef: "QHD25NL6U3", amount: 8500,   phone: "+254 711 555 666", timestamp: "2024-04-13 12:20", status: "unmatched",     discrepancy: 8500 },
];

/* ============================================================
   P2P TRANSFERS & DISPUTES
   ============================================================ */

export const MOCK_P2P_TRANSFERS: P2PTransfer[] = [
  { id: "P2P001", sender: "James Mwangi",  senderId: "USR001", recipient: "Amina Hassan",  recipientId: "USR002", amount: 25000, status: "disputed",  timestamp: "2024-04-13 08:30" },
  { id: "P2P002", sender: "David Kamau",   senderId: "USR005", recipient: "Peter Ochieng", recipientId: "USR003", amount: 50000, status: "disputed",  timestamp: "2024-04-12 16:00" },
  { id: "P2P003", sender: "Grace Wanjiku", senderId: "USR004", recipient: "Faith Njeri",   recipientId: "USR006", amount: 10000, status: "completed", timestamp: "2024-04-11 10:45" },
  { id: "P2P004", sender: "Samuel Otieno",senderId: "USR007", recipient: "Lucy Akinyi",   recipientId: "USR008", amount: 32500, status: "completed", timestamp: "2024-04-13 09:15" },
  { id: "P2P005", sender: "Lucy Akinyi",   senderId: "USR008", recipient: "David Kamau",   recipientId: "USR005", amount: 18000, status: "pending",   timestamp: "2024-04-13 10:45" },
  { id: "P2P006", sender: "Amina Hassan",  senderId: "USR002", recipient: "Grace Wanjiku", recipientId: "USR004", amount: 7500,  status: "completed", timestamp: "2024-04-13 11:20" },
];

export const MOCK_P2P_DISPUTES: P2PDispute[] = [
  { id: "DIS001", transferId: "P2P001", raisedBy: "James Mwangi", sender: "James Mwangi", receiver: "Amina Hassan",  amount: 25000, reason: "Transfer not received",    status: "open",          openedAt: "2024-04-13 08:45" },
  { id: "DIS002", transferId: "P2P002", raisedBy: "David Kamau",  sender: "David Kamau",  receiver: "Peter Ochieng", amount: 50000, reason: "Wrong amount sent",         status: "investigating", openedAt: "2024-04-12 16:30" },
  { id: "DIS003", transferId: "P2P003", raisedBy: "Grace Wanjiku",sender: "Grace Wanjiku",receiver: "Faith Njeri",   amount: 10000, reason: "Unauthorized transfer",     status: "resolved",      openedAt: "2024-04-11 11:00" },
];

/* ============================================================
   CUSTOMER SUPPORT
   ============================================================ */

export const MOCK_TICKETS: SupportTicket[] = [
  { id: "TKT001", user: "Amina Hassan",  userId: "USR002", subject: "Unable to complete KYC verification",        category: "KYC",      priority: "high",   status: "open",        agent: "John Doe",   openedAt: "2024-04-13 09:00", sla: "2h remaining" },
  { id: "TKT002", user: "Peter Ochieng", userId: "USR003", subject: "Withdrawal not received after 3 days",       category: "Payments", priority: "urgent", status: "open",        agent: "Unassigned", openedAt: "2024-04-13 07:30", sla: "OVERDUE" },
  { id: "TKT003", user: "Faith Njeri",   userId: "USR006", subject: "Account suspended without notice",            category: "Account",  priority: "high",   status: "in-progress", agent: "Jane Smith", openedAt: "2024-04-13 10:15", sla: "4h remaining" },
  { id: "TKT004", user: "Grace Wanjiku", userId: "USR004", subject: "How to add a joint account holder",           category: "General",  priority: "low",    status: "resolved",    agent: "John Doe",   openedAt: "2024-04-12 14:00", sla: "Resolved" },
  { id: "TKT005", user: "David Kamau",   userId: "USR005", subject: "Dividend not credited to account",            category: "Payments", priority: "medium", status: "open",        agent: "Unassigned", openedAt: "2024-04-13 11:00", sla: "6h remaining" },
  { id: "TKT006", user: "Samuel Otieno",userId: "USR007", subject: "App crashing on portfolio view",              category: "Technical",priority: "medium", status: "in-progress", agent: "Tech Team",  openedAt: "2024-04-13 08:00", sla: "3h remaining" },
];

export const MOCK_CANNED_RESPONSES: CannedResponse[] = [
  { id: "CR001", title: "KYC Pending — Standard",        category: "KYC",      content: "Thank you for submitting your KYC documents. Our team is reviewing your application and will notify you within 1-2 business days." },
  { id: "CR002", title: "KYC Rejected — Blurry ID",      category: "KYC",      content: "Unfortunately, we were unable to verify your ID document as the image quality was insufficient. Please re-upload a clear, well-lit photo and resubmit." },
  { id: "CR003", title: "Withdrawal Delay — Bank",       category: "Payments", content: "Bank withdrawals typically take 1-3 business days to reflect. If you haven't received your funds after 3 business days, please contact us with your transaction reference number." },
  { id: "CR004", title: "M-Pesa Deposit Not Reflected",  category: "Payments", content: "Please share your M-Pesa confirmation message reference number. Our team will reconcile and credit your account within 30 minutes." },
  { id: "CR005", title: "Account Suspension Notice",     category: "Account",  content: "Your account has been temporarily suspended pending a compliance review. This is a standard procedure and our team will contact you within 24 hours with further details." },
  { id: "CR006", title: "How to Place an Order",         category: "Trading",  content: "To place an order: 1) Navigate to Trading, 2) Select the stock, 3) Enter quantity and price, 4) Review and confirm. Please ensure you have sufficient funds in your wallet." },
];

export const MOCK_LIVE_CHATS: LiveChatSession[] = [
  { id: "LC001", userId: "USR002", userName: "Amina Hassan",  waitingTime: "3 min", topic: "KYC Document Issue",   status: "waiting" },
  { id: "LC002", userId: "USR008", userName: "Lucy Akinyi",   waitingTime: "1 min", topic: "Withdrawal Query",     status: "active",  assignedAgent: "Alice Njoroge" },
  { id: "LC003", userId: "USR006", userName: "Faith Njeri",   waitingTime: "7 min", topic: "Account Suspended",    status: "waiting" },
  { id: "LC004", userId: "USR001", userName: "James Mwangi",  waitingTime: "0 min", topic: "Order Not Executing",  status: "active",  assignedAgent: "John Doe" },
];

/* ============================================================
   MARKETING
   ============================================================ */

export const MOCK_CAMPAIGNS: Campaign[] = [
  { id: "CMP001", name: "Refer a Friend",     type: "Referral",    reward: "KSH 500 per referral",   uses: 842,  status: "active",    startDate: "2024-01-01", budget: 500000,  spent: 421000,  conversions: 842, roi: 2.1 },
  { id: "CMP002", name: "New User Bonus",     type: "Onboarding",  reward: "KSH 200 credit",         uses: 1204, status: "active",    startDate: "2024-01-01", budget: 300000,  spent: 240800,  conversions: 1204,roi: 3.8 },
  { id: "CMP003", name: "Q2 Trading Boost",   type: "Trading",     reward: "Zero commission",        uses: 321,  status: "paused",    startDate: "2024-04-01", budget: 200000,  spent: 64200,   conversions: 321, roi: 1.5 },
  { id: "CMP004", name: "Dormant User Win-Back",type:"Reactivation",reward: "KSH 100 trade credit",  uses: 87,   status: "active",    startDate: "2024-03-15", budget: 100000,  spent: 8700,    conversions: 87,  roi: 4.2 },
  { id: "CMP005", name: "Junior Account Drive",type: "Onboarding", reward: "No fees for 6 months",  uses: 156,  status: "scheduled", startDate: "2024-05-01", budget: 150000,  spent: 0,       conversions: 0,   roi: 0 },
];

export const MOCK_TOP_REFERRERS = [
  { userId: "REF001", name: "John Mwangi",    referrals: 48, earned: 24000, tier: "Gold",   streak: 12 },
  { userId: "REF002", name: "Grace Wanjiku",  referrals: 35, earned: 17500, tier: "Silver", streak: 8 },
  { userId: "REF003", name: "Peter Kamau",    referrals: 29, earned: 14500, tier: "Silver", streak: 5 },
  { userId: "REF004", name: "Amina Hassan",   referrals: 22, earned: 11000, tier: "Bronze", streak: 3 },
  { userId: "REF005", name: "Lucy Akinyi",    referrals: 18, earned: 9000,  tier: "Bronze", streak: 2 },
  { userId: "REF006", name: "Samuel Otieno", referrals: 14, earned: 7000,  tier: "Bronze", streak: 1 },
];

export const MOCK_CHURN_PREDICTIONS: ChurnPrediction[] = [
  { userId: "USR006", userName: "Faith Njeri",    churnScore: 91, lastActivity: "2024-03-20", predictedChurnDate: "2024-04-20", riskLevel: "high",   primaryReason: "No login for 24 days" },
  { userId: "USR003", userName: "Peter Ochieng",  churnScore: 88, lastActivity: "2024-03-15", predictedChurnDate: "2024-04-15", riskLevel: "high",   primaryReason: "Suspended account" },
  { userId: "USR002", userName: "Amina Hassan",   churnScore: 62, lastActivity: "2024-04-08", predictedChurnDate: "2024-04-28", riskLevel: "medium", primaryReason: "KYC pending — frustrated" },
  { userId: "USR004", userName: "Grace Wanjiku",  churnScore: 44, lastActivity: "2024-04-10", predictedChurnDate: "2024-05-10", riskLevel: "medium", primaryReason: "Low activity, Junior account" },
  { userId: "USR008", userName: "Lucy Akinyi",    churnScore: 28, lastActivity: "2024-04-12", predictedChurnDate: "2024-05-30", riskLevel: "low",    primaryReason: "Reduced trade frequency" },
];

// Cohort retention data (rows = signup month, cols = months retained 0-6)
export const MOCK_COHORT_DATA = [
  { cohort: "Oct 23", m0: 100, m1: 78, m2: 65, m3: 58, m4: 52, m5: 48, m6: 45 },
  { cohort: "Nov 23", m0: 100, m1: 81, m2: 68, m3: 61, m4: 55, m5: 50, m6: null },
  { cohort: "Dec 23", m0: 100, m1: 75, m2: 62, m3: 55, m4: 48, m5: null, m6: null },
  { cohort: "Jan 24", m0: 100, m1: 83, m2: 70, m3: 63, m4: null, m5: null, m6: null },
  { cohort: "Feb 24", m0: 100, m1: 79, m2: 67, m3: null, m4: null, m5: null, m6: null },
  { cohort: "Mar 24", m0: 100, m1: 85, m2: null, m3: null, m4: null, m5: null, m6: null },
  { cohort: "Apr 24", m0: 100, m1: null, m2: null, m3: null, m4: null, m5: null, m6: null },
];

/* ============================================================
   RISK MANAGEMENT
   ============================================================ */

export const MOCK_RISK_INCIDENTS: RiskIncident[] = [
  { id: "RI001", type: "Unusual Trading Pattern",    severity: "medium",   status: "investigating", time: "Today 10:22",    userId: "USR005", userName: "David Kamau",   description: "Rapid buy-sell cycles detected across 3 accounts" },
  { id: "RI002", type: "Large Withdrawal Spike",     severity: "high",     status: "open",          time: "Today 08:15",    userId: "USR005", userName: "David Kamau",   description: "KSH 2.5M withdrawal request, AML triggered" },
  { id: "RI003", type: "Account Takeover Attempt",   severity: "critical", status: "resolved",      time: "Yesterday 22:40",userId: "USR001", userName: "James Mwangi",  description: "3 failed 2FA attempts from new device" },
  { id: "RI004", type: "Margin Limit Approaching",   severity: "medium",   status: "open",          time: "Today 09:00",    userId: "USR001", userName: "James Mwangi",  description: "Derivatives margin utilisation at 88%" },
  { id: "RI005", type: "Forced Liquidation Trigger", severity: "critical", status: "open",          time: "Today 11:00",    userId: "USR008", userName: "Lucy Akinyi",   description: "Margin at 95% — liquidation queue" },
];

export const MOCK_MARGIN_CALLS: MarginCall[] = [
  { userId: "USR001", userName: "James Mwangi", positionId: "DRV003", instrument: "EQTY_CALL_55", currentMargin: 211000, maintenanceMargin: 240000, deficit: 29000,  callTime: "Today 09:00", dueBy: "Today 15:00" },
  { userId: "USR008", userName: "Lucy Akinyi",  positionId: "DRV004", instrument: "KCB_PUT_35",   currentMargin: 115500, maintenanceMargin: 180000, deficit: 64500,  callTime: "Today 10:30", dueBy: "Today 12:00" },
];

/* ============================================================
   REPORTS
   ============================================================ */

export const MOCK_REVENUE_DATA: RevenueDataPoint[] = [
  { month: "Oct", revenue: 2450000, fees: 420000, trading: 1850000, p2p: 420000,  withdrawal: 180000 },
  { month: "Nov", revenue: 2820000, fees: 510000, trading: 2100000, p2p: 510000,  withdrawal: 210000 },
  { month: "Dec", revenue: 3420000, fees: 680000, trading: 2450000, p2p: 680000,  withdrawal: 290000 },
  { month: "Jan", revenue: 2625000, fees: 450000, trading: 1980000, p2p: 450000,  withdrawal: 195000 },
  { month: "Feb", revenue: 3110000, fees: 590000, trading: 2280000, p2p: 590000,  withdrawal: 240000 },
  { month: "Mar", revenue: 3680000, fees: 720000, trading: 2650000, p2p: 720000,  withdrawal: 310000 },
  { month: "Apr", revenue: 4050000, fees: 810000, trading: 2890000, p2p: 810000,  withdrawal: 350000 },
];

export const MOCK_USER_GROWTH = [
  { date: "Apr 7",  users: 47200 },
  { date: "Apr 8",  users: 47450 },
  { date: "Apr 9",  users: 47680 },
  { date: "Apr 10", users: 47890 },
  { date: "Apr 11", users: 48050 },
  { date: "Apr 12", users: 48180 },
  { date: "Apr 13", users: 48291 },
];

export const MOCK_VOLUME_DATA = [
  { day: "Mon", volume: 128000000 },
  { day: "Tue", volume: 145000000 },
  { day: "Wed", volume: 132000000 },
  { day: "Thu", volume: 158000000 },
  { day: "Fri", volume: 142000000 },
];

export const MOCK_REGULATORY_SUBMISSIONS: RegulatorySubmission[] = [
  { id: "REG001", regulator: "CBK", reportType: "Monthly AML Report",     period: "March 2024", dueDate: "2024-04-15", submittedDate: "2024-04-10", status: "submitted",    referenceNumber: "CBK-AML-2024-03" },
  { id: "REG002", regulator: "CMA", reportType: "Quarterly Trading Report",period: "Q1 2024",    dueDate: "2024-04-30", submittedDate: undefined,    status: "pending" },
  { id: "REG003", regulator: "FRC", reportType: "Annual Financial Report", period: "FY 2023",    dueDate: "2024-03-31", submittedDate: "2024-03-28", status: "acknowledged", referenceNumber: "FRC-AFR-2024-001" },
  { id: "REG004", regulator: "CBK", reportType: "STR Batch Submission",    period: "April 2024", dueDate: "2024-04-20", submittedDate: undefined,    status: "pending" },
  { id: "REG005", regulator: "CMA", reportType: "Semi-Annual Derivatives", period: "H1 2024",    dueDate: "2024-07-15", submittedDate: undefined,    status: "pending" },
];

/* ============================================================
   RAFIKI AI
   ============================================================ */

export const MOCK_AI_CONVERSATIONS: AIConversation[] = [
  { id: "C001", user: "John Mwangi",    query: "How do I buy Safaricom shares?",           flagged: false, sentiment: "positive", timestamp: "Today 09:14" },
  { id: "C002", user: "Amina Hassan",   query: "What is the minimum investment amount?",    flagged: false, sentiment: "neutral",  timestamp: "Today 09:02" },
  { id: "C003", user: "Peter Kamau",    query: "Can I get guaranteed returns?",             flagged: true,  sentiment: "negative", timestamp: "Today 08:45", flagReason: "Guarantee claim solicitation" },
  { id: "C004", user: "Grace Wanjiku",  query: "How to withdraw my dividends?",             flagged: false, sentiment: "positive", timestamp: "Today 08:30" },
  { id: "C005", user: "David Ochieng",  query: "Is this a pyramid scheme?",                flagged: true,  sentiment: "negative", timestamp: "Today 08:12", flagReason: "Regulatory concern keyword" },
  { id: "C006", user: "Faith Njeri",    query: "What happens if I miss a payment?",         flagged: false, sentiment: "neutral",  timestamp: "Today 07:58" },
  { id: "C007", user: "Samuel Otieno", query: "Can Rafiki predict which stock will rise?", flagged: true,  sentiment: "neutral",  timestamp: "Today 07:40", flagReason: "Investment prediction request" },
];

export const MOCK_BLACKLIST_TOPICS: BlacklistTopic[] = [
  { id: "BL001", phrase: "guaranteed returns",   category: "Regulatory",     addedAt: "2024-01-10", addedBy: "Sarah Kimani", active: true },
  { id: "BL002", phrase: "pyramid scheme",        category: "Regulatory",     addedAt: "2024-01-10", addedBy: "Sarah Kimani", active: true },
  { id: "BL003", phrase: "stock tips",            category: "Compliance",     addedAt: "2024-02-15", addedBy: "John Mwenda",  active: true },
  { id: "BL004", phrase: "insider information",   category: "Compliance",     addedAt: "2024-02-15", addedBy: "John Mwenda",  active: true },
  { id: "BL005", phrase: "pump and dump",         category: "Fraud",          addedAt: "2024-03-01", addedBy: "Sarah Kimani", active: true },
  { id: "BL006", phrase: "crypto wallet",         category: "Out of Scope",   addedAt: "2024-03-20", addedBy: "Alice Njoroge",active: false },
];

export const RAFIKI_SYSTEM_PROMPT = `You are Rafiki, an AI investment assistant for Olkasis — a Kenyan regulated investment platform.

Your role is to help users with:
- Understanding how to use the Olkasis platform
- General financial literacy education
- Information about listed NSE stocks and ETFs
- Explaining investment concepts in simple terms

You MUST NOT:
- Provide specific investment advice or stock tips
- Predict stock prices or market movements
- Promise or imply guaranteed returns
- Discuss cryptocurrency or assets not listed on NSE
- Provide legal or tax advice

Always recommend users consult a certified financial advisor for personalised advice.
Respond in a friendly, professional tone. Prefer simple Kenyan English.

Regulatory context: Olkasis is regulated by the Capital Markets Authority (CMA) Kenya.`;

/* ============================================================
   SYSTEM
   ============================================================ */

export const MOCK_FEATURE_FLAGS: FeatureFlag[] = [
  { id: "ff001", name: "P2P Transfers",      description: "Allow peer-to-peer transfers between users",     enabled: true,  rolloutPercent: 100, lastModifiedBy: "Sarah Kimani", lastModifiedAt: "2024-03-01" },
  { id: "ff002", name: "Fractional Shares",  description: "Enable fractional share purchases",              enabled: true,  rolloutPercent: 100, lastModifiedBy: "Sarah Kimani", lastModifiedAt: "2024-02-15" },
  { id: "ff003", name: "Crypto Integration", description: "Connect crypto wallet functionality",            enabled: false, rolloutPercent: 0,   lastModifiedBy: "Sarah Kimani", lastModifiedAt: "2024-01-10" },
  { id: "ff004", name: "Rafiki AI Chat",     description: "AI-powered investment assistant",                enabled: true,  rolloutPercent: 100, lastModifiedBy: "Alice Njoroge",lastModifiedAt: "2024-03-10" },
  { id: "ff005", name: "Auto-Invest",        description: "Automated recurring investment plans",           enabled: false, rolloutPercent: 0,   lastModifiedBy: "Sarah Kimani", lastModifiedAt: "2024-01-20" },
  { id: "ff006", name: "Social Trading",     description: "Copy trading from top performers",               enabled: false, rolloutPercent: 5,   lastModifiedBy: "Michael Ouma", lastModifiedAt: "2024-04-01" },
  { id: "ff007", name: "Derivatives Trading",description: "Options and futures trading for approved users", enabled: true,  rolloutPercent: 20,  lastModifiedBy: "Sarah Kimani", lastModifiedAt: "2024-04-10" },
];

export const MOCK_TRADING_HOLIDAYS: TradingHoliday[] = [
  { date: "2024-05-01", name: "Labour Day",              type: "public_holiday" },
  { date: "2024-06-01", name: "Madaraka Day",            type: "public_holiday" },
  { date: "2024-10-10", name: "Huduma Day",              type: "public_holiday" },
  { date: "2024-10-20", name: "Mashujaa Day",            type: "public_holiday" },
  { date: "2024-12-12", name: "Jamhuri Day",             type: "public_holiday" },
  { date: "2024-12-25", name: "Christmas Day",           type: "public_holiday" },
  { date: "2024-12-26", name: "Boxing Day",              type: "public_holiday" },
  { date: "2024-04-19", name: "NSE Technical Maintenance",type: "exchange_holiday" },
];

export const MOCK_FEE_CONFIG: FeeConfig[] = [
  { id: "FEE001", name: "Trading Commission",        description: "Applied per executed order",             value: 0.18, unit: "percent",   appliesTo: "All orders" },
  { id: "FEE002", name: "CMA Levy",                  description: "Regulatory levy on trades",              value: 0.12, unit: "percent",   appliesTo: "All orders" },
  { id: "FEE003", name: "NSE Commission",             description: "Exchange commission",                    value: 0.06, unit: "percent",   appliesTo: "All orders" },
  { id: "FEE004", name: "P2P Transfer Fee",           description: "Fee on P2P transfers above KSH 1,000",  value: 0,    unit: "fixed_kes", appliesTo: "P2P > KSH 1,000" },
  { id: "FEE005", name: "M-Pesa Withdrawal Fee",      description: "M-Pesa paybill withdrawal charges",     value: 0,    unit: "fixed_kes", appliesTo: "M-Pesa withdrawals" },
  { id: "FEE006", name: "Bank Withdrawal Fee",        description: "EFT bank transfer fee",                 value: 200,  unit: "fixed_kes", appliesTo: "Bank withdrawals" },
  { id: "FEE007", name: "Derivatives Platform Fee",   description: "Per contract, options trades",           value: 0.25, unit: "percent",   appliesTo: "Derivatives orders" },
];

/* ============================================================
   SETTINGS
   ============================================================ */

export const MOCK_SESSIONS: SessionRecord[] = [
  { id: "SES001", device: "MacBook Pro",  browser: "Chrome 122",  ip: "196.201.12.45", location: "Nairobi, Kenya",  lastSeen: "Now",                 current: true },
  { id: "SES002", device: "iPhone 15",    browser: "Safari 17",   ip: "196.201.12.46", location: "Nairobi, Kenya",  lastSeen: "2024-04-13 07:30",    current: false },
  { id: "SES003", device: "Windows PC",   browser: "Firefox 123", ip: "41.80.195.22",  location: "Mombasa, Kenya",  lastSeen: "2024-04-12 18:00",    current: false },
];

export const MOCK_IP_WHITELIST: IPWhitelistEntry[] = [
  { id: "IP001", ip: "196.201.12.0/24", label: "Nairobi Office",   addedAt: "2024-01-10", addedBy: "Sarah Kimani" },
  { id: "IP002", ip: "41.80.195.0/24",  label: "Mombasa Office",   addedAt: "2024-02-01", addedBy: "Sarah Kimani" },
  { id: "IP003", ip: "102.68.0.0/16",   label: "VPN Range (KE)",   addedAt: "2024-03-15", addedBy: "Michael Ouma" },
];

export const MOCK_API_KEYS: APIKey[] = [
  { id: "KEY001", name: "Analytics Dashboard", prefix: "olk_live_eJx9K...", permissions: ["read:users", "read:reports"], lastUsed: "2024-04-13 09:00", createdAt: "2024-01-15", status: "active" },
  { id: "KEY002", name: "Mobile App Backend",  prefix: "olk_live_mK72P...", permissions: ["read:users", "write:orders", "read:market"], lastUsed: "2024-04-13 11:30", createdAt: "2024-02-20", status: "active" },
  { id: "KEY003", name: "Backup Integration",  prefix: "olk_live_bR8nQ...", permissions: ["read:users"], lastUsed: "2024-03-01 12:00", createdAt: "2024-01-05", status: "revoked" },
];

export const MOCK_NOTIFICATION_PREFS: NotificationPreference[] = [
  { id: "NP001", label: "Critical AML Alerts",     inApp: true,  email: true,  sms: true  },
  { id: "NP002", label: "KYC Queue Updates",        inApp: true,  email: true,  sms: false },
  { id: "NP003", label: "System Downtime Alerts",   inApp: true,  email: true,  sms: true  },
  { id: "NP004", label: "Support Ticket Assigned",  inApp: true,  email: false, sms: false },
  { id: "NP005", label: "Daily Summary Email",      inApp: false, email: true,  sms: false },
  { id: "NP006", label: "New Admin Login",          inApp: true,  email: true,  sms: false },
  { id: "NP007", label: "Failed Transaction Spike", inApp: true,  email: true,  sms: false },
];

/* ============================================================
   ADMINS
   ============================================================ */

export const MOCK_ADMINS: AdminUser[] = [
  { id: "ADM001", name: "Sarah Kimani",  email: "sarah.kimani@olkasis.com",  role: "super_admin",    status: "active",   lastLogin: "2024-04-13 09:00", ip: "196.201.12.45" },
  { id: "ADM002", name: "John Mwenda",   email: "john.mwenda@olkasis.com",   role: "compliance",     status: "active",   lastLogin: "2024-04-13 08:30", ip: "196.201.12.46" },
  { id: "ADM003", name: "Alice Njoroge", email: "alice.njoroge@olkasis.com", role: "customer_support",status: "active",  lastLogin: "2024-04-13 07:45", ip: "196.201.12.47" },
  { id: "ADM004", name: "Michael Ouma",  email: "michael.ouma@olkasis.com",  role: "operations",     status: "active",   lastLogin: "2024-04-12 17:00", ip: "196.201.12.48" },
  { id: "ADM005", name: "Priya Patel",   email: "priya.patel@olkasis.com",   role: "data_analyst",   status: "inactive", lastLogin: "2024-04-10 14:00", ip: "196.201.12.49" },
];

/* ============================================================
   NOTIFICATIONS
   ============================================================ */

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "N001", category: "aml",     title: "Critical AML Alert",      message: "Circular transfer — James Mwangi, Ksh. 450K",  timestamp: "2024-04-13 09:45", read: false, href: "/compliance/aml-alerts" },
  { id: "N002", category: "kyc",     title: "Urgent KYC Review",       message: "Carol Waweru — risk score 22, awaiting review", timestamp: "2024-04-13 11:45", read: false, href: "/kyc" },
  { id: "N003", category: "ticket",  title: "Overdue Ticket",          message: "TKT002 — Withdrawal overdue, unassigned",       timestamp: "2024-04-13 07:30", read: false, href: "/support/tickets" },
  { id: "N004", category: "trading", title: "Force Liquidation Queued",message: "Lucy Akinyi — DRV004 at 95% margin",            timestamp: "2024-04-13 11:00", read: true,  href: "/trading/derivatives" },
  { id: "N005", category: "system",  title: "Feature Flag Updated",    message: "Derivatives Trading enabled for 20% of users",  timestamp: "2024-04-13 09:55", read: true,  href: "/system" },
  { id: "N006", category: "kyc",     title: "KYC Submitted",           message: "Brian Mutua — new KYC in queue",                timestamp: "2024-04-13 11:00", read: true,  href: "/kyc" },
];

/* ============================================================
   WAITLIST
   ============================================================ */

export const MOCK_WAITLIST = [
  { id: "WL001", name: "Kariuki Mwangi",   email: "kariuki.mwangi@email.com",  region: "Nairobi",  joinedAt: "2024-04-10 14:30", status: "pending" },
  { id: "WL002", name: "Zainab Mohamed",   email: "zainab.m@email.com",         region: "Mombasa",  joinedAt: "2024-04-11 09:15", status: "pending" },
  { id: "WL003", name: "Thomas Kipchoge",  email: "t.kipchoge@email.com",       region: "Eldoret",  joinedAt: "2024-04-12 16:45", status: "pending" },
  { id: "WL004", name: "Mercy Okonkwo",    email: "mercy.okonkwo@email.com",    region: "Nairobi",  joinedAt: "2024-04-12 11:20", status: "approved" },
  { id: "WL005", name: "Hassan Abdi",      email: "hassan.abdi@email.com",      region: "Kisumu",   joinedAt: "2024-04-13 08:00", status: "pending" },
  { id: "WL006", name: "Beatrice Kiplagat",email: "beatrice.k@email.com",       region: "Nakuru",   joinedAt: "2024-04-13 10:30", status: "pending" },
  { id: "WL007", name: "Juma Salim",       email: "juma.salim@email.com",       region: "Mombasa",  joinedAt: "2024-04-13 12:15", status: "approved" },
  { id: "WL008", name: "Asha Patel",       email: "asha.patel@email.com",       region: "Nairobi",  joinedAt: "2024-04-13 13:45", status: "pending" },
  { id: "WL009", name: "Daniel Kipchoge",  email: "daniel.k@email.com",         region: "Thika",    joinedAt: "2024-04-13 14:20", status: "pending" },
  { id: "WL010", name: "Fatima Hassan",    email: "fatima.hassan@email.com",    region: "Mombasa",  joinedAt: "2024-04-13 15:00", status: "pending" },
];