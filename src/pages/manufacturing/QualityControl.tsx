import { useState, useEffect } from 'react'
import { Plus, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface QualityInspection {
  id: string
  inspection_date: string
  inspector_name: string
  quantity_inspected: number
  quantity_passed: number
  quantity_failed: number
  status: string
  notes: string
  products?: { name: string }
  production_orders?: { order_number: string }
}

const statusBadge: Record<string, string> = { pending: 'badge-yellow', passed: 'badge-green', failed: 'badge-red', conditional: 'badge-orange' }

export default function QualityControl() {
  const [inspections, setInspections] = useState<QualityInspection[]>([])
  const [products, setProducts] = useState<{ id: string; name: string; sku: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ product_id: '', inspector_name: '', inspection_date: new Date().toISOString().split('T')[0], quantity_inspected: '', quantity_passed: '', notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const [ins, prods] = await Promise.all([
      supabase.from('quality_inspections').select('*, products(name), production_orders(order_number)').order('inspection_date', { ascending: false }),
      supabase.from('products').select('id, name, sku').eq('is_active', true).order('name')
    ])
    setInspections(ins.data ?? [])
    setProducts(prods.data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const inspected = parseInt(form.quantity_inspected)
    const passed = parseInt(form.quantity_passed)
    const failed = inspected - passed
    const status = failed === 0 ? 'passed' : passed === 0 ? 'failed' : 'conditional'
    await supabase.from('quality_inspections').insert({
      ...form,
      quantity_inspected: inspected,
      quantity_passed: passed,
      quantity_failed: failed,
      status,
    })
    await load()
    setShowModal(false)
    setSaving(false)
  }

  const passRate = inspections.length > 0
    ? ((inspections.reduce((s, i) => s + i.quantity_passed, 0) / inspections.reduce((s, i) => s + i.quantity_inspected, 0)) * 100).toFixed(1)
    : '—'

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quality Control</div>
          <div className="page-subtitle">Inspection workflows and quality assurance</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Inspection</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Inspections</div><div className="stat-value">{inspections.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Pass Rate</div><div className="stat-value" style={{ color:'var(--green-600)' }}>{passRate}%</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Failed Inspections</div><div className="stat-value" style={{ color:'var(--red-600)' }}>{inspections.filter(i => i.status === 'failed').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Units Rejected</div><div className="stat-value">{inspections.reduce((s, i) => s + i.quantity_failed, 0).toLocaleString()}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Inspections</span></div>
        {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Date</th><th>Product</th><th>Inspector</th><th style={{ textAlign:'center' }}>Inspected</th><th style={{ textAlign:'center' }}>Passed</th><th style={{ textAlign:'center' }}>Failed</th><th>Status</th></tr>
              </thead>
              <tbody>
                {inspections.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><AlertTriangle size={32} /><p>No inspections found.</p></div></td></tr>
                ) : inspections.map(i => (
                  <tr key={i.id}>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{i.inspection_date}</td>
                    <td style={{ fontWeight:500 }}>{i.products?.name ?? '—'}</td>
                    <td style={{ color:'var(--gray-600)' }}>{i.inspector_name}</td>
                    <td style={{ textAlign:'center', fontWeight:600 }}>{i.quantity_inspected}</td>
                    <td style={{ textAlign:'center', fontWeight:600, color:'var(--green-600)' }}>{i.quantity_passed}</td>
                    <td style={{ textAlign:'center', fontWeight:600, color: i.quantity_failed > 0 ? 'var(--red-600)' : 'var(--gray-400)' }}>{i.quantity_failed}</td>
                    <td><span className={`badge ${statusBadge[i.status]}`} style={{ textTransform:'capitalize' }}>{i.status}</span></td>
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
              <span className="modal-title">New Inspection</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Product</label>
                <select className="form-input" value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})}>
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Inspector Name</label>
                  <input className="form-input" value={form.inspector_name} onChange={e => setForm({...form, inspector_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Inspection Date</label>
                  <input type="date" className="form-input" value={form.inspection_date} onChange={e => setForm({...form, inspection_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity Inspected</label>
                  <input type="number" className="form-input" value={form.quantity_inspected} onChange={e => setForm({...form, quantity_inspected: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity Passed</label>
                  <input type="number" className="form-input" value={form.quantity_passed} onChange={e => setForm({...form, quantity_passed: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Record Inspection'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
