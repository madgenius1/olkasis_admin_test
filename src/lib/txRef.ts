/**
 * OLKASIS — Transaction Reference System
 *
 * Every transaction reference carries a 3-character prefix that identifies
 * the payment method / transaction type. This makes references self-describing
 * and traceable without querying the database.
 *
 * Prefix   Method/Type         Example
 * ──────   ──────────────────  ───────────────────
 *  MPE     M-Pesa mobile       MPE240413001
 *  BNK     Bank EFT/RTGS       BNK240413002
 *  CRD     Debit/Credit card   CRD240413003
 *  P2P     Peer-to-peer        P2P240413004
 *  FEE     Platform fee        FEE240413008
 *  DIV     Dividend payout     DIV240413009
 *  WLT     Internal wallet     WLT240413010
 *  RVS     Reversal            RVS240413011
 *  STL     Settlement          STL240413012
 *  DPS     Dividend reinvest   DPS240413013
 */

/* ─────────────────────────────────────────────────────────────
   PREFIX MAP
───────────────────────────────────────────────────────────── */
export const TX_PREFIX = {
  mpesa:      "MPE",
  bank:       "BNK",
  card:       "CRD",
  p2p:        "P2P",
  fee:        "FEE",
  dividend:   "DIV",
  wallet:     "WLT",
  reversal:   "RVS",
  settlement: "STL",
} as const;

export type TxPrefix = typeof TX_PREFIX[keyof typeof TX_PREFIX];

/** All recognised prefixes in one array — useful for badge logic */
export const ALL_PREFIXES = Object.values(TX_PREFIX) as TxPrefix[];

/* ─────────────────────────────────────────────────────────────
   GENERATOR
───────────────────────────────────────────────────────────── */

/**
 * Build a reference code: {PREFIX}{YYMMDD}{SEQ}
 * @param prefix  3-char prefix from TX_PREFIX
 * @param date    ISO date string, defaults to today
 * @param seq     Sequence number, zero-padded to 3 digits
 */
export function buildRef(prefix: TxPrefix, seq: number, date?: string): string {
  const d   = date ? new Date(date) : new Date();
  const yy  = String(d.getFullYear()).slice(2);
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const dd  = String(d.getDate()).padStart(2, "0");
  const s   = String(seq).padStart(3, "0");
  return `${prefix}${yy}${mm}${dd}${s}`;
}

/* ─────────────────────────────────────────────────────────────
   PARSER
───────────────────────────────────────────────────────────── */
export interface ParsedRef {
  prefix:    TxPrefix | "UNKNOWN";
  label:     string;
  dateStr:   string;   // "YYMMDD"
  sequence:  number;
  raw:       string;
}

const PREFIX_LABELS: Record<TxPrefix, string> = {
  MPE: "M-Pesa",
  BNK: "Bank Transfer",
  CRD: "Card",
  P2P: "P2P Transfer",
  FEE: "Platform Fee",
  DIV: "Dividend",
  WLT: "Wallet Transfer",
  RVS: "Reversal",
  STL: "Settlement",
};

export function parseRef(ref: string): ParsedRef {
  const prefix = ref.slice(0, 3) as TxPrefix;
  const knownPrefix = ALL_PREFIXES.includes(prefix) ? prefix : "UNKNOWN";

  return {
    prefix:   knownPrefix,
    label:    knownPrefix !== "UNKNOWN" ? PREFIX_LABELS[knownPrefix] : "Unknown",
    dateStr:  ref.slice(3, 9),
    sequence: parseInt(ref.slice(9), 10) || 0,
    raw:      ref,
  };
}

/* ─────────────────────────────────────────────────────────────
   BADGE COLOUR
   Returns a Tailwind className pair for a reference prefix
───────────────────────────────────────────────────────────── */
export function refBadgeClass(ref: string): string {
  const { prefix } = parseRef(ref);
  switch (prefix) {
    case "MPE": return "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800";
    case "BNK": return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "CRD": return "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800";
    case "P2P": return "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800";
    case "FEE": return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600";
    case "DIV": return "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    case "WLT": return "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800";
    case "RVS": return "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
    case "STL": return "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800";
    default:    return "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600";
  }
}