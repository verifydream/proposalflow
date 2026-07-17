# 📋 ProposalFlow

> Dari Deal ke Duit dalam Satu Alur.

All-in-one client workflow: proposal → contract → invoice → payment.

## 🚀 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 + React |
| Backend | Next.js API Routes + tRPC |
| Database | PostgreSQL (Supabase-ready) |
| Validation | Zod |
| Styling | Tailwind CSS (dark theme) |

## 📦 Features

- ✅ Project & client management
- ✅ Proposal creation & status tracking
- ✅ Auto-progression: proposal → contract → invoice
- ✅ Invoice generation with IDR currency
- ✅ Payment tracking
- ✅ Dark dashboard with stats

## 🏁 Quick Start

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

## 🔧 Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/proposalflow
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

## 🔄 Workflow & Status Progression Rules

ProposalFlow enforces a strict status progression. **Stages cannot be skipped.**

1. **Proposal Progression:**
   - **`draft`** → **`sent`** → **`viewed`** → **`approved`**
2. **Contract Auto-Creation:**
   - Once a proposal is `approved`, a Contract is automatically generated as `draft`.
   - Contract progression: **`draft`** → **`signed`**
3. **Invoice Auto-Creation:**
   - Once a contract is `signed`, an Invoice is automatically created with 11% tax (PPN).
4. **Payment Tracking:**
   - Invoices transition from **`draft`** to **`paid`** as payments are recorded.

## 📡 tRPC Router Reference

The application uses tRPC for type-safe API calls.

### `dashboard`
- **Query:** `dashboard`
- **Output:** `{ totalProjects: number, activeProjects: number, totalRevenue: number, pendingPayments: number, recentProjects: Project[], recentInvoices: Invoice[] }`

### `projects`
- **Query:** `projects.list`
  - **Output:** `Project[]`
- **Mutation:** `projects.create`
  - **Input:** `{ name: string, clientId?: number, value?: number (int) }`
  - **Output:** `Project`

### `proposals`
- **Mutation:** `proposals.create`
  - **Input:** `{ projectId: number, title: string, content?: any }`
  - **Output:** `Proposal`
- **Mutation:** `proposals.updateStatus`
  - **Input:** `{ id: number, status: string }`
  - **Output:** `Proposal`
- **Mutation:** `proposals.delete`
  - **Input:** `{ id: number }`
  - **Output:** `boolean`

### `contracts`
- **Mutation:** `contracts.updateStatus`
  - **Input:** `{ id: number, status: string }`
  - **Output:** `Contract`

### `invoices`
- **Query:** `invoices.list`
  - **Output:** `Invoice[]`

## 🗄️ Database Schema

- **Users:** `id`, `email`, `name`, `phone`, `company`, `npwp`, etc.
- **Clients:** `id`, `user_id`, `name`, `email`, `phone`, `company`
- **Projects:** `id`, `user_id`, `client_id`, `name`, `status`, `value`, `currency`
- **Proposals:** `id`, `project_id`, `title`, `content`, `status`, `sent_at`, `viewed_at`, `approved_at`
- **Contracts:** `id`, `project_id`, `proposal_id`, `content`, `status`, `signed_at`
- **Invoices:** `id`, `project_id`, `invoice_number`, `items`, `subtotal`, `tax`, `total`, `status`, `due_date`, `paid_at`
- **Payments:** `id`, `invoice_id`, `amount`, `method`, `reference`, `notes`, `received_at`

## 💰 IDR Handling & Stats

### IDR Handling
All monetary values (Project values, Invoice totals, Payments) are strictly stored and validated as **Integers** (no floats/decimals). Indonesian Rupiah (IDR) does not use fractional currency in practical business workflows.

### Dashboard Stats
Dashboard stats provide a quick overview of the business performance for the user:
- **Total Projects:** Count of all projects.
- **Active Projects:** Count of projects that are not 'won', 'lost', or 'closed'.
- **Total Revenue:** Sum of totals from `paid` invoices.
- **Pending Payments:** Sum of totals from non-`paid` invoices.
- **Recent Projects & Invoices:** The latest 5 projects and invoices.

## 📄 License

MIT
