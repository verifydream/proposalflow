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

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth` | Login/register |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| POST | `/api/proposals` | Create proposal |
| PATCH | `/api/proposals` | Update proposal status |
| PATCH | `/api/invoices` | Update invoice status |

## 🔄 Auto-Progression Flow

```
Proposal Created → Sent → Viewed → Approved
        ↓
   Contract Auto-Created → Signed
        ↓
   Invoice Auto-Created (with 11% PPN)
        ↓
   Payment Tracking
```

## 📄 License

MIT
