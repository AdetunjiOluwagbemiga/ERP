import { useState, useEffect } from 'react'
import { Plus, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PayrollRun } from '../../types'

const statusBadge: Record<string, string> = { draft: 'badge-gray', processing: 'badge-yellow', completed: 'badge-green', cancelled: 'badge-red' }

export default function Payroll() {
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ period_start: '', period_end: '', pay_date: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('payroll_runs').select('*').order('pay_date', { ascending: false })
    setRuns(data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('payroll_runs').insert(form)
    await load()
    setShowModal(false)
    setSaving(false)
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Payroll</div>
          <div className="page-subtitle">Payroll runs and processing history</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Payroll Run</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Runs</div><div className="stat-value">{runs.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Last Gross Payroll</div><div className="stat-value" style={{ fontSize:17 }}>{runs[0] ? fmt(runs[0].total_gross) : '—'}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Completed Runs</div><div className="stat-value">{runs.filter(r => r.status === 'completed').length}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Payroll History</span></div>
        {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Period</th><th>Pay Date</th><th style={{ textAlign:'right' }}>Gross Pay</th><th style={{ textAlign:'right' }}>Deductions</th><th style={{ textAlign:'right' }}>Net Pay</th><th>Status</th></tr>
              </thead>
              <tbody>
                {runs.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><BookOpen size={32} /><p>No payroll runs found.</p></div></td></tr>
                ) : runs.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight:500 }}>{r.period_start} – {r.period_end}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{r.pay_date}</td>
                    <td style={{ textAlign:'right', fontFamily:'monospace' }}>{fmt(r.total_gross)}</td>
                    <td style={{ textAlign:'right', fontFamily:'monospace', color:'var(--red-600)' }}>{fmt(r.total_gross - r.total_net)}</td>
                    <td style={{ textAlign:'right', fontFamily:'monospace', fontWeight:600 }}>{fmt(r.total_net)}</td>
                    <td><span className={`badge ${statusBadge[r.status]}`} style={{ textTransform:'capitalize' }}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">New Payroll Run</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Period Start</label>
                <input type="date" className="form-input" value={form.period_start} onChange={e => setForm({...form, period_start: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Period End</label>
                <input type="date" className="form-input" value={form.period_end} onChange={e => setForm({...form, period_end: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Pay Date</label>
                <input type="date" className="form-input" value={form.pay_date} onChange={e => setForm({...form, pay_date: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Creating...' : 'Create Payroll Run'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
