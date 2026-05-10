import { useState, useEffect } from 'react'
import { Plus, Search, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { CustomerOrder } from '../../types'

const statusBadge: Record<string, string> = {
  pending: 'badge-yellow', confirmed: 'badge-blue', picking: 'badge-orange',
  shipped: 'badge-teal', delivered: 'badge-green', cancelled: 'badge-red'
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ order_number: '', customer_name: '', customer_email: '', customer_phone: '', order_date: new Date().toISOString().split('T')[0], ship_to_address: '', notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('customer_orders').select('*').order('order_date', { ascending: false })
    setOrders(data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('customer_orders').insert(form)
    await load()
    setShowModal(false)
    setSaving(false)
  }

  const filtered = orders.filter(o =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(search.toLowerCase())
  )

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Customer Orders</div>
          <div className="page-subtitle">Order management from entry to delivery</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Order</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        {[['Total Orders', orders.length, ''], ['Pending', orders.filter(o => o.status === 'pending').length, 'var(--yellow-600)'],
          ['In Fulfillment', orders.filter(o => ['confirmed','picking'].includes(o.status)).length, 'var(--blue-600)'],
          ['Shipped', orders.filter(o => o.status === 'shipped').length, 'var(--teal-600)'],
          ['Delivered', orders.filter(o => o.status === 'delivered').length, 'var(--green-600)']
        ].map(([label, val, color]) => (
          <div className="stat-card" key={label as string}><div className="stat-content"><div className="stat-label">{label as string}</div><div className="stat-value" style={{ color: color as string || undefined }}>{val as number}</div></div></div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Orders ({filtered.length})</span>
          <div className="search-bar">
            <Search size={14} />
            <input className="form-input" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Order #</th><th>Customer</th><th>Email</th><th>Date</th><th style={{ textAlign:'right' }}>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><FileText size={32} /><p>No orders found.</p></div></td></tr>
                ) : filtered.map(o => (
                  <tr key={o.id}>
                    <td><span style={{ fontWeight:600, color:'var(--blue-600)' }}>{o.order_number}</span></td>
                    <td style={{ fontWeight:500 }}>{o.customer_name}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{o.customer_email}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{o.order_date}</td>
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
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">New Customer Order</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Order Number</label>
                  <input className="form-input" placeholder="ORD-0001" value={form.order_number} onChange={e => setForm({...form, order_number: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Order Date</label>
                  <input type="date" className="form-input" value={form.order_date} onChange={e => setForm({...form, order_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Name</label>
                  <input className="form-input" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={form.customer_email} onChange={e => setForm({...form, customer_email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Ship To Address</label>
                <input className="form-input" value={form.ship_to_address} onChange={e => setForm({...form, ship_to_address: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
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
