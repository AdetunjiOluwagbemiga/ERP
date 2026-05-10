import { useState, useEffect } from 'react'
import { Plus, Search, UserCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Contact } from '../../types'

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', company: '', job_title: '', notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('contacts').select('*').order('last_name')
    setContacts(data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('contacts').insert(form)
    await load()
    setShowModal(false)
    setSaving(false)
  }

  const filtered = contacts.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Contacts</div>
          <div className="page-subtitle">Customer contacts and relationship database</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Contact</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Contacts</div><div className="stat-value">{contacts.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Active</div><div className="stat-value">{contacts.filter(c => c.is_active).length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Companies</div><div className="stat-value">{new Set(contacts.map(c => c.company).filter(Boolean)).size}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Contacts ({filtered.length})</span>
          <div className="search-bar">
            <Search size={14} />
            <input className="form-input" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Title</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><UserCheck size={32} /><p>No contacts found.</p></div></td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--teal-50)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'var(--teal-600)', flexShrink:0 }}>
                          {c.first_name[0]}{c.last_name[0]}
                        </div>
                        <span style={{ fontWeight:500 }}>{c.first_name} {c.last_name}</span>
                      </div>
                    </td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{c.email}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{c.phone || '—'}</td>
                    <td style={{ fontWeight:500 }}>{c.company || '—'}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{c.job_title || '—'}</td>
                    <td><span className={`badge ${c.is_active ? 'badge-green' : 'badge-gray'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">Add Contact</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">First Name</label><input className="form-input" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Company</label><input className="form-input" value={form.company} onChange={e => setForm({...form, company: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Job Title</label><input className="form-input" value={form.job_title} onChange={e => setForm({...form, job_title: e.target.value})} /></div>
              </div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Add Contact'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
