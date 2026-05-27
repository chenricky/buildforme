# BuildForMe — Custom Furniture Marketplace
## Project Plan & Resume Guide

> Use this document to resume the build at any time. It captures the full scope,
> architecture, completed work, and remaining steps so a fresh session can pick
> up exactly where you left off.

---

## 1. Project Overview

**BuildForMe** is a local-only prototype of a freelancing marketplace where
**customers** post custom furniture requests (with reference images) and
**artisans** submit bids to build them. All data is stored client-side in
`localStorage`. No backend, no auth APIs, no external databases.

### Key Product Features
- Public marketplace feed of furniture requests
- Customers can post new projects (title, description, dimensions, budget, image)
- Artisans can browse projects and submit bids (amount, days, proposal)
- Customers can review incoming bids and accept one (which auto-rejects others
  and moves the project to `in_progress`)
- A persistent **role-toggle** in the navbar that flips the active user between
  Customer and Artisan instantly — to simulate both sides of the marketplace

---

## 2. Tech Stack

| Layer            | Choice                                      |
| ---------------- | ------------------------------------------- |
| Framework        | Next.js (App Router)                        |
| Language         | TypeScript (strict)                         |
| Styling          | Tailwind CSS                                |
| Icons            | `lucide-react`                              |
| State management | React Context (`src/context/AppContext.tsx`)|
| Persistence      | `localStorage` (browser only)               |
| Images           | Base64 data URLs (FileReader on client)     |

### Design Language
Clean, premium **wood-grain minimalist**:
- Palette: amber (700–900) primary, stone (50–900) neutrals, emerald/blue/red accents
- Rounded `2xl` cards, soft shadows, generous whitespace
- Lucide icons for consistent iconography
- Mobile-responsive via Tailwind breakpoints

---

## 3. Constraints (Critical)

- ❌ **No** external databases (no Postgres, MongoDB, etc.)
- ❌ **No** cloud services (no Supabase, Firebase, etc.)
- ❌ **No** auth APIs
- ✅ All state lives in **React Context** + **localStorage**
- ✅ Images are converted to **base64** client-side and stored in localStorage
- ✅ Files must be written **incrementally** — one major file at a time, with
  a pause for approval after each step (to respect free-tier API rate limits)
- ❌ **No** placeholders, `// TODO`, or truncated code — every file must be
  complete and runnable when written

---

## 4. Data Model

### `UserRole`
```ts
type UserRole = 'customer' | 'artisan';
```

### `Project`
```ts
interface Project {
  id: string;
  title: string;
  description: string;
  dimensions: string;
  priceMin: number;
  priceMax: number;
  status: 'open' | 'in_progress' | 'completed';
  customerId: string;
  image: string;        // base64 data URL
  createdAt: string;    // ISO timestamp
}
```

### `Bid`
```ts
interface Bid {
  id: string;
  projectId: string;
  artisanId: string;
  artisanName: string;
  amount: number;
  days: number;
  proposal: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
```

### localStorage Key
`buildforme_marketplace_data` — single JSON blob holding:
```ts
{
  currentUserRole: UserRole;
  projects: Project[];
  bids: Bid[];
}
```

### Seed Data
On first load (when localStorage is empty), the context seeds **2** mock
projects:
1. **Custom Oak Dining Table** — `$800–$1500`, open
2. **Walnut Bookshelf - Mid-Century Modern** — `$600–$1200`, open

Both use small inline SVG base64 placeholder images.

---

## 5. File Structure

```
BuildForMe/
├── PROJECT_PLAN.md                      ← (this file)
├── AGENTS.md
├── CLAUDE.md
├── package.json
├── tsconfig.json                        ← "@/*" mapped to "./src/*"
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── public/                              ← Next.js default static assets
└── src/
    ├── app/
    │   ├── layout.tsx                   ← wraps tree in <AppProvider> + <Navigation>
    │   ├── page.tsx                     ← Marketplace Feed (STEP 3)
    │   ├── globals.css
    │   ├── favicon.ico
    │   └── projects/
    │       ├── new/
    │       │   └── page.tsx             ← New project form w/ image drop zone (STEP 4)
    │       └── [id]/
    │           └── page.tsx             ← Project detail + bid form / bid panel (STEP 5)
    ├── context/
    │   └── AppContext.tsx               ← State, types, localStorage, mutations (STEP 1)
    └── components/
        └── Navigation.tsx               ← Brand + role-switching toggle (STEP 2)
```

---

## 6. Context API Surface

`useApp()` exposes:

**State**
- `currentUserRole: UserRole`
- `projects: Project[]`
- `bids: Bid[]`

**Role**
- `setCurrentUserRole(role)`
- `toggleUserRole()`

**Projects**
- `addProject(data)`
- `updateProjectStatus(projectId, status)`
- `getProjectById(id)`
- `getProjectsByStatus(status)`
- `getProjectsByCustomerId(customerId)`

