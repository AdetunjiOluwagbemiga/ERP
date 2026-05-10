import { useState, useEffect } from 'react'
import { Plus, Search, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ChartOfAccount } from '../../types'

const typeColors: Record<string, string> = {
  asset: 'badge-blue', liability: 'badge-red', equity: 'badge-green',
  revenue: 'badge-teal', expense: 'badge-yellow'
}

export default function GeneralLedger() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', account_type: 'asset' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('chart_of_accounts').select('*').order('code')
    setAccounts(data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('chart_of_accounts').insert(form)
    await load()
    setShowModal(false)
    setForm({ code: '', name: '', account_type: 'asset' })
    setSaving(false)
  }

  const filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.code.includes(search)
  )

  const totals = accounts.reduce((acc, a) => {
    acc[a.account_type] = (acc[a.account_type] || 0) + a.balance
    return acc
  }, {} as Record<string, number>)

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">General Ledger</div>
          <div className="page-subtitle">Chart of accounts and balances</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Account
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {(['asset','liability','equity','revenue','expense'] as const).map(t => (
          <div className="stat-card" key={t}>
            <div className="stat-content">
              <div className="stat-label" style={{ textTransform: 'capitalize' }}>{t}</div>
              <div className="stat-value" style={{ fontSize: 17 }}>{fmt(totals[t] || 0)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Accounts ({filtered.length})</span>
          <div className="search-bar">
            <Search size={14} />
            <input className="form-input" placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? (
          <div className="loading-center"><div className="loading-spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state"><BookOpen size={32} /><p>No accounts found. Add your first account.</p></div></td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{a.code}</span></td>
                    <td style={{ fontWeight: 500 }}>{a.name}</td>
                    <td><span className={`badge ${typeColors[a.account_type]}`} style={{ textTransform: 'capitalize' }}>{a.account_type}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{fmt(a.balance)}</td>
                    <td><span className={`badge ${a.is_active ? 'badge-green' : 'badge-gray'}`}>{a.is_active ? 'Active' : 'Inactive'}</span></td>
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
              <span className="modal-title">Add Account</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Account Code</label>
                <input className="form-input" placeholder="e.g. 1001" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Account Name</label>
                <input className="form-input" placeholder="e.g. Cash and Equivalents" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input" value={form.account_type} onChange={e => setForm({ ...form, account_type: e.target.value })}>
                  {['asset','liability','equity','revenue','expense'].map(t => (
                    <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.code || !form.name}>
                {saving ? 'Saving...' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
