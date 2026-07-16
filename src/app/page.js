'use client';
import { useState, useEffect } from 'react';

const fmtRp = n => 'Rp ' + (n || 0).toLocaleString('id-ID');

export default function Home() {
  const [email, setEmail] = useState('');
  const [logged, setLogged] = useState(false);
  const [dash, setDash] = useState(null);
  const [tab, setTab] = useState('projects');
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');

  async function loadDash() {
    const r = await fetch('/api/dashboard?email=' + email);
    setDash(await r.json());
  }

  function login() { if (email) { setLogged(true); loadDash(); } }

  async function createProject() {
    if (!newName) return;
    await fetch('/api/projects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: newName, value: parseInt(newValue) || 0 })
    });
    setNewName(''); setNewValue(''); loadDash();
  }

  if (!logged) return (
    <div className="max-w-lg mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold mb-2">📋 ProposalFlow</h1>
      <p className="text-[#666] text-sm mb-6">Dari Deal ke Duit dalam Satu Alur</p>
      <div className="bg-[#141414] border border-[#222] rounded-xl p-4">
        <div className="flex gap-2">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email kamu" className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm" />
          <button onClick={login} className="bg-[#6366f1] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#4f46e5]">Masuk</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-6">📋 ProposalFlow</h1>

      {dash && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#141414] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#818cf8]">{dash.totalProjects}</div>
            <div className="text-xs text-[#666]">Proyek</div>
          </div>
          <div className="bg-[#141414] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#818cf8]">{fmtRp(dash.totalRevenue)}</div>
            <div className="text-xs text-[#666]">Revenue</div>
          </div>
          <div className="bg-[#141414] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#818cf8]">{fmtRp(dash.pendingPayments)}</div>
            <div className="text-xs text-[#666]">Pending</div>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-4">
        {[['projects','Proyek'],['invoices','Invoice'],['new','+ Baru']].map(([t,label]) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded-lg text-sm ${tab===t ? 'bg-[#6366f1] text-white' : 'text-[#666]'}`}>{label}</button>
        ))}
      </div>

      {tab === 'projects' && dash?.recentProjects?.map(p => (
        <div key={p.id} className="bg-[#141414] border border-[#222] rounded-xl p-3 mb-2 flex justify-between items-center">
          <div><b>{p.name}</b><br/><span className="text-[#666] text-xs">{p.client_name || '-'} · {fmtRp(p.value)}</span></div>
          <span className="text-xs px-2 py-0.5 rounded bg-[#6366f133] text-[#818cf8]">{p.status}</span>
        </div>
      ))}

      {tab === 'invoices' && (
        <table className="w-full text-sm">
          <thead><tr className="border-b border-[#222]"><th className="text-left py-2 text-[#666]">Invoice</th><th className="text-left py-2 text-[#666]">Proyek</th><th className="text-left py-2 text-[#666]">Total</th><th className="text-left py-2 text-[#666]">Status</th></tr></thead>
          <tbody>{dash?.recentInvoices?.map(i => (
            <tr key={i.id} className="border-b border-[#1a1a1a]">
              <td className="py-2">{i.invoice_number}</td><td className="py-2">{i.project_name}</td>
              <td className="py-2">{fmtRp(i.total)}</td>
              <td className="py-2"><span className="text-xs px-2 py-0.5 rounded bg-[#22c55e33] text-[#22c55e]">{i.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      )}

      {tab === 'new' && (
        <div className="bg-[#141414] border border-[#222] rounded-xl p-4">
          <h3 className="text-sm font-bold text-[#818cf8] mb-3">Proyek Baru</h3>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nama proyek" className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm mb-2" />
          <input value={newValue} onChange={e => setNewValue(e.target.value)} type="number" placeholder="Nilai (Rp)" className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm mb-3" />
          <button onClick={createProject} className="bg-[#6366f1] text-white px-4 py-2 rounded-lg text-sm">Buat Proyek</button>
        </div>
      )}
    </div>
  );
}
