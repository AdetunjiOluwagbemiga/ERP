import { useState, useEffect } from 'react'
import { Plus, CalendarDays } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { LeaveRequest, Employee } from '../../types'

interface LeaveType { id: string; name: string; code: string }
const statusBadge: Record<string, string> = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red', cancelled: 'badge-gray' }

export default function LeaveManagement() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ employee_id: '', leave_type_id: '', start_date: '', end_date: '', reason: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const [reqs, emps, lts] = await Promise.all([
      supabase.from('leave_requests').select('*, employees(first_name, last_name), leave_types(name)').order('created_at', { ascending: false }),
      supabase.from('employees').select('*').eq('status', 'active').order('last_name'),
      supabase.from('leave_types').select('*').eq('is_active', true)
    ])
    setRequests(reqs.data ?? [])
    setEmployees(emps.data ?? [])
    setLeaveTypes(lts.data ?? [])
    if ((lts.data ?? []).length === 0) {
      await supabase.from('leave_types').insert([
        { name: 'Annual Leave', code: 'AL', days_per_year: 20, is_paid: true },
        { name: 'Sick Leave', code: 'SL', days_per_year: 10, is_paid: true },
        { name: 'Unpaid Leave', code: 'UL', days_per_year: 30, is_paid: false },
      ])
    }
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const start = new Date(form.start_date)
    const end = new Date(form.end_date)
    const days = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1
    await supabase.from('leave_requests').insert({ ...form, days_requested: days })
    await load()
    setShowModal(false)
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('leave_requests').update({ status }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: status as any } : r))
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Leave Management</div>
          <div className="page-subtitle">Vacation, sick leave, and absence requests</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Request</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Requests</div><div className="stat-value">{requests.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Pending</div><div className="stat-value" style={{ color:'var(--yellow-600)' }}>{requests.filter(r => r.status === 'pending').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Approved</div><div className="stat-value" style={{ color:'var(--green-600)' }}>{requests.filter(r => r.status === 'approved').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Days Approved</div><div className="stat-value">{requests.filter(r => r.status === 'approved').reduce((s, r) => s + r.days_requested, 0)}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Leave Requests</span></div>
        {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Employee</th><th>Leave Type</th><th>Start Date</th><th>End Date</th><th style={{ textAlign:'center' }}>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><CalendarDays size={32} /><p>No leave requests found.</p></div></td></tr>
                ) : requests.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight:500 }}>{r.employees?.first_name} {r.employees?.last_name}</td>
                    <td style={{ color:'var(--gray-600)' }}>{r.leave_types?.name}</td>
                    <td style={{ fontSize:13, color:'var(--gray-500)' }}>{r.start_date}</td>
                    <td style={{ fontSize:13, color:'var(--gray-500)' }}>{r.end_date}</td>
                    <td style={{ textAlign:'center', fontWeight:600 }}>{r.days_requested}</td>
                    <td style={{ fontSize:13, color:'var(--gray-500)', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.reason || '—'}</td>
                    <td><span className={`badge ${statusBadge[r.status]}`} style={{ textTransform:'capitalize' }}>{r.status}</span></td>
                    <td>
                      {r.status === 'pending' && (
                        <div style={{ display:'flex', gap:4 }}>
                          <button className="btn btn-sm" style={{ background:'var(--green-100)', color:'var(--green-700)' }} onClick={() => updateStatus(r.id, 'approved')}>Approve</button>
                          <button className="btn btn-sm" style={{ background:'var(--red-100)', color:'var(--red-700)' }} onClick={() => updateStatus(r.id, 'rejected')}>Reject</button>
                        </div>
                      )}
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
              <span className="modal-title">New Leave Request</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select className="form-input" value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})}>
                  <option value="">Select employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Leave Type</label>
                <select className="form-input" value={form.leave_type_id} onChange={e => setForm({...form, leave_type_id: e.target.value})}>
                  <option value="">Select type...</option>
                  {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                </select>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="form-input" placeholder="Reason for leave..." value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Submit Request'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
