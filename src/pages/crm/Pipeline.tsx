import { useState, useEffect } from 'react'
import { Plus, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Lead, Contact } from '../../types'

const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const
const stageColors: Record<string, { bg: string; color: string }> = {
  new: { bg: 'var(--blue-100)', color: 'var(--blue-700)' },
  contacted: { bg: 'var(--teal-50)', color: 'var(--teal-600)' },
  qualified: { bg: 'var(--yellow-100)', color: 'var(--yellow-600)' },
  proposal: { bg: 'var(--orange-100)', color: 'var(--orange-500)' },
  negotiation: { bg: '#fce7f3', color: '#be185d' },
  won: { bg: 'var(--green-100)', color: 'var(--green-700)' },
  lost: { bg: 'var(--red-100)', color: 'var(--red-700)' },
}

export default function Pipeline() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', company: '', value: '', stage: 'new', probability: '20', expected_close: '', contact_id: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const [ls, cs] = await Promise.all([
      supabase.from('leads').select('*, contacts(first_name, last_name)').order('created_at', { ascending: false }),
      supabase.from('contacts').select('*').eq('is_active', true).order('last_name')
    ])
    setLeads(ls.data ?? [])
    setContacts(cs.data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('leads').insert({
      ...form,
      value: parseFloat(form.value || '0'),
      probability: parseInt(form.probability),
      contact_id: form.contact_id || null,
      expected_close: form.expected_close || null,
    })
    await load()
    setShowModal(false)
    setSaving(false)
  }

  async function updateStage(id: string, stage: string) {
    await supabase.from('leads').update({ stage }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: stage as any } : l))
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  const totalPipelineValue = leads.filter(l => l.stage !== 'lost').reduce((s, l) => s + l.value, 0)
  const wonValue = leads.filter(l => l.stage === 'won').reduce((s, l) => s + l.value, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Sales Pipeline</div>
          <div className="page-subtitle">Lead tracking and opportunity management</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Lead</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Leads</div><div className="stat-value">{leads.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Pipeline Value</div><div className="stat-value" style={{ fontSize:16 }}>{fmt(totalPipelineValue)}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Won Value</div><div className="stat-value" style={{ fontSize:16, color:'var(--green-600)' }}>{fmt(wonValue)}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Active Deals</div><div className="stat-value">{leads.filter(l => !['won','lost'].includes(l.stage)).length}</div></div></div>
      </div>

      {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
        <div className="pipeline">
          {stages.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage)
            const { bg, color } = stageColors[stage]
            return (
              <div className="pipeline-column" key={stage}>
                <div className="pipeline-header" style={{ background: bg, color }}>
                  <span style={{ textTransform: 'capitalize' }}>{stage}</span>
                  <span style={{ marginLeft: 6, opacity: 0.8 }}>({stageLeads.length})</span>
                </div>
                {stageLeads.length === 0 ? (
                  <div style={{ padding: '16px 8px', textAlign: 'center', fontSize: 12, color: 'var(--gray-400)' }}>No leads</div>
                ) : stageLeads.map(lead => (
                  <div className="pipeline-card" key={lead.id}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{lead.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>{lead.company || (lead.contacts ? `${lead.contacts.first_name} ${lead.contacts.last_name}` : '—')}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--blue-600)', fontSize: 13 }}>{fmt(lead.value)}</span>
                      <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{lead.probability}%</span>
                    </div>
                    <select
                      className="form-input"
                      style={{ fontSize: 11, padding: '4px 8px', height: 28 }}
                      value={lead.stage}
                      onChange={e => updateStage(lead.id, e.target.value)}
                    >
                      {stages.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">New Lead</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Lead Title</label><input className="form-input" placeholder="e.g. Website Redesign Project" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Company</label><input className="form-input" value={form.company} onChange={e => setForm({...form, company: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Deal Value ($)</label><input type="number" className="form-input" value={form.value} onChange={e => setForm({...form, value: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Probability (%)</label><input type="number" min="0" max="100" className="form-input" value={form.probability} onChange={e => setForm({...form, probability: e.target.value})} /></div>
                <div className="form-group">
                  <label className="form-label">Stage</label>
                  <select className="form-input" value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}>
                    {stages.map(s => <option key={s} value={s} style={{ textTransform:'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Expected Close</label><input type="date" className="form-input" value={form.expected_close} onChange={e => setForm({...form, expected_close: e.target.value})} /></div>
                <div className="form-group">
                  <label className="form-label">Contact</label>
                  <select className="form-input" value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})}>
                    <option value="">No contact</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.company}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Add Lead'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
