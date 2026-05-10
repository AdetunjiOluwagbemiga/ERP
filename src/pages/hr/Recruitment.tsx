import { useState, useEffect } from 'react'
import { Plus, Briefcase, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { JobPosting } from '../../types'

const statusBadge: Record<string, string> = { draft: 'badge-gray', published: 'badge-green', closed: 'badge-blue', cancelled: 'badge-red' }
const appStatusBadge: Record<string, string> = { applied: 'badge-blue', screening: 'badge-yellow', interview: 'badge-teal', offer: 'badge-orange', hired: 'badge-green', rejected: 'badge-red' }

interface Application {
  id: string
  job_posting_id: string
  applicant_name: string
  applicant_email: string
  status: string
  applied_at: string
  job_postings?: { title: string }
}

export default function Recruitment() {
  const [postings, setPostings] = useState<JobPosting[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'postings' | 'applications'>('postings')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', employment_type: 'full_time', salary_min: '', salary_max: '', location: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const [p, a] = await Promise.all([
      supabase.from('job_postings').select('*, departments(name)').order('created_at', { ascending: false }),
      supabase.from('job_applications').select('*, job_postings(title)').order('applied_at', { ascending: false })
    ])
    setPostings(p.data ?? [])
    setApplications(a.data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('job_postings').insert({
      ...form,
      salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
      salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
      posted_date: new Date().toISOString().split('T')[0],
    })
    await load()
    setShowModal(false)
    setSaving(false)
  }

  const fmt = (n: number | null) => n ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) : '—'

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Recruitment</div>
          <div className="page-subtitle">Job postings and applicant tracking</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Posting</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Open Positions</div><div className="stat-value">{postings.filter(p => p.status === 'published').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Total Applicants</div><div className="stat-value">{applications.length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">In Interview</div><div className="stat-value">{applications.filter(a => a.status === 'interview').length}</div></div></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-label">Hired</div><div className="stat-value" style={{ color:'var(--green-600)' }}>{applications.filter(a => a.status === 'hired').length}</div></div></div>
      </div>

      <div className="tabs">
        <div className={`tab${tab === 'postings' ? ' active' : ''}`} onClick={() => setTab('postings')}>Job Postings ({postings.length})</div>
        <div className={`tab${tab === 'applications' ? ' active' : ''}`} onClick={() => setTab('applications')}>Applications ({applications.length})</div>
      </div>

      {loading ? <div className="loading-center"><div className="loading-spinner" /></div> : tab === 'postings' ? (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Title</th><th>Type</th><th>Location</th><th>Salary Range</th><th>Applications</th><th>Status</th></tr>
              </thead>
              <tbody>
                {postings.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><Briefcase size={32} /><p>No job postings found.</p></div></td></tr>
                ) : postings.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight:500 }}>{p.title}</td>
                    <td><span className="badge badge-gray" style={{ textTransform:'capitalize' }}>{p.employment_type.replace('_',' ')}</span></td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{p.location || '—'}</td>
                    <td style={{ fontFamily:'monospace', fontSize:13 }}>{fmt(p.salary_min)} – {fmt(p.salary_max)}</td>
                    <td style={{ textAlign:'center', fontWeight:600 }}>{applications.filter(a => a.job_posting_id === p.id).length}</td>
                    <td><span className={`badge ${statusBadge[p.status]}`} style={{ textTransform:'capitalize' }}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Applicant</th><th>Email</th><th>Position</th><th>Applied</th><th>Status</th></tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state"><Users size={32} /><p>No applications found.</p></div></td></tr>
                ) : applications.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight:500 }}>{a.applicant_name}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{a.applicant_email}</td>
                    <td style={{ color:'var(--gray-600)' }}>{a.job_postings?.title}</td>
                    <td style={{ color:'var(--gray-500)', fontSize:13 }}>{new Date(a.applied_at).toLocaleDateString()}</td>
                    <td><span className={`badge ${appStatusBadge[a.status]}`} style={{ textTransform:'capitalize' }}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">New Job Posting</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input className="form-input" placeholder="e.g. Senior Software Engineer" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Employment Type</label>
                  <select className="form-input" value={form.employment_type} onChange={e => setForm({...form, employment_type: e.target.value})}>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Internship</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" placeholder="e.g. New York, NY / Remote" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Salary Min</label>
                  <input type="number" className="form-input" placeholder="0" value={form.salary_min} onChange={e => setForm({...form, salary_min: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Salary Max</label>
                  <input type="number" className="form-input" placeholder="0" value={form.salary_max} onChange={e => setForm({...form, salary_max: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={4} placeholder="Job description..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Post Job'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
