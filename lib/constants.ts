import type { TicketCategory, TicketPriority, TicketStatus } from "./types";

export const TICKET_STATUSES: TicketStatus[] = ["Open", "In Progress", "Resolved", "Closed"];
export const TICKET_PRIORITIES: TicketPriority[] = ["Critical", "High", "Medium", "Low"];
export const TICKET_CATEGORIES: TicketCategory[] = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_MB = 5;
export const ATTACHMENT_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf";

export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

const PRODUCTION_STAGES = [
  "Manuscript Received",
  "Editing",
  "Cover Design",
  "Typesetting",
  "Proofreading",
  "ISBN Assignment",
  "Printing",
  "Distribution Setup",
] as const;
export const PUBLISHED_STATUS = "Published & Live";
export const BOOK_STATUSES = [...PRODUCTION_STAGES.map((s) => `In Production - ${s}`), PUBLISHED_STATUS];
export const PRINT_PARTNERS = ["In-House", "Repro India", "Epitome Books"] as const;
export const PLATFORMS = ["Amazon India", "Flipkart", "Amazon US", "Amazon UK", "BookLeaf Store"] as const;
