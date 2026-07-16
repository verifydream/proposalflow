import express from 'express';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
import * as db from './db.js';

dotenv.config();
const app = express();
app.use(express.json());

const fmtRp = n => 'Rp ' + (n || 0).toLocaleString('id-ID');

// --- Health ---
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'proposalflow' }));

// --- Auth (simplified — email-based) ---
app.post('/api/auth', async (req, res) => {
  const { email, name, phone, company } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'email & name required' });
  const user = await db.getOrCreateUser(email, name, phone, company);
  res.json(user);
});

// --- Clients ---
app.get('/api/users/:email/clients', async (req, res) => {
  const user = await db.getOrCreateUser(req.params.email, '');
  const clients = await db.getClients(user.id);
  res.json(clients);
});
app.post('/api/users/:email/clients', async (req, res) => {
  const user = await db.getOrCreateUser(req.params.email, '');
  const client = await db.addClient(user.id, req.body);
  res.json(client);
});

// --- Projects ---
app.get('/api/users/:email/projects', async (req, res) => {
  const user = await db.getOrCreateUser(req.params.email, '');
  const projects = await db.getProjects(user.id);
  res.json(projects);
});
app.post('/api/users/:email/projects', async (req, res) => {
  const user = await db.getOrCreateUser(req.params.email, '');
  const project = await db.addProject(user.id, req.body);
  res.json(project);
});
app.get('/api/projects/:id', async (req, res) => {
  const project = await db.getProject(parseInt(req.params.id));
  if (!project) return res.status(404).json({ error: 'Not found' });
  const proposals = await db.getProposals(project.id);
  res.json({ ...project, proposals });
});
app.patch('/api/projects/:id/status', async (req, res) => {
  const project = await db.updateProjectStatus(parseInt(req.params.id), req.body.status);
  res.json(project);
});

// --- Proposals ---
app.post('/api/projects/:pid/proposals', async (req, res) => {
  const proposal = await db.addProposal(parseInt(req.params.pid), req.body);
  res.json(proposal);
});
app.patch('/api/proposals/:id/status', async (req, res) => {
  const proposal = await db.updateProposalStatus(parseInt(req.params.id), req.body.status);
  // Auto-create contract when proposal approved
  if (proposal && req.body.status === 'approved') {
    const project = await db.getProject(proposal.project_id);
    await db.addContract(proposal.project_id, proposal.id, { title: project.name, value: project.value });
  }
  res.json(proposal);
});

// --- Contracts ---
app.patch('/api/contracts/:id/status', async (req, res) => {
  const contract = await db.updateContractStatus(parseInt(req.params.id), req.body.status);
  // Auto-create invoice when contract signed
  if (contract && req.body.status === 'signed') {
    const project = await db.getProject(contract.project_id);
    if (project) {
      await db.createInvoice(contract.project_id, {
        invoiceNumber: `INV-${String(contract.project_id).padStart(4, '0')}`,
        items: [{ description: project.name, amount: project.value }],
        subtotal: project.value,
        tax: Math.round(project.value * 0.11),
        total: project.value + Math.round(project.value * 0.11),
        dueDate: new Date(Date.now() + 14 * 86400_000).toISOString().split('T')[0],
      });
    }
  }
  res.json(contract);
});

// --- Invoices ---
app.get('/api/users/:email/invoices', async (req, res) => {
  const user = await db.getOrCreateUser(req.params.email, '');
  const invoices = await db.getInvoices(user.id);
  res.json(invoices);
});
app.patch('/api/invoices/:id/status', async (req, res) => {
  const invoice = await db.updateInvoiceStatus(parseInt(req.params.id), req.body.status);
  res.json(invoice);
});
app.post('/api/invoices/:id/payments', async (req, res) => {
  const payment = await db.recordPayment(parseInt(req.params.id), req.body);
  res.json(payment);
});

// --- Dashboard ---
app.get('/api/users/:email/dashboard', async (req, res) => {
  const user = await db.getOrCreateUser(req.params.email, '');
  const dash = await db.getDashboard(user.id);
  res.json(dash);
});

