import { useState, useEffect } from 'react'
import { Plus, Factory } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ProductionOrder } from '../../types'

const statusBadge: Record<string, string> = { planned: 'badge-gray', in_progress: 'badge-yellow', completed: 'badge-green', cancelled: 'badge-red' }

interface BOMOption { id: string; products?: { name: string; sku: string } }

export default function Production() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [boms, setBoms] = useState<BOMOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ order_number: '', bom_id: '', quantity_planned: '1', planned_start: '', planned_end: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const [os, bs] = await Promise.all([
      supabase.from('production_orders').select('*, bill_of_materials(finished_product_id, products(name))').order('created_at', { ascending: false }),
      supabase.from('bill_of_materials').select('*, products(name, sku)').eq('is_active', true)
    ])
    setOrders(os.data ?? [])
    setBoms(bs.data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('production_orders').insert({ ...form, quantity_planned: parseInt(form.quantity_planned) })
    await load()
    setShowModal(false)
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('production_orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as any } : o))
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Production Orders</div>
          <div className="page-subtitle">Shop floor work orders and scheduling</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Order</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Orders</div><div className="stat-value">{orders.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">In Progress</div><div className="stat-value" style={{ color:'var(--yellow-600)' }}>{orders.filter(o => o.status === 'in_progress').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Completed</div><div className="stat-value" style={{ color:'var(--green-600)' }}>{orders.filter(o => o.status === 'completed').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Units Planned</div><div className="stat-value">{orders.reduce((s, o) => s + o.quantity_planned, 0).toLocaleString()}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Production Orders</span></div>
        {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Order #</th><th>Product</th><th style={{ textAlign:'right' }}>Planned Qty</th><th style={{ textAlign:'right' }}>Produced</th><th>Planned Start</th><th>Planned End</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><Factory size={32} /><p>No production orders found.</p></div></td></tr>
                ) : orders.map(o => (
                  <tr key={o.id}>
                    <td><span style={{ fontWeight:600, color:'var(--blue-600)' }}>{o.order_number}</span></td>
                    <td style={{ fontWeight:500 }}>{(o as any).bill_of_materials?.products?.name ?? '—'}</td>
                    <td style={{ textAlign:'right', fontWeight:600 }}>{o.quantity_planned.toLocaleString()}</td>
                    <td style={{ textAlign:'right', color:'var(--green-600)', fontWeight:600 }}>{o.quantity_produced.toLocaleString()}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{o.planned_start ?? '—'}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{o.planned_end ?? '—'}</td>
                    <td><span className={`badge ${statusBadge[o.status]}`} style={{ textTransform:'capitalize' }}>{o.status.replace('_',' ')}</span></td>
                    <td>
                      {o.status === 'planned' && <button className="btn btn-sm" style={{ background:'var(--yellow-100)', color:'var(--yellow-600)' }} onClick={() => updateStatus(o.id, 'in_progress')}>Start</button>}
                      {o.status === 'in_progress' && <button className="btn btn-sm" style={{ background:'var(--green-100)', color:'var(--green-700)' }} onClick={() => updateStatus(o.id, 'completed')}>Complete</button>}
                    </td>
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
              <span className="modal-title">New Production Order</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Order Number</label>
                <input className="form-input" placeholder="PRD-0001" value={form.order_number} onChange={e => setForm({...form, order_number: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Bill of Materials</label>
                <select className="form-input" value={form.bom_id} onChange={e => setForm({...form, bom_id: e.target.value})}>
                  <option value="">Select BOM...</option>
                  {boms.map(b => <option key={b.id} value={b.id}>{b.products?.name} ({b.products?.sku})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity to Produce</label>
                <input type="number" className="form-input" value={form.quantity_planned} onChange={e => setForm({...form, quantity_planned: e.target.value})} />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Planned Start</label>
                  <input type="date" className="form-input" value={form.planned_start} onChange={e => setForm({...form, planned_start: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Planned End</label>
                  <input type="date" className="form-input" value={form.planned_end} onChange={e => setForm({...form, planned_end: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Create Order'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
