import { useState, useEffect } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Employee, Department } from '../../types'

const statusBadge: Record<string, string> = { active: 'badge-green', inactive: 'badge-gray', on_leave: 'badge-yellow', terminated: 'badge-red' }

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    employee_number: '', first_name: '', last_name: '', email: '', phone: '',
    job_title: '', department_id: '', employment_type: 'full_time',
    hire_date: '', salary: '', status: 'active'
  })

  useEffect(() => { load() }, [])

  async function load() {
    const [emps, depts] = await Promise.all([
      supabase.from('employees').select('*, departments(name)').order('last_name'),
      supabase.from('departments').select('*').eq('is_active', true)
    ])
    setEmployees(emps.data ?? [])
    setDepartments(depts.data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('employees').insert({
      ...form,
      salary: parseFloat(form.salary || '0'),
      department_id: form.department_id || null,
    })
    await load()
    setShowModal(false)
    setSaving(false)
  }

  const filtered = employees.filter(e =>
    `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.job_title.toLowerCase().includes(search.toLowerCase())
  )

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Employees</div>
          <div className="page-subtitle">Employee profiles and records</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Employee</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Employees</div><div className="stat-value">{employees.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Active</div><div className="stat-value" style={{ color:'var(--green-600)' }}>{employees.filter(e => e.status === 'active').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">On Leave</div><div className="stat-value" style={{ color:'var(--yellow-600)' }}>{employees.filter(e => e.status === 'on_leave').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Payroll</div><div className="stat-value" style={{ fontSize:16 }}>{fmt(employees.reduce((s, e) => s + e.salary, 0))}</div></div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Staff Directory ({filtered.length})</span>
          <div className="search-bar">
            <Search size={14} />
            <input className="form-input" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Employee #</th><th>Name</th><th>Job Title</th><th>Department</th><th>Type</th><th style={{ textAlign:'right' }}>Salary</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><Users size={32} /><p>No employees found.</p></div></td></tr>
                ) : filtered.map(e => (
                  <tr key={e.id}>
                    <td><span style={{ fontFamily:'monospace', fontWeight:600, color:'var(--blue-600)' }}>{e.employee_number}</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--blue-100)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600, color:'var(--blue-600)', flexShrink:0 }}>
                          {e.first_name[0]}{e.last_name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight:500 }}>{e.first_name} {e.last_name}</div>
                          <div style={{ fontSize:12, color:'var(--gray-500)' }}>{e.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color:'var(--gray-700)' }}>{e.job_title}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{e.departments?.name ?? '—'}</td>
                    <td><span className="badge badge-gray" style={{ textTransform:'capitalize' }}>{e.employment_type.replace('_',' ')}</span></td>
                    <td style={{ textAlign:'right', fontFamily:'monospace', fontWeight:500 }}>{fmt(e.salary)}</td>
                    <td><span className={`badge ${statusBadge[e.status]}`} style={{ textTransform:'capitalize' }}>{e.status.replace('_',' ')}</span></td>
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
              <span className="modal-title">Add Employee</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Employee Number</label>
                  <input className="form-input" placeholder="EMP-001" value={form.employee_number} onChange={e => setForm({...form, employee_number: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input className="form-input" value={form.job_title} onChange={e => setForm({...form, job_title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-input" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})}>
                    <option value="">No department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Employment Type</label>
                  <select className="form-input" value={form.employment_type} onChange={e => setForm({...form, employment_type: e.target.value})}>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Hire Date</label>
                  <input type="date" className="form-input" value={form.hire_date} onChange={e => setForm({...form, hire_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Annual Salary</label>
                  <input type="number" className="form-input" placeholder="0.00" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Add Employee'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
