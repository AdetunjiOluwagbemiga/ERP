import { useState, useEffect } from 'react'
import { Plus, Landmark } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { BankAccount } from '../../types'

export default function Banking() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ account_name: '', bank_name: '', account_number: '', routing_number: '', current_balance: '', currency: 'USD' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('bank_accounts').select('*').order('account_name')
    setAccounts(data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('bank_accounts').insert({ ...form, current_balance: parseFloat(form.current_balance || '0') })
    await load()
    setShowModal(false)
    setSaving(false)
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const total = accounts.reduce((s, a) => s + a.current_balance, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Cash & Banking</div>
          <div className="page-subtitle">Bank accounts and cash flow management</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Account</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Cash Position</div><div className="stat-value">{fmt(total)}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Bank Accounts</div><div className="stat-value">{accounts.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Active Accounts</div><div className="stat-value">{accounts.filter(a => a.is_active).length}</div></div></div>
      </div>

      {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {accounts.length === 0 ? (
            <div className="card" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state"><Landmark size={40} /><p>No bank accounts found. Add your first account.</p></div>
            </div>
          ) : accounts.map(a => (
            <div className="card" key={a.id}>
              <div className="card-body">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:40, height:40, background:'var(--blue-100)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Landmark size={18} color="var(--blue-600)" />
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:15 }}>{a.account_name}</div>
                      <div style={{ fontSize:12, color:'var(--gray-500)' }}>{a.bank_name}</div>
                    </div>
                  </div>
                  <span className={`badge ${a.is_active ? 'badge-green' : 'badge-gray'}`}>{a.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:12, color:'var(--gray-500)' }}>Account Number</div>
                    <div style={{ fontFamily:'monospace', fontWeight:500 }}>****{a.account_number.slice(-4)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:12, color:'var(--gray-500)' }}>Balance</div>
                    <div style={{ fontSize:20, fontWeight:700, color: a.current_balance >= 0 ? 'var(--green-600)' : 'var(--red-600)' }}>{fmt(a.current_balance)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add Bank Account</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {[
                  ['Account Name', 'account_name', 'text', 'e.g. Operating Account'],
                  ['Bank Name', 'bank_name', 'text', 'e.g. Chase Bank'],
                  ['Account Number', 'account_number', 'text', 'Account number'],
                  ['Routing Number', 'routing_number', 'text', 'Routing number'],
                  ['Current Balance', 'current_balance', 'number', '0.00'],
                ].map(([label, key, type, placeholder]) => (
                  <div className="form-group" key={key as string}>
                    <label className="form-label">{label as string}</label>
                    <input type={type as string} className="form-input" placeholder={placeholder as string} value={(form as any)[key as string]} onChange={e => setForm({ ...form, [key as string]: e.target.value })} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-input" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                    <option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Add Account'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
