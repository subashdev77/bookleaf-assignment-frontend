export type Role = "author" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
}

export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type TicketPriority = "Critical" | "High" | "Medium" | "Low";
export type TicketCategory =
  | "Royalty & Payments"
  | "ISBN & Metadata Issues"
  | "Printing & Quality"
  | "Distribution & Availability"
  | "Book Status & Production Updates"
  | "General Inquiry";
export type ValueSource = "ai" | "rules" | "admin" | null;

export interface Book {
  id: string;
  externalId: string | null;
  title: string;
  isbn: string | null;
  genre: string | null;
  publicationDate: string | null;
  status: string;
  isPublished: boolean;
  mrp: number | null;
  copiesSold: number;
  totalRoyaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  lastRoyaltyPayoutDate: string | null;
  distribution: unknown;
  details: Record<string, unknown> | null;
  updatedAt: string;
}

interface BookSummary {
  id: string;
  title: string;
  isbn: string | null;
  status: string;
  isPublished: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  category: TicketCategory | null;
  priority: TicketPriority | null;
  book: BookSummary | null;
  attachments: Attachment[];
  awaitingReplyFrom: "admin" | "author" | null;
  lastMessageAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AiTriage {
  status: "pending" | "completed" | "failed" | "disabled";
  category: TicketCategory | null;
  categoryConfidence: number | null;
  priority: TicketPriority | null;
  priorityConfidence: number | null;
  reason: string | null;
  model: string | null;
  errorCode: string | null;
  completedAt: string | null;
}

export interface AdminTicket extends Ticket {
  author: { id: string; name?: string; email?: string };
  assignedAdmin: { id: string; name: string } | null;
  categorySource: ValueSource;
  prioritySource: ValueSource;
  ai: AiTriage | null;
  aiUsage: { calls: number; inputTokens: number; outputTokens: number } | null;
  isActive: boolean;
  ageHours: number;
  isAging: boolean;
}

export interface Message {
  id: string;
  ticketId: string;
  body: string;
  visibility: "public" | "internal";
  senderRole: Role;
  sender: { id: string; name?: string };
  aiAssisted?: boolean;
  createdAt: string;
}

export interface Draft {
  text: string;
  source: "ai" | "template";
  warnings: string[];
  model: string | null;
  generatedAt: string;
  cached: boolean;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export type AccountStatus = "active" | "inactive" | "invitation_pending";

export interface AuthorAccount {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  externalId: string | null;
  status: AccountStatus;
  lastLoginAt: string | null;
  createdAt: string;
  counts?: { books: number; tickets: number; openTickets: number };
}

export interface OneTimeLinkResult {
  url: string;
  expiresAt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}
