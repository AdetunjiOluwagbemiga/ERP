import { useState, useEffect } from 'react'
import { Plus, Clock, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Employee } from '../../types'

interface TimeEntry {
  id: string
  employee_id: string
  clock_in: string
  clock_out: string | null
  hours_worked: number | null
  notes: string
  status: string
  employees?: { first_name: string; last_name: string }
}

const statusBadge: Record<string, string> = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' }

export default function TimeAttendance() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ employee_id: '', clock_in: '', clock_out: '', notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const [te, emps] = await Promise.all([
      supabase.from('time_entries').select('*, employees(first_name, last_name)').order('clock_in', { ascending: false }).limit(100),
      supabase.from('employees').select('*').eq('status', 'active').order('last_name')
    ])
    setEntries(te.data ?? [])
    setEmployees(emps.data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const clockIn = new Date(form.clock_in)
    const clockOut = form.clock_out ? new Date(form.clock_out) : null
    const hours = clockOut ? (clockOut.getTime() - clockIn.getTime()) / 3600000 : null
    await supabase.from('time_entries').insert({
      employee_id: form.employee_id,
      clock_in: form.clock_in,
      clock_out: form.clock_out || null,
      hours_worked: hours ? Math.round(hours * 100) / 100 : null,
      notes: form.notes,
    })
    await load()
    setShowModal(false)
    setSaving(false)
  }

  const filtered = entries.filter(e =>
    `${e.employees?.first_name ?? ''} ${e.employees?.last_name ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Time & Attendance</div>
          <div className="page-subtitle">Clock-in/out records and hours tracking</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Log Entry</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Entries</div><div className="stat-value">{entries.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Pending Approval</div><div className="stat-value" style={{ color:'var(--yellow-600)' }}>{entries.filter(e => e.status === 'pending').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Hours (All)</div><div className="stat-value">{entries.reduce((s, e) => s + (e.hours_worked ?? 0), 0).toFixed(1)}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Time Entries ({filtered.length})</span>
          <div className="search-bar">
            <Search size={14} />
            <input className="form-input" placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Employee</th><th>Clock In</th><th>Clock Out</th><th style={{ textAlign:'right' }}>Hours</th><th>Notes</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><Clock size={32} /><p>No time entries found.</p></div></td></tr>
                ) : filtered.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight:500 }}>{e.employees?.first_name} {e.employees?.last_name}</td>
                    <td style={{ fontSize:13, color:'var(--gray-600)' }}>{new Date(e.clock_in).toLocaleString()}</td>
                    <td style={{ fontSize:13, color:'var(--gray-600)' }}>{e.clock_out ? new Date(e.clock_out).toLocaleString() : <span style={{ color:'var(--green-600)', fontWeight:500 }}>Active</span>}</td>
                    <td style={{ textAlign:'right', fontFamily:'monospace', fontWeight:600 }}>{e.hours_worked != null ? e.hours_worked.toFixed(2) : '—'}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{e.notes || '—'}</td>
                    <td><span className={`badge ${statusBadge[e.status]}`} style={{ textTransform:'capitalize' }}>{e.status}</span></td>
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
              <span className="modal-title">Log Time Entry</span>
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
                <label className="form-label">Clock In</label>
                <input type="datetime-local" className="form-input" value={form.clock_in} onChange={e => setForm({...form, clock_in: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Clock Out (optional)</label>
                <input type="datetime-local" className="form-input" value={form.clock_out} onChange={e => setForm({...form, clock_out: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" placeholder="Optional notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Log Entry'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
