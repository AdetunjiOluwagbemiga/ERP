import { useState, useEffect } from 'react'
import { Plus, Search, Truck } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Shipment {
  id: string
  tracking_number: string
  carrier: string
  ship_date: string | null
  estimated_delivery: string | null
  actual_delivery: string | null
  status: string
  ship_to_address: string
  customer_orders?: { customer_name: string; order_number: string }
}

const statusBadge: Record<string, string> = {
  pending: 'badge-gray', picked_up: 'badge-blue', in_transit: 'badge-yellow',
  out_for_delivery: 'badge-orange', delivered: 'badge-green', failed: 'badge-red'
}

export default function Logistics() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ tracking_number: '', carrier: '', ship_date: '', estimated_delivery: '', ship_to_address: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('shipments').select('*, customer_orders(customer_name, order_number)').order('created_at', { ascending: false })
    setShipments(data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('shipments').insert(form)
    await load()
    setShowModal(false)
    setSaving(false)
  }

  const filtered = shipments.filter(s =>
    s.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
    s.carrier.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Logistics & Distribution</div>
          <div className="page-subtitle">Shipment tracking and delivery management</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Shipment</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Shipments</div><div className="stat-value">{shipments.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">In Transit</div><div className="stat-value" style={{ color:'var(--blue-600)' }}>{shipments.filter(s => s.status === 'in_transit').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Delivered</div><div className="stat-value" style={{ color:'var(--green-600)' }}>{shipments.filter(s => s.status === 'delivered').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Failed</div><div className="stat-value" style={{ color:'var(--red-600)' }}>{shipments.filter(s => s.status === 'failed').length}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Shipments ({filtered.length})</span>
          <div className="search-bar">
            <Search size={14} />
            <input className="form-input" placeholder="Search tracking #..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Tracking #</th><th>Order</th><th>Carrier</th><th>Ship Date</th><th>Est. Delivery</th><th>Destination</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><Truck size={32} /><p>No shipments found.</p></div></td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id}>
                    <td><span style={{ fontFamily:'monospace', fontWeight:600, color:'var(--blue-600)' }}>{s.tracking_number}</span></td>
                    <td style={{ fontSize:13, color:'var(--gray-600)' }}>{s.customer_orders?.order_number ?? '—'}</td>
                    <td style={{ fontWeight:500 }}>{s.carrier || '—'}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{s.ship_date ?? '—'}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{s.estimated_delivery ?? '—'}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.ship_to_address || '—'}</td>
                    <td><span className={`badge ${statusBadge[s.status]}`} style={{ textTransform:'capitalize' }}>{s.status.replace(/_/g,' ')}</span></td>
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
              <span className="modal-title">New Shipment</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tracking Number</label>
                  <input className="form-input" placeholder="TRK-0001" value={form.tracking_number} onChange={e => setForm({...form, tracking_number: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Carrier</label>
                  <input className="form-input" placeholder="e.g. FedEx, UPS" value={form.carrier} onChange={e => setForm({...form, carrier: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ship Date</label>
                  <input type="date" className="form-input" value={form.ship_date} onChange={e => setForm({...form, ship_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Delivery</label>
                  <input type="date" className="form-input" value={form.estimated_delivery} onChange={e => setForm({...form, estimated_delivery: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Ship To Address</label>
                <input className="form-input" value={form.ship_to_address} onChange={e => setForm({...form, ship_to_address: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Create Shipment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
