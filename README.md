# BookLeaf Support Portal: Frontend

Next.js web app for the BookLeaf Author Support & Communication Portal. It has two portals in one app: an **Author Portal** and an **Admin (Support Operations) Portal**.

- **Backend API:** see [`../backend/README.md`](../backend/README.md) and [`../backend/docs/API.md`](../backend/docs/API.md)
- **Project overview:** [`../README.md`](../README.md)

---

## Contents

1. [Tech stack](#tech-stack)
2. [Getting started](#getting-started)
3. [Environment variables](#environment-variables)
4. [Scripts](#scripts)
5. [Pages](#pages)
6. [Folder structure](#folder-structure)
7. [How it works](#how-it-works)
8. [UI kit](#ui-kit)
9. [Deployment](#deployment)

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Cache Components), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Forms | react-hook-form |
| HTTP | axios |
| Real-time | socket.io-client |
| Icons | lucide-react |

---

## Getting started

**Prerequisites:** Node.js ≥ 20.9 and the backend running (locally on port 5000, or the deployed API).

```bash
cd frontend
npm install
# create .env (see Environment variables below)
npm run dev        # http://localhost:3000
```

Sign in with a demo account: admin `admin@bookleaf.demo` / `Admin@123`, or author `priya.sharma@email.com` / `Author@123`. The login page also has "Fill Admin" / "Fill Author" buttons.

---

## Environment variables

Create `frontend/.env`:

```env
API_PROXY_TARGET=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true
```

To use the deployed backend instead, set both URLs to `https://bookleaf-assignment-backend-vome.onrender.com`.

| Variable | Description |
|---|---|
| `API_PROXY_TARGET` | Where `/api/*` requests are proxied (the Express API). **Resolved at build time**: set it before `next build`, and rebuild after changing it. |
| `NEXT_PUBLIC_SOCKET_URL` | Public API URL used for the Socket.IO connection (WebSockets can't go through the rewrite proxy). |
| `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS` | `true` shows the "Demo accounts" helper on the login page; `false` hides it. |

No secrets live in the frontend: there is no API key, and the session is an httpOnly cookie that JavaScript cannot read.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload on http://localhost:3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

Type-check with `npx tsc --noEmit`.

---

## Pages

### Public

| Route | Page |
|---|---|
| `/login` | Sign in (redirects to the right portal by role; honours `?next=` for internal paths only) |
| `/accept-invitation?token=…` | New author sets a password from an invitation link and is signed in |
| `/reset-password?token=…` | Set a new password from an admin-issued reset link |

### Author portal

| Route | Page |
|---|---|
| `/dashboard` | Books, royalty earned/paid/pending, open tickets, recent books and tickets |
| `/books` | My Books with search and pagination (table on desktop, cards on mobile) |
| `/books/[id]` | Full book record, including per-copy royalty, print partner and platforms |
| `/tickets` | My Tickets with status filter and search; "New reply" markers |
| `/tickets/new` | Raise a ticket: book or General / Account Level, subject, description, up to 3 attachments |
| `/tickets/[id]` | Conversation with the support team; reply, reopen a resolved ticket |
| `/account` | Profile (name, phone) and change password |

### Admin portal

| Route | Page |
|---|---|
| `/admin` | Author and ticket stats, aging tickets, needs-attention list, recent tickets, AI health and override rate |
| `/admin/authors` | Author Management: search, status filter, create author, resend invite, reset password, deactivate/reactivate |
| `/admin/authors/[id]` | Author profile, books (add/edit), tickets and account activity log |
| `/admin/tickets` | Ticket Management queue: search, filters (status, category, priority, assignee, date range), sorting, pagination |
| `/admin/tickets/[id]` | Ticket workspace: conversation, AI-drafted reply editor, internal notes, status/category/priority/assignee, book and author context |
| `/admin/account` | Profile and change password |

---

## Folder structure

```
frontend/
├── next.config.ts                 /api/* rewrite proxy to the backend
├── app/                           routes (App Router)
│   ├── layout.tsx                 root layout: fonts, Auth + Toast providers
│   ├── page.tsx                   redirects to the user's portal
│   ├── login/, accept-invitation/, reset-password/
│   ├── (author)/                  author portal (layout guards role "author")
│   │   ├── dashboard/, books/, books/[id]/, tickets/, tickets/new/, tickets/[id]/, account/
│   └── admin/                     admin portal (layout guards role "admin")
│       ├── page.tsx (dashboard), authors/, authors/[id]/, tickets/, tickets/[id]/, account/
├── components/
│   ├── ui/                        UI kit (see below), exported from index.ts
│   ├── layout/                    AppShell (sidebar + top bar), Breadcrumbs, RequireRole
│   ├── providers/                 AuthProvider, ToastProvider, RealtimeProvider
│   ├── auth/                      AuthLayout, SetPasswordForm
│   ├── account/                   AccountSettings
│   ├── authors/                   AccountStatusBadge, CreateAuthorDialog, AuthorRowActions,
│   │                              AuthorActionDialogs, OneTimeLinkNotice, useAuthorActions
│   ├── books/                     BookStatus, BookDetailsGrid, BookFormDialog
│   └── tickets/                   badges, Conversation, Attachments, ReplyComposer,
│                                  TicketManagementPanel, TicketContextCard
├── hooks/useApi.ts                data-fetching hook
└── lib/
    ├── api.ts                     axios client, error helpers, session-expiry event
    ├── types.ts                   shared TypeScript types
    ├── constants.ts               statuses, categories, priorities, book options, socket URL
    └── format.ts                  ₹ currency, dates, relative time, file sizes
```

---

## How it works

- **Same-origin API:** the browser only calls `/api/v1/*` on the frontend's own origin, and `next.config.ts` rewrites those requests to `API_PROXY_TARGET`. The session cookie is therefore first-party (`SameSite=Lax`) even when the API runs on another domain.
- **Auth:** `AuthProvider` loads the user from `GET /auth/me`. `RequireRole` guards each portal and redirects to `/login` with the reason (session expired / account deactivated). Real enforcement is always on the API.
- **Data fetching:** `useApi(fetcher, deps)` loads data, ignores stale responses, and exposes `reload()` (background refetch) and `setData()` (in-place patches).
- **Real-time:** `RealtimeProvider` opens one Socket.IO connection per signed-in tab, using a short-lived token from `/auth/socket-token`. `useRealtimeEvent(event, handler)` subscribes components to updates:
  - ticket lists and conversations update in place
  - the admin queue shows a "new tickets" banner
  - dashboards refetch
  - the top bar shows a Live/Offline indicator
- **Breadcrumbs:** the top bar shows the current page and its trail (e.g. *Dashboard › Ticket Management › BL-1007*). Detail pages name themselves with `usePageCrumb(label)`.
- **AI drafting UX:** opening an active ticket requests a draft; it is served from the server cache when nothing changed. The draft goes into an editable textarea with "check before sending", and sending requires a confirmation. When AI is unavailable, a policy template is offered instead.

---

## UI kit

`components/ui/` contains the shared building blocks, each in its own file and exported from `components/ui/index.ts`:

| Component | Notes |
|---|---|
| `Button`, `ButtonLink` | Variants: primary, secondary, ghost, danger, ai, danger-outline, success-outline, ai-outline; sizes sm/md; loading state |
| `Card`, `CardHeader`, `StatCard` | Surfaces and dashboard stat tiles |
| `PageHeader` | Page title, description and actions |
| `Alert`, `EmptyState`, `ErrorState`, `Skeleton`, `TableSkeleton` | Feedback and loading states |
| `Field`, `Input`, `Textarea` | Labelled form fields with error/hint text |
| `Select` | Custom dropdown: ARIA listbox, keyboard navigation, type-ahead, check mark on the selected option, auto-flips up or left near screen edges |
| `DatePicker` | Custom calendar: Monday-first grid, today highlight, min/max limits, Clear/Today, full keyboard support |
| `Modal`, `ConfirmDialog` | Native `<dialog>`-based dialogs |
| `Pagination` | "Showing x–y of z" with prev/next |

---

## Deployment

On Vercel (or any Node host):

1. Root directory `frontend`.
2. Set `API_PROXY_TARGET` and `NEXT_PUBLIC_SOCKET_URL` to the backend URL (e.g. `https://bookleaf-assignment-backend-vome.onrender.com`) **before building**, because rewrites are fixed at build time.
3. Set `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true` for the reviewers' demo, or `false` otherwise.
4. Add the frontend URL to the backend's `CLIENT_URL` and `FRONTEND_URL`, so CORS, sockets and invitation links work.
