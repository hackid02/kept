export type ReceiptStatus =
  | "ACTIVE"
  | "BLOCKED"
  | "FULFILLED"
  | "UPHELD"
  | "DISMISSED";

export interface Receipt {
  id: string;
  company: string;
  company_name: string;
  user: string;
  promise: string;
  amount: number;
  due: string;
  transcript: string;
  status: ReceiptStatus;
  check_reason: string;
  proof: string;
  evidence: string;
  verdict_reason: string;
  payout: number;
  created_at: string;
  updated_at: string;
  tx?: string; // transaction hash when on-chain
}

export interface Company {
  address: string;
  name: string;
  envelope: string;
  bond: number;
  committed: number;
  blocked: number;
  fulfilled: number;
  upheld: number;
  dismissed: number;
  kept_rate: number; // basis points, -1 = no data
  registered_at?: string;
}

export interface Stats {
  companies: number;
  receipts: number;
  active: number;
  blocked: number;
  fulfilled: number;
  upheld: number;
  dismissed: number;
  paid_out: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DetectedPromise {
  promise: string;
  amount: number;
  due: string; // YYYY-MM-DD
}

export type Backend = "chain" | "sim";
