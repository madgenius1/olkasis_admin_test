/* ============================================================
   OLKASIS ADMIN — Consolidated TypeScript Types
   All entity types used across the dashboard.
   Swap mock data for API calls using these same shapes.
   ============================================================ */

// ── Auth ─────────────────────────────────────────────────────

export type AdminRole =
  | "super_admin"
  | "compliance"
  | "operations"
  | "customer_support"
  | "data_analyst";
  // | "product";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "inactive";
  lastLogin: string;
  ip: string;
  avatarUrl?: string;
}

// ── Platform Users ────────────────────────────────────────────

export type KYCStatus   = "verified" | "pending" | "rejected" | "not_submitted";
export type AccountType = "Individual" | "Joint" | "Junior";
export type UserStatus  = "active" | "inactive" | "suspended";

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: KYCStatus;
  accountType: AccountType;
  status: UserStatus;
  portfolioValue: number;
  registeredAt: string;
  location: string;
  avatarUrl?: string;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  event: string;
  detail: string;
  ip: string;
  timestamp: string;
}

export interface AdminNote {
  id: string;
  userId: string;
  authorId: string;
  authorName: string;
  note: string;
  createdAt: string;
  flagged: boolean;
}

// ── KYC ──────────────────────────────────────────────────────

export type KYCPriority = "urgent" | "high" | "normal";
export type IDType = "National ID" | "Passport" | "Military ID";

export interface KYCQueueItem {
  id: string;
  userId: string;
  name: string;
  accountType: AccountType;
  submittedAt: string;
  waitTime: string;
  accountValue: number;
  idType: IDType;
  riskScore: number;
  priority: KYCPriority;
}

export interface KYCDocument {
  id: string;
  kycId: string;
  type: "id_front" | "id_back" | "selfie" | "proof_of_address" | "guardian_id" | "consent_form";
  url: string;
  uploadedAt: string;
  verified: boolean;
}

export interface JointKYCRecord {
  id: string;
  primaryHolder: PlatformUser;
  secondaryHolder: Partial<PlatformUser>;
  primaryKYCStatus: KYCStatus;
  secondaryKYCStatus: KYCStatus;
  consentSigned: boolean;
  submittedAt: string;
}

export interface JuniorKYCRecord {
  id: string;
  minor: Partial<PlatformUser>;
  guardian: PlatformUser;
  guardianKYCStatus: KYCStatus;
  relationshipProof: boolean;
  parentalConsentSigned: boolean;
  submittedAt: string;
}

// ── Compliance ────────────────────────────────────────────────

export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertStatus   = "open" | "reviewing" | "resolved" | "escalated";

export interface AMLAlert {
  id: string;
  type: string;
  user: string;
  userId?: string;
  amount: number;
  threshold: number;
  timestamp: string;
  status: AlertStatus;
  severity: AlertSeverity;
  notes?: string;
}

export interface AuditLog {
  id: string;
  admin: string;
  adminId?: string;
  action: string;
  target: string;
  ip: string;
  timestamp: string;
  category?: "user" | "compliance" | "system" | "trading" | "support";
}

export interface STRRecord {
  id: string;
  alertId: string;
  subject: string;
  userId: string;
  transactionIds: string[];
  narrative: string;
  status: "draft" | "submitted" | "acknowledged" | "under_review";
  submittedAt?: string;
  referenceNumber?: string;
  submittedBy: string;
}

// ── Trading ──────────────────────────────────────────────────

export type OrderType   = "BUY" | "SELL";
export type OrderStatus = "pending" | "filled" | "cancelled" | "rejected" | "partial";

export interface Order {
  id: string;
  user: string;
  userId?: string;
  stock: string;
  type: OrderType;
  quantity: number;
  price: number;
  value: number;
  status: OrderStatus;
  placedAt: string;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  value: number;
  gain: number;
  gainPercent: number;
  sector: string;
}

export interface NSEStock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  dividend: number;
}

export interface NSEOption {
  symbol: string;
  underlying: string;
  type: "CALL" | "PUT";
  strikePrice: number;
  expiry: string;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVol: number;
}

export interface DerivativePosition {
  id: string;
  userId: string;
  userName: string;
  instrument: string;
  instrumentType: "option" | "future" | "etf";
  side: "LONG" | "SHORT";
  quantity: number;
  notionalValue: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  marginUsed: number;
  marginPercent: number;
  liquidationPrice: number;
  status: "active" | "margin_call" | "pending_liquidation";
}

export interface DerivativesApproval {
  id: string;
  userId: string;
  userName: string;
  email: string;
  appliedAt: string;
  quizScore: number;
  riskProfile: "conservative" | "moderate" | "aggressive";
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// ── Wallets & Payments ────────────────────────────────────────

export type TxType   = "deposit" | "withdrawal" | "transfer" | "fee" | "dividend" | "p2p";
export type TxStatus = "completed" | "processing" | "pending" | "failed" | "cancelled";
export type TxMethod = "M-Pesa" | "Bank" | "Card" | "P2P" | "System";

export interface Transaction {
  id: string;
  user: string;
  userId?: string;
  type: TxType;
  method: TxMethod;
  amount: number;
  fee: number;
  status: TxStatus;
  timestamp: string;
  ref: string;
  description?: string;
  category?: string;
}

export interface ReconciliationItem {
  id: string;
  mpesaRef: string;
  amount: number;
  phone: string;
  timestamp: string;
  status: "matched" | "unmatched" | "manual_review";
  matchedTxId?: string;
  discrepancy?: number;
}

// ── P2P ──────────────────────────────────────────────────────

export type DisputeStatus = "open" | "investigating" | "resolved" | "escalated";

export interface P2PTransfer {
  id: string;
  sender: string;
  senderId?: string;
  recipient: string;
  recipientId?: string;
  amount: number;
  type?: string;
  method?: string;
  status: "completed" | "pending" | "disputed" | "failed";
  timestamp: string;
  reason?: string;
}

export interface P2PDispute {
  id: string;
  transferId: string;
  raisedBy: string;
  sender: string;
  receiver: string;
  amount: number;
  reason: string;
  status: DisputeStatus;
  openedAt: string;
  notes?: string;
}

// ── Support ──────────────────────────────────────────────────

export type TicketPriority = "urgent" | "high" | "medium" | "low";
export type TicketStatus   = "open" | "in-progress" | "resolved" | "closed";
export type TicketCategory = "KYC" | "Payments" | "Account" | "Technical" | "Trading" | "General";

export interface SupportTicket {
  id: string;
  user: string;
  userId?: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  agent: string;
  openedAt: string;
  sla: string;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  sender: string;
  senderType: "user" | "agent";
  content: string;
  sentAt: string;
}

export interface CannedResponse {
  id: string;
  title: string;
  category: string;
  content: string;
}

export interface LiveChatSession {
  id: string;
  userId: string;
  userName: string;
  waitingTime: string;
  topic: string;
  status: "waiting" | "active" | "resolved";
  assignedAgent?: string;
}

// ── Marketing ────────────────────────────────────────────────

export type CampaignStatus = "active" | "paused" | "scheduled" | "ended";
export type CampaignType   = "Referral" | "Onboarding" | "Trading" | "Retention" | "Reactivation";

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  reward: string;
  uses: number;
  status: CampaignStatus;
  startDate: string;
  endDate?: string;
  budget?: number;
  spent?: number;
  conversions?: number;
  roi?: number;
}

export interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referredName: string;
  status: "pending" | "converted" | "rewarded";
  joinedAt: string;
  rewardAmount: number;
}

export interface ChurnPrediction {
  userId: string;
  userName: string;
  churnScore: number; // 0-100
  lastActivity: string;
  predictedChurnDate: string;
  riskLevel: "high" | "medium" | "low";
  primaryReason: string;
}

// ── Risk ─────────────────────────────────────────────────────

export type RiskLevel = "critical" | "high" | "medium" | "low";

export interface RiskIncident {
  id: string;
  type: string;
  severity: RiskLevel;
  status: "open" | "investigating" | "resolved";
  time: string;
  userId?: string;
  userName?: string;
  description?: string;
}

export interface MarginCall {
  userId: string;
  userName: string;
  positionId: string;
  instrument: string;
  currentMargin: number;
  maintenanceMargin: number;
  deficit: number;
  callTime: string;
  dueBy: string;
}

// ── Reports ──────────────────────────────────────────────────

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  fees: number;
  trading: number;
  p2p: number;
  withdrawal: number;
}

export interface RegulatorySubmission {
  id: string;
  regulator: "CBK" | "CMA" | "FRC";
  reportType: string;
  period: string;
  dueDate: string;
  submittedDate?: string;
  status: "pending" | "submitted" | "acknowledged" | "overdue";
  referenceNumber?: string;
}

// ── Rafiki AI ────────────────────────────────────────────────

export type Sentiment = "positive" | "neutral" | "negative";

export interface AIConversation {
  id: string;
  userId?: string;
  user: string;
  query: string;
  flagged: boolean;
  sentiment: Sentiment;
  timestamp: string;
  flagReason?: string;
  messages?: AIMessage[];
  verdict?: "approved" | "rejected" | "escalated";
  reviewedBy?: string;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface BlacklistTopic {
  id: string;
  phrase: string;
  category: string;
  addedAt: string;
  addedBy: string;
  active: boolean;
}

// ── System ───────────────────────────────────────────────────

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercent?: number;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface TradingHoliday {
  date: string;
  name: string;
  type: "public_holiday" | "exchange_holiday" | "special_session";
}

export interface FeeConfig {
  id: string;
  name: string;
  description: string;
  value: number;
  unit: "percent" | "fixed_kes";
  appliesTo: string;
}

// ── Settings ─────────────────────────────────────────────────

export interface SessionRecord {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastSeen: string;
  current: boolean;
}

export interface IPWhitelistEntry {
  id: string;
  ip: string;
  label: string;
  addedAt: string;
  addedBy: string;
}

export interface APIKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  lastUsed?: string;
  createdAt: string;
  status: "active" | "revoked";
}

export interface NotificationPreference {
  id: string;
  label: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

// ── Dashboard Widgets ─────────────────────────────────────────

export interface SystemHealth {
  uptime: string;
  apiLatencyMs: number;
  failedTxRate: string;
  openTickets: number;
  pendingKYC: number;
  amlAlerts: number;
}

export interface Notification {
  id: string;
  category: "aml" | "kyc" | "ticket" | "system" | "trading";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  href?: string;
}