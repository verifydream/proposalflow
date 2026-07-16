import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, phone TEXT, company TEXT,
  npwp TEXT, bank_name TEXT, bank_account TEXT, bank_holder TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, email TEXT, phone TEXT, company TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES clients(id), name TEXT NOT NULL, status TEXT DEFAULT 'proposal',
  value INTEGER DEFAULT 0, currency TEXT DEFAULT 'IDR', created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY, project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL, content JSONB DEFAULT '{}', status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ, viewed_at TIMESTAMPTZ, approved_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY, project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  proposal_id INTEGER REFERENCES proposals(id), content JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft', signed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY, project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL, items JSONB DEFAULT '[]', subtotal INTEGER DEFAULT 0,
  tax INTEGER DEFAULT 0, total INTEGER DEFAULT 0, status TEXT DEFAULT 'draft',
  due_date DATE, paid_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY, invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, method TEXT, reference TEXT, notes TEXT, received_at TIMESTAMPTZ DEFAULT NOW()
);
`;
async function migrate() { await pool.query(SCHEMA); console.log('✅ Migrated'); await pool.end(); }
migrate().catch(e => { console.error(e); process.exit(1); });