**Bids**
- `addBid(data)`
- `acceptBid(bidId)` — also rejects sibling bids + sets project to `in_progress`
- `rejectBid(bidId)`
- `getBidsByProjectId(projectId)`
- `getBidsByArtisanId(artisanId)`

---

## 7. Incremental Build Plan (5 Steps)

After each step, **STOP** and ask for approval before moving to the next.

### ✅ STEP 1 — `src/context/AppContext.tsx`  **(DONE)**
- All TypeScript types
- localStorage hydrate/persist via `useEffect`
- `addProject`, `addBid`, `acceptBid` (+ helpers)
- 2 seed projects

### ✅ STEP 2 — `src/components/Navigation.tsx` + `src/app/layout.tsx`  **(DONE)**
- Sticky amber/wood-grain top nav with `Hammer` brand mark
- Customer ⇄ Artisan toggle (segmented control style)
- Role-aware links: "Post Project" (customer) / "My Bids" (artisan)
- Live badge counters for open projects + pending bids
- Mobile responsive
- `layout.tsx` wraps `<AppProvider>` + `<Navigation>` + `<footer>`

### ✅ STEP 3 — `src/app/page.tsx`  **(DONE)**
- Role-aware hero header copy
- Live search by title/description
- Status filter pills (Open / In Progress / Completed / All) with counts
- Responsive 1/2/3-column card grid
- Card shows image, status badge, bid count, dimensions, price, relative time
- Friendly empty state

### ✅ STEP 4 — `src/app/projects/new/page.tsx`  **(DONE)**
- Drag-and-drop **and** click-to-browse image uploader
- Client-side FileReader → base64 conversion
- File type allowlist + 5MB max size validation
- Image preview, filename badge, remove button
- Form fields with per-field validation:
  - Title (min 5 chars, max 120)
  - Description (min 20 chars, max 2000, with char counter)
  - Dimensions (free text)
  - Budget min/max with cross-field validation
- Role guard — artisans see a friendly "Customer Access Only" panel
- Loading states for image processing + submit
- On success: `router.push('/')`

### ⏳ STEP 5 — `src/app/projects/[id]/page.tsx`  **(IN PROGRESS / NEXT)**
- Dynamic route reads `params.id` and looks up the project via `getProjectById`
- 404 fallback if project not found
- Hero: full-width reference image + title + status + dimensions + budget
- **If `currentUserRole === 'artisan'`** AND `project.status === 'open'`:
  - Render a **Bid Entry Form** with:
    - Artisan display name
    - Bid amount (number)
    - Days to complete (number)
    - Proposal (textarea)
  - Validation + submit calls `addBid({...})`
  - After submit, show a "Bid submitted" confirmation and hide the form
  - If the artisan has already bid on this project, show their existing bid + status instead of the form
- **If `currentUserRole === 'customer'`**:
  - Hide the bid form
  - Render an **Incoming Bids Panel** listing all bids on this project
    - Each bid card: artisan name, amount, days, proposal, status, timestamp
    - For `pending` bids on `open` projects: working **"Accept Bid"** button
      that calls `acceptBid(bid.id)`
    - Visually indicate accepted/rejected statuses
  - Empty state if no bids yet
- Status-aware UI: once a project is `in_progress` or `completed`, show a banner

---

## 8. How to Resume in a Fresh Session

If you need to continue this build in a new chat, paste this brief:

> I'm building a local-only Next.js (App Router) custom-furniture freelancing
> marketplace prototype called **BuildForMe**, located at
> `c:\Users\chenr\OneDrive\Desktop\BuildForMe`.
>
> Steps 1–4 are complete. Please read `PROJECT_PLAN.md` in the project root,
> then implement **STEP 5** (`src/app/projects/[id]/page.tsx`) exactly as
> specified there. Do not modify any other file. After you write the file,
> stop and ask for approval.
>
> Constraints: no external DBs/auth, state lives in React Context +
> localStorage, images are base64, use Tailwind + lucide-react, complete code
> only (no placeholders/TODOs).

---

## 9. Run & Verify Locally

```bash
npm install        # if dependencies not yet installed
npm run dev        # start dev server on http://localhost:3000
```

### Manual Test Checklist (post-Step 5)
1. App boots at `/` with 2 seeded projects visible
2. Refresh page → seed persists (localStorage)
3. Toggle role to **Artisan** in navbar → hero copy changes, "Post Project"
   link is replaced by "My Bids"
4. As Customer: click "Post a Project" → drag/drop an image → fill the form →
   submit → redirected to `/` with new project at the top
5. As Artisan: open a project → submit a bid → confirmation shown
6. Toggle back to Customer → open the same project → see the bid in the panel →
   click **Accept Bid** → project moves to `in_progress`, bid shows `accepted`
7. Refresh → all changes persist via localStorage

---

## 10. Known/Intentional Simplifications

- A single anonymous "current user" identity per role (`customer_self` /
  `artisan_self`) — no user accounts
- No edit/delete UI for projects or bids (out of scope for prototype)
- Mock SVG placeholder images for seed projects
- No image compression — 5MB upload cap to keep localStorage healthy
- No pagination — all projects render on the feed