import { useState, useEffect } from 'react'
import { Plus, Search, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AccountsReceivable as AR } from '../../types'

const statusBadge: Record<string, string> = {
  unpaid: 'badge-red', partial: 'badge-yellow', paid: 'badge-green', overdue: 'badge-orange', cancelled: 'badge-gray'
}

export default function AccountsReceivable() {
  const [records, setRecords] = useState<AR[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ invoice_number: '', customer_name: '', customer_email: '', invoice_date: '', due_date: '', amount: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('accounts_receivable').select('*').order('due_date')
    setRecords(data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('accounts_receivable').insert({ ...form, amount: parseFloat(form.amount) })
    await load()
    setShowModal(false)
    setForm({ invoice_number: '', customer_name: '', customer_email: '', invoice_date: '', due_date: '', amount: '', description: '' })
    setSaving(false)
  }

  const filtered = records.filter(r =>
    r.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    r.customer_name.toLowerCase().includes(search.toLowerCase())
  )

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const totalOwed = records.filter(r => r.status !== 'paid' && r.status !== 'cancelled').reduce((s, r) => s + (r.amount - r.paid_amount), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Accounts Receivable</div>
          <div className="page-subtitle">Customer invoices and incoming payments</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Invoice</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Outstanding</div><div className="stat-value">{fmt(totalOwed)}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Overdue</div><div className="stat-value" style={{ color: 'var(--red-600)' }}>{records.filter(r => r.status === 'overdue').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Unpaid Invoices</div><div className="stat-value">{records.filter(r => r.status === 'unpaid').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Collected</div><div className="stat-value">{fmt(records.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0))}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Invoices ({filtered.length})</span>
          <div className="search-bar">
            <Search size={14} />
            <input className="form-input" placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Invoice #</th><th>Customer</th><th>Email</th><th>Due Date</th><th style={{ textAlign:'right' }}>Amount</th><th style={{ textAlign:'right' }}>Balance</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><FileText size={32} /><p>No invoices found.</p></div></td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id}>
                    <td><span style={{ fontWeight: 600, color: 'var(--blue-600)' }}>{r.invoice_number}</span></td>
                    <td style={{ fontWeight: 500 }}>{r.customer_name}</td>
                    <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>{r.customer_email}</td>
                    <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>{r.due_date}</td>
                    <td style={{ textAlign:'right', fontFamily:'monospace' }}>{fmt(r.amount)}</td>
                    <td style={{ textAlign:'right', fontFamily:'monospace', fontWeight: 600, color: 'var(--green-600)' }}>{fmt(r.amount - r.paid_amount)}</td>
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
              <span className="modal-title">New Invoice</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Invoice Number</label>
                  <input className="form-input" placeholder="INV-0001" value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input type="number" className="form-input" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Name</label>
                  <input className="form-input" placeholder="Customer name" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Email</label>
                  <input type="email" className="form-input" placeholder="customer@email.com" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Invoice Date</label>
                  <input type="date" className="form-input" value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Invoice description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Save Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
