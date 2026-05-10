import { useState, useEffect } from 'react'
import { Plus, Search, Package, TriangleAlert as AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Inventory as Inv, Product } from '../../types'

export default function Inventory() {
  const [inventory, setInventory] = useState<Inv[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ sku: '', name: '', description: '', unit_cost: '', unit_price: '', reorder_point: '10', unit_of_measure: 'each' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('inventory').select('*, products(name, sku, reorder_point, unit_price, unit_cost), warehouses(name)').order('id')
    setInventory(data ?? [])
    setLoading(false)
  }

  async function saveProduct() {
    setSaving(true)
    const { data: prod } = await supabase.from('products').insert({
      ...form,
      unit_cost: parseFloat(form.unit_cost || '0'),
      unit_price: parseFloat(form.unit_price || '0'),
      reorder_point: parseInt(form.reorder_point || '10'),
    }).select().single()

    if (prod) {
      const { data: wh } = await supabase.from('warehouses').select('id').limit(1).maybeSingle()
      if (wh) {
        await supabase.from('inventory').insert({ product_id: prod.id, warehouse_id: wh.id, quantity_on_hand: 0 })
      }
    }
    await load()
    setShowAddProduct(false)
    setSaving(false)
  }

  const filtered = inventory.filter(i =>
    (i.products?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.products?.sku ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = inventory.filter(i => i.quantity_on_hand <= ((i as any).products?.reorder_point ?? 0))
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Inventory</div>
          <div className="page-subtitle">Real-time stock levels and SKU management</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddProduct(true)}><Plus size={16} /> Add Product</button>
      </div>

      {lowStock.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} />
          <span><strong>{lowStock.length} products</strong> are at or below reorder point and need restocking.</span>
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total SKUs</div><div className="stat-value">{inventory.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Units</div><div className="stat-value">{inventory.reduce((s, i) => s + i.quantity_on_hand, 0).toLocaleString()}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Low Stock Items</div><div className="stat-value" style={{ color: lowStock.length > 0 ? 'var(--red-600)' : 'var(--green-600)' }}>{lowStock.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Reserved Units</div><div className="stat-value">{inventory.reduce((s, i) => s + i.quantity_reserved, 0).toLocaleString()}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Stock Levels ({filtered.length})</span>
          <div className="search-bar">
            <Search size={14} />
            <input className="form-input" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>SKU</th><th>Product</th><th>Warehouse</th><th style={{ textAlign:'right' }}>On Hand</th><th style={{ textAlign:'right' }}>Reserved</th><th style={{ textAlign:'right' }}>Available</th><th style={{ textAlign:'right' }}>Unit Price</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><Package size={32} /><p>No inventory found. Add your first product.</p></div></td></tr>
                ) : filtered.map(i => {
                  const low = i.quantity_on_hand <= ((i as any).products?.reorder_point ?? 0)
                  return (
                    <tr key={i.id}>
                      <td><span style={{ fontFamily:'monospace', fontWeight:600, fontSize:12 }}>{(i as any).products?.sku}</span></td>
                      <td style={{ fontWeight:500 }}>{(i as any).products?.name}</td>
                      <td style={{ color:'var(--gray-500)', fontSize:13 }}>{(i as any).warehouses?.name ?? '—'}</td>
                      <td style={{ textAlign:'right', fontWeight:600, color: low ? 'var(--red-600)' : 'inherit' }}>{i.quantity_on_hand.toLocaleString()}</td>
                      <td style={{ textAlign:'right', color:'var(--gray-500)' }}>{i.quantity_reserved.toLocaleString()}</td>
                      <td style={{ textAlign:'right', fontWeight:600, color:'var(--green-600)' }}>{i.quantity_available.toLocaleString()}</td>
                      <td style={{ textAlign:'right', fontFamily:'monospace' }}>{fmt((i as any).products?.unit_price ?? 0)}</td>
                      <td>{low ? <span className="badge badge-red">Low Stock</span> : <span className="badge badge-green">OK</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddProduct && (
        <div className="modal-backdrop">
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">Add Product</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddProduct(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input className="form-input" placeholder="SKU-001" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input className="form-input" placeholder="Product name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Cost</label>
                  <input type="number" className="form-input" placeholder="0.00" value={form.unit_cost} onChange={e => setForm({...form, unit_cost: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price</label>
                  <input type="number" className="form-input" placeholder="0.00" value={form.unit_price} onChange={e => setForm({...form, unit_price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Point</label>
                  <input type="number" className="form-input" value={form.reorder_point} onChange={e => setForm({...form, reorder_point: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <select className="form-input" value={form.unit_of_measure} onChange={e => setForm({...form, unit_of_measure: e.target.value})}>
                    <option>each</option><option>kg</option><option>liter</option><option>meter</option><option>box</option><option>pallet</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Optional description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddProduct(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveProduct} disabled={saving}>{saving ? 'Saving...' : 'Add Product'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
