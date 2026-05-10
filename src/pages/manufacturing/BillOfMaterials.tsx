import { useState, useEffect } from 'react'
import { Plus, Search, ClipboardList } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { BillOfMaterials, Product } from '../../types'

export default function BillOfMaterialsPage() {
  const [boms, setBoms] = useState<BillOfMaterials[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ finished_product_id: '', version: '1.0', description: '', production_quantity: '1' })

  useEffect(() => { load() }, [])

  async function load() {
    const [bs, ps] = await Promise.all([
      supabase.from('bill_of_materials').select('*, products(name, sku)').order('created_at', { ascending: false }),
      supabase.from('products').select('*').eq('is_active', true).order('name')
    ])
    setBoms(bs.data ?? [])
    setProducts(ps.data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('bill_of_materials').insert({ ...form, production_quantity: parseInt(form.production_quantity) })
    await load()
    setShowModal(false)
    setSaving(false)
  }

  const filtered = boms.filter(b =>
    (b.products?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (b.products?.sku ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Bill of Materials</div>
          <div className="page-subtitle">Product recipes and component requirements</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New BOM</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total BOMs</div><div className="stat-value">{boms.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Active BOMs</div><div className="stat-value">{boms.filter(b => b.is_active).length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Products with BOM</div><div className="stat-value">{new Set(boms.map(b => b.finished_product_id)).size}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Bill of Materials ({filtered.length})</span>
          <div className="search-bar">
            <Search size={14} />
            <input className="form-input" placeholder="Search BOMs..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Finished Product</th><th>SKU</th><th>Version</th><th style={{ textAlign:'center' }}>Qty Produced</th><th>Description</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><ClipboardList size={32} /><p>No BOMs found.</p></div></td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight:500 }}>{b.products?.name ?? '—'}</td>
                    <td><span style={{ fontFamily:'monospace', fontSize:12 }}>{b.products?.sku ?? '—'}</span></td>
                    <td><span className="badge badge-blue">v{b.version}</span></td>
                    <td style={{ textAlign:'center', fontWeight:600 }}>{b.production_quantity}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{b.description || '—'}</td>
                    <td><span className={`badge ${b.is_active ? 'badge-green' : 'badge-gray'}`}>{b.is_active ? 'Active' : 'Inactive'}</span></td>
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
              <span className="modal-title">New Bill of Materials</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Finished Product</label>
                <select className="form-input" value={form.finished_product_id} onChange={e => setForm({...form, finished_product_id: e.target.value})}>
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Version</label>
                  <input className="form-input" value={form.version} onChange={e => setForm({...form, version: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Production Quantity</label>
                  <input type="number" className="form-input" value={form.production_quantity} onChange={e => setForm({...form, production_quantity: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Create BOM'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
