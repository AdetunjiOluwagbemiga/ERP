import { useState, useEffect } from 'react'
import { Plus, Search, ShoppingCart } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PurchaseOrder, Vendor } from '../../types'

const statusBadge: Record<string, string> = { draft: 'badge-gray', sent: 'badge-blue', partial: 'badge-yellow', received: 'badge-green', cancelled: 'badge-red' }

export default function Purchasing() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ po_number: '', vendor_id: '', order_date: new Date().toISOString().split('T')[0], expected_date: '', notes: '' })
  const [vendorForm, setVendorForm] = useState({ name: '', email: '', phone: '', address: '', payment_terms: '30' })

  useEffect(() => { load() }, [])

  async function load() {
    const [pos, vs] = await Promise.all([
      supabase.from('purchase_orders').select('*, vendors(name)').order('order_date', { ascending: false }),
      supabase.from('vendors').select('*').eq('is_active', true).order('name')
    ])
    setOrders(pos.data ?? [])
    setVendors(vs.data ?? [])
    setLoading(false)
  }

  async function savePO() {
    setSaving(true)
    await supabase.from('purchase_orders').insert({ ...form, vendor_id: form.vendor_id || null })
    await load()
    setShowModal(false)
    setSaving(false)
  }

  async function saveVendor() {
    setSaving(true)
    await supabase.from('vendors').insert({ ...vendorForm, payment_terms: parseInt(vendorForm.payment_terms) })
    await load()
    setShowVendorModal(false)
    setVendorForm({ name: '', email: '', phone: '', address: '', payment_terms: '30' })
    setSaving(false)
  }

  const filtered = orders.filter(o =>
    o.po_number.toLowerCase().includes(search.toLowerCase()) ||
    (o.vendors?.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Purchasing</div>
          <div className="page-subtitle">Purchase orders and vendor management</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-secondary" onClick={() => setShowVendorModal(true)}><Plus size={16} /> Add Vendor</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New PO</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total POs</div><div className="stat-value">{orders.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Open POs</div><div className="stat-value">{orders.filter(o => o.status === 'draft' || o.status === 'sent').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Value</div><div className="stat-value" style={{ fontSize:16 }}>{fmt(orders.reduce((s, o) => s + o.total_amount, 0))}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Vendors</div><div className="stat-value">{vendors.length}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Purchase Orders ({filtered.length})</span>
          <div className="search-bar">
            <Search size={14} />
            <input className="form-input" placeholder="Search POs..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>PO Number</th><th>Vendor</th><th>Order Date</th><th>Expected Date</th><th style={{ textAlign:'right' }}>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><ShoppingCart size={32} /><p>No purchase orders found.</p></div></td></tr>
                ) : filtered.map(o => (
                  <tr key={o.id}>
                    <td><span style={{ fontWeight:600, color:'var(--blue-600)' }}>{o.po_number}</span></td>
                    <td style={{ fontWeight:500 }}>{o.vendors?.name ?? '—'}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{o.order_date}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{o.expected_date ?? '—'}</td>
                    <td style={{ textAlign:'right', fontFamily:'monospace', fontWeight:600 }}>{fmt(o.total_amount)}</td>
                    <td><span className={`badge ${statusBadge[o.status]}`} style={{ textTransform:'capitalize' }}>{o.status}</span></td>
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
              <span className="modal-title">New Purchase Order</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">PO Number</label>
                <input className="form-input" placeholder="PO-0001" value={form.po_number} onChange={e => setForm({...form, po_number: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Vendor</label>
                <select className="form-input" value={form.vendor_id} onChange={e => setForm({...form, vendor_id: e.target.value})}>
                  <option value="">Select vendor...</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Order Date</label>
                  <input type="date" className="form-input" value={form.order_date} onChange={e => setForm({...form, order_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Expected Date</label>
                  <input type="date" className="form-input" value={form.expected_date} onChange={e => setForm({...form, expected_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={savePO} disabled={saving}>{saving ? 'Saving...' : 'Create PO'}</button>
            </div>
          </div>
        </div>
      )}

      {showVendorModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add Vendor</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowVendorModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {[['Vendor Name', 'name', 'text'], ['Email', 'email', 'email'], ['Phone', 'phone', 'text'], ['Address', 'address', 'text'], ['Payment Terms (days)', 'payment_terms', 'number']].map(([label, key, type]) => (
                <div className="form-group" key={key as string}>
                  <label className="form-label">{label as string}</label>
                  <input type={type as string} className="form-input" value={(vendorForm as any)[key as string]} onChange={e => setVendorForm({...vendorForm, [key as string]: e.target.value})} />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowVendorModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveVendor} disabled={saving}>{saving ? 'Saving...' : 'Add Vendor'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
