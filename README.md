# BuildForMe — Custom Furniture Marketplace 🚀

Welcome to **BuildForMe**, a highly responsive, modern full-stack freelancing marketplace where **customers** can post custom furniture requests and **artisans** can submit bids to make them.

This application is fully migrated from a browser-only `localStorage` prototype into a globally active production site connected to a **Neon Postgres database** and running live on **Vercel**!

## 🔗 Live Application Links
- **Production Domain:** [https://buildforme.vercel.app](https://buildforme.vercel.app)
- **Database Engine:** Neon Postgres Serverless
- **Host Infrastructure:** Vercel Cloud Serverless Functions

---

## 🛠️ Tech Stack & Key Upgrades

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS + Lucide Icons
- **Data Layer:** Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Fault-Insulated Server Actions:** Mutations (`createProject`, `createBid`, `acceptBid`) are fully isolated. Database timeouts, network errors, or validation blocks are caught gracefully on the server and returned as structured payloads rather than triggering blank 500 render crashes.
- **Client-Side Image Compression:** Added a high-performance HTML5 Canvas compression routine. Resizes images to a maximum bounding box of 1200px and encodes them to a JPEG quality of 0.7. This shrinks photo payloads from multi-megabytes to under ~150KB, ensuring smooth transfers well below Vercel's **4.5MB serverless payload execution limit**.

---

## 🚀 Deployment Workflow (Vercel CLI)

This project is configured to deploy **directly from this local folder** using the **Vercel CLI**. Changes do not require pushing to a Git provider (like GitHub) to trigger a build—the Vercel CLI packages, compiles, and deploys local changes directly.

### 1. Local Development
Start your local sandbox connected to the production database:
```bash
npm run dev
```

### 2. Environment Variables Integration
All sensitive database credentials in `.env.local` are explicitly ignored in `.gitignore` to prevent leaks. To synchronize your local keys with the Vercel project space, use the CLI:
```bash
# Add main connection parameters
npx vercel env add DATABASE_URL production
npx vercel env add PGHOST production
npx vercel env add PGUSER production
npx vercel env add PGPASSWORD production
npx vercel env add PGDATABASE production
```

### 3. Deploying to Production
To compile, bundle, tree-shake, and deploy your latest committed local code straight to the live production server, execute:
```bash
npx vercel --prod --yes
```

*Note: The `--yes` flag bypasses Vercel's default CLI configuration prompts, triggering an instant 20-30 second compiled build aliased automatically to your primary domain.*

---

## 📁 Repository Structure

```text
BuildForMe/
├── README.md                            ← (This file: Local CLI deployment guide)
├── .vercel/                             ← Hidden project links for Vercel CLI
├── .env.local                           ← Database secrets (excluded from Git)
├── package.json                         ← Core serverless configurations
├── src/
│   ├── app/
│   │   ├── page.tsx                     ← Marketplace Server Entry point
│   │   ├── layout.tsx                   ← Nav layout + active role shell
│   │   ├── projects/
│   │   │   ├── new/page.tsx             ← New project form + HTML5 canvas downscaler
│   │   │   └── [id]/page.tsx            ← Dynamic project detail Server Component
│   ├── components/
│   │   ├── MarketplaceFeed.tsx          ← UI Marketplace scroll feed
│   │   ├── Navigation.tsx               ← Header brand & instant role switcher
│   │   └── ProjectDetailClient.tsx      ← Dynamic Artisan bidding & Customer accept panel
│   ├── context/
│   │   └── AppContext.tsx               ← Lightweight client active-role states
│   └── lib/
│       ├── actions.ts                   ← Database Server Actions (Fault-insulated)
│       ├── db.ts                        ← Neon Postgres client (build-time resilient)
│       └── types.ts                     ← Strict TypeScript structures
```

---

## 🧪 Testing Verification Rules

To confirm the database and serverless functions are communicating flawlessly in production:
1. Open [https://buildforme.vercel.app](https://buildforme.vercel.app) (you will see the starter seed tables initialized on Neon immediately).
2. Click **Artisan** in the navbar → click **View details** on a project.
3. Submit a bid. Verify the state changes to show your submitted bid (confirming a write to the `bids` table).
4. Toggle back to **Customer** in the header → re-open the project.
5. Click **Accept this Bid**. Verify that:
   - The project status changes to `in_progress`.
   - Your accepted bid displays a green checkmark, while sibling bids are automatically rejected.
