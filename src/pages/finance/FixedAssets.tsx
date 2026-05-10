import { useState, useEffect } from 'react'
import { Plus, Search, Landmark } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { FixedAsset } from '../../types'

const statusBadge: Record<string, string> = { active: 'badge-green', disposed: 'badge-red', maintenance: 'badge-yellow' }

export default function FixedAssets() {
  const [assets, setAssets] = useState<FixedAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    asset_number: '', name: '', category: '', purchase_date: '', purchase_cost: '',
    salvage_value: '0', useful_life_years: '5', location: '', depreciation_method: 'straight_line'
  })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('fixed_assets').select('*').order('asset_number')
    setAssets(data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const cost = parseFloat(form.purchase_cost)
    await supabase.from('fixed_assets').insert({
      ...form,
      purchase_cost: cost,
      current_value: cost - parseFloat(form.salvage_value),
      salvage_value: parseFloat(form.salvage_value),
      useful_life_years: parseInt(form.useful_life_years),
    })
    await load()
    setShowModal(false)
    setSaving(false)
  }

  const filtered = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.asset_number.includes(search) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  )

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const totalValue = assets.reduce((s, a) => s + a.current_value, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Fixed Assets</div>
          <div className="page-subtitle">Asset register and depreciation tracking</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Asset</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Asset Value</div><div className="stat-value">{fmt(totalValue)}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Active Assets</div><div className="stat-value">{assets.filter(a => a.status === 'active').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">In Maintenance</div><div className="stat-value">{assets.filter(a => a.status === 'maintenance').length}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Assets ({filtered.length})</span>
          <div className="search-bar">
            <Search size={14} />
            <input className="form-input" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Asset #</th><th>Name</th><th>Category</th><th>Purchase Date</th><th style={{ textAlign:'right' }}>Cost</th><th style={{ textAlign:'right' }}>Current Value</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><Landmark size={32} /><p>No assets found.</p></div></td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id}>
                    <td><span style={{ fontFamily:'monospace', fontWeight:600 }}>{a.asset_number}</span></td>
                    <td style={{ fontWeight:500 }}>{a.name}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{a.category}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{a.purchase_date}</td>
                    <td style={{ textAlign:'right', fontFamily:'monospace' }}>{fmt(a.purchase_cost)}</td>
                    <td style={{ textAlign:'right', fontFamily:'monospace', fontWeight:600 }}>{fmt(a.current_value)}</td>
                    <td><span className={`badge ${statusBadge[a.status]}`} style={{ textTransform:'capitalize' }}>{a.status}</span></td>
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
              <span className="modal-title">Add Fixed Asset</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Asset Number</label>
                  <input className="form-input" placeholder="AST-0001" value={form.asset_number} onChange={e => setForm({ ...form, asset_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Asset Name</label>
                  <input className="form-input" placeholder="e.g. Company Vehicle" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input className="form-input" placeholder="e.g. Vehicles, Equipment" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" placeholder="e.g. Warehouse A" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input type="date" className="form-input" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Cost</label>
                  <input type="number" className="form-input" placeholder="0.00" value={form.purchase_cost} onChange={e => setForm({ ...form, purchase_cost: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Salvage Value</label>
                  <input type="number" className="form-input" placeholder="0.00" value={form.salvage_value} onChange={e => setForm({ ...form, salvage_value: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Useful Life (Years)</label>
                  <input type="number" className="form-input" value={form.useful_life_years} onChange={e => setForm({ ...form, useful_life_years: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Depreciation Method</label>
                  <select className="form-input" value={form.depreciation_method} onChange={e => setForm({ ...form, depreciation_method: e.target.value })}>
                    <option value="straight_line">Straight Line</option>
                    <option value="declining_balance">Declining Balance</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Add Asset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
