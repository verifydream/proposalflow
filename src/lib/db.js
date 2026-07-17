import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export default pool;

export async function getOrCreateUser(email, name, phone, company) {
  const { rows } = await pool.query(
    'INSERT INTO users (email,name,phone,company) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO UPDATE SET name=$2,phone=$3,company=$4 RETURNING *',
    [email, name, phone || null, company || null]);
  return rows[0];
}
export async function getClients(userId) {
  const { rows } = await pool.query('SELECT * FROM clients WHERE user_id=$1 ORDER BY name', [userId]);
  return rows;
}
export async function addClient(userId, { name, email, phone, company }) {
  const { rows } = await pool.query(
    'INSERT INTO clients (user_id,name,email,phone,company) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [userId, name, email || null, phone || null, company || null]);
  return rows[0];
}
export async function getProjects(userId) {
  const { rows } = await pool.query(
    'SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id=c.id WHERE p.user_id=$1 ORDER BY p.created_at DESC', [userId]);
  return rows;
}
export async function addProject(userId, { clientId, name, value }) {
  const { rows } = await pool.query(
    'INSERT INTO projects (user_id,client_id,name,value) VALUES ($1,$2,$3,$4) RETURNING *',
    [userId, clientId || null, name, value || 0]);
  return rows[0];
}
export async function getProject(id) {
  const { rows } = await pool.query(
    'SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id=c.id WHERE p.id=$1', [id]);
  return rows[0];
}
export async function addProposal(projectId, { title, content }) {
  const { rows } = await pool.query(
    'INSERT INTO proposals (project_id,title,content) VALUES ($1,$2,$3) RETURNING *',
    [projectId, title, JSON.stringify(content || {})]);
  return rows[0];
}
export async function getProposals(projectId) {
  const { rows } = await pool.query('SELECT * FROM proposals WHERE project_id=$1 ORDER BY created_at DESC', [projectId]);
  return rows;
}
export async function getProposal(id) {
  const { rows } = await pool.query('SELECT * FROM proposals WHERE id=$1', [id]);
  return rows[0];
}
export async function deleteProposal(id) {
  const { rows } = await pool.query('DELETE FROM proposals WHERE id=$1 RETURNING *', [id]);
  return rows[0];
}
export async function getInvoicesByProject(projectId) {
  const { rows } = await pool.query('SELECT * FROM invoices WHERE project_id=$1', [projectId]);
  return rows;
}
export async function updateProposalStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE proposals SET status=$1,
     sent_at=CASE WHEN $1='sent' THEN NOW() ELSE sent_at END,
     viewed_at=CASE WHEN $1='viewed' THEN NOW() ELSE viewed_at END,
     approved_at=CASE WHEN $1='approved' THEN NOW() ELSE approved_at END
     WHERE id=$2 RETURNING *`,
    [status, id]);
  return rows[0];
}
export async function addContract(projectId, proposalId, content) {
  const { rows } = await pool.query(
    'INSERT INTO contracts (project_id,proposal_id,content) VALUES ($1,$2,$3) RETURNING *',
    [projectId, proposalId || null, JSON.stringify(content || {})]);
  return rows[0];
}
export async function updateContractStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE contracts SET status=$1,
     signed_at=CASE WHEN $1='signed' THEN NOW() ELSE signed_at END
     WHERE id=$2 RETURNING *`,
    [status, id]);
  return rows[0];
}
export async function createInvoice(projectId, data) {
  const { rows } = await pool.query(
    'INSERT INTO invoices (project_id,invoice_number,items,subtotal,tax,total,due_date) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [projectId, data.invoiceNumber, JSON.stringify(data.items || []), data.subtotal || 0, data.tax || 0, data.total || 0, data.dueDate || null]);
  return rows[0];
}
export async function getInvoices(userId) {
  const { rows } = await pool.query(
    'SELECT i.*, p.name as project_name FROM invoices i JOIN projects p ON i.project_id=p.id WHERE p.user_id=$1 ORDER BY i.created_at DESC', [userId]);
  return rows;
}
export async function updateInvoiceStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE invoices SET status=$1,
     paid_at=CASE WHEN $1='paid' THEN NOW() ELSE paid_at END
     WHERE id=$2 RETURNING *`,
    [status, id]);
  return rows[0];
}
export async function recordPayment(invoiceId, { amount, method, reference, notes }) {
  const { rows } = await pool.query(
    'INSERT INTO payments (invoice_id,amount,method,reference,notes) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [invoiceId, amount, method || null, reference || null, notes || null]);
  return rows[0];
}
export async function getDashboard(userId) {
  const projects = await getProjects(userId);
  const invoices = await getInvoices(userId);
  return {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => !['won','lost','closed'].includes(p.status)).length,
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0),
    pendingPayments: invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.total, 0),
    recentProjects: projects.slice(0, 5),
    recentInvoices: invoices.slice(0, 5),
  };
}