// --- Dashboard HTML ---
app.get('/', (req, res) => { res.send(DASHBOARD_HTML); });

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ProposalFlow</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui;background:#0a0a0a;color:#e0e0e0;min-height:100vh}
.ctn{max-width:1000px;margin:0 auto;padding:2rem 1rem}
h1{font-size:1.6rem;color:#fff}.sub{color:#666;margin-bottom:1.5rem;font-size:.9rem}
.card{background:#141414;border:1px solid #222;border-radius:10px;padding:1.2rem;margin-bottom:.8rem}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.8rem;margin-bottom:1.5rem}
.stat{text-align:center;padding:1rem}.stat-val{font-size:1.8rem;font-weight:700;color:#818cf8}.stat-lbl{font-size:.8rem;color:#666;margin-top:.2rem}
input,select,textarea{background:#1a1a1a;border:1px solid #333;color:#fff;padding:.5rem .7rem;border-radius:6px;font-size:.85rem;width:100%;margin-bottom:.5rem}
button{background:#6366f1;color:#fff;border:none;padding:.5rem 1rem;border-radius:6px;cursor:pointer;font-size:.85rem}
button:hover{background:#4f46e5}.btn-sm{padding:.3rem .6rem;font-size:.75rem}
.tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.7rem;font-weight:600}
.tag-proposal{background:#6366f133;color:#818cf8}.tag-contract{background:#f59e0b33;color:#f59e0b}
.tag-invoice{background:#22c55e33;color:#22c55e}.tag-paid{background:#10b98133;color:#10b981}.tag-draft{background:#666333;color:#999}
table{width:100%;border-collapse:collapse;font-size:.85rem}th{text-align:left;padding:.5rem;color:#666;border-bottom:1px solid #222}
td{padding:.5rem;border-bottom:1px solid #1a1a1a}.empty{text-align:center;color:#444;padding:2rem}
.tabs{display:flex;gap:.3rem;margin-bottom:1rem}.tab{padding:.4rem .8rem;border-radius:6px;cursor:pointer;font-size:.8rem;color:#666}
.tab.active{background:#6366f1;color:#fff}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}
</style></head>
<body>
<div class="ctn">
<h1>📋 ProposalFlow</h1>
<p class="sub">Dari Deal ke Duit dalam Satu Alur</p>
<div class="card">
<div style="display:flex;gap:.5rem">
<input id="email" placeholder="Email kamu (login)" style="flex:1">
<button onclick="login()">Masuk</button>
</div></div>
<div id="app" style="display:none">
<div class="grid3">
<div class="card stat"><div class="stat-val" id="s-proj">0</div><div class="stat-lbl">Proyek</div></div>
<div class="card stat"><div class="stat-val" id="s-rev">Rp 0</div><div class="stat-lbl">Revenue</div></div>
<div class="card stat"><div class="stat-val" id="s-pend">Rp 0</div><div class="stat-lbl">Pending</div></div>
</div>
<div class="tabs">
<div class="tab active" onclick="showTab('projects',this)">Proyek</div>
<div class="tab" onclick="showTab('invoices',this)">Invoice</div>
<div class="tab" onclick="showTab('new',this)">+ Baru</div>
</div>
<div id="tab-projects"></div>
<div id="tab-invoices" style="display:none"></div>
<div id="tab-new" style="display:none">
<div class="card">
<h3 style="margin-bottom:.8rem;color:#818cf8">Proyek Baru</h3>
<input id="np-name" placeholder="Nama proyek">
<div class="form-row"><input id="np-client" placeholder="Nama klien"><input id="np-value" type="number" placeholder="Nilai (Rp)"></div>
<button onclick="createProject()">Buat Proyek</button>
</div></div>
</div>
</div>
<script>
let USER_EMAIL='';
async function login(){
  USER_EMAIL=document.getElementById('email').value;if(!USER_EMAIL)return;
  document.getElementById('app').style.display='block';loadDashboard();
}
async function loadDashboard(){
  const r=await fetch('/api/users/'+USER_EMAIL+'/dashboard');const d=await r.json();
  document.getElementById('s-proj').textContent=d.totalProjects;
  document.getElementById('s-rev').textContent='Rp '+d.totalRevenue.toLocaleString('id-ID');
  document.getElementById('s-pend').textContent='Rp '+d.pendingPayments.toLocaleString('id-ID');
  renderProjects(d.recentProjects);renderInvoices(d.recentInvoices);
}
function renderProjects(ps){
  const el=document.getElementById('tab-projects');
  if(!ps.length){el.innerHTML='<div class="card empty">Belum ada proyek. Klik "+ Baru".</div>';return;}
  el.innerHTML=ps.map(p=>'<div class="card" style="display:flex;justify-content:space-between;align-items:center"><div><b>'+p.name+'</b><br><span style="color:#666;font-size:.8rem">'+(p.client_name||'-')+' · Rp '+(p.value||0).toLocaleString('id-ID')+'</span></div><span class="tag tag-'+p.status+'">'+p.status+'</span></div>').join('');
}
function renderInvoices(inv){
  const el=document.getElementById('tab-invoices');
  if(!inv.length){el.innerHTML='<div class="card empty">Belum ada invoice.</div>';return;}
  el.innerHTML='<table><tr><th>Invoice</th><th>Proyek</th><th>Total</th><th>Status</th></tr>'+
    inv.map(i=>'<tr><td>'+i.invoice_number+'</td><td>'+(i.project_name||'-')+'</td><td>Rp '+(i.total||0).toLocaleString('id-ID')+'</td><td><span class="tag tag-'+i.status+'">'+i.status+'</span></td></tr>').join('')+'</table>';
}
async function createProject(){
  const name=document.getElementById('np-name').value;if(!name)return;
  await fetch('/api/users/'+USER_EMAIL+'/projects',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name,value:parseInt(document.getElementById('np-value').value)||0})});
  document.getElementById('np-name').value='';document.getElementById('np-value').value='';
  showTab('projects',document.querySelector('.tab'));loadDashboard();
}
function showTab(t,el){
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));el.classList.add('active');
  ['projects','invoices','new'].forEach(x=>document.getElementById('tab-'+x).style.display=x===t?'':'none');
  if(t==='invoices')loadDashboard();
}
</script></body></html>`;

const PORT = process.env.PORT || 3004;
app.listen(PORT, '0.0.0.0', () => console.log(`📋 ProposalFlow running on port ${PORT}`));
