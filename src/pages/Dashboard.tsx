import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, Users, Package, ShoppingCart, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const revenueData = [
  { month: 'Jan', revenue: 42000, expenses: 31000 },
  { month: 'Feb', revenue: 48000, expenses: 34000 },
  { month: 'Mar', revenue: 51000, expenses: 29000 },
  { month: 'Apr', revenue: 47000, expenses: 33000 },
  { month: 'May', revenue: 58000, expenses: 38000 },
  { month: 'Jun', revenue: 63000, expenses: 40000 },
]

const pipelineData = [
  { name: 'New', value: 12, color: '#60a5fa' },
  { name: 'Contacted', value: 8, color: '#34d399' },
  { name: 'Qualified', value: 6, color: '#fbbf24' },
  { name: 'Proposal', value: 4, color: '#f97316' },
  { name: 'Won', value: 3, color: '#22c55e' },
]

export default function Dashboard() {
  const [stats, setStats] = useState({
    employees: 0,
    openOrders: 0,
    lowStock: 0,
    arBalance: 0,
    apBalance: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [emp, orders, inv, ar, ap] = await Promise.all([
        supabase.from('employees').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('customer_orders').select('id', { count: 'exact' }).in('status', ['pending', 'confirmed', 'picking']),
        supabase.from('inventory').select('quantity_on_hand, products(reorder_point)'),
        supabase.from('accounts_receivable').select('amount, paid_amount').in('status', ['unpaid', 'partial']),
        supabase.from('accounts_payable').select('amount, paid_amount').in('status', ['unpaid', 'partial']),
      ])

      const lowStock = (inv.data || []).filter((i: any) => i.quantity_on_hand <= (i.products?.reorder_point ?? 0)).length
      const arBal = (ar.data || []).reduce((s: number, r: any) => s + (r.amount - r.paid_amount), 0)
      const apBal = (ap.data || []).reduce((s: number, r: any) => s + (r.amount - r.paid_amount), 0)

      setStats({
        employees: emp.count ?? 0,
        openOrders: orders.count ?? 0,
        lowStock,
        arBalance: arBal,
        apBalance: apBal,
      })
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Welcome back — here's your business overview</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--blue-50)' }}>
            <DollarSign size={20} color="var(--blue-600)" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Accounts Receivable</div>
            <div className="stat-value">{loading ? '—' : fmt(stats.arBalance)}</div>
            <div className="stat-change up"><ArrowUpRight size={12} style={{ display: 'inline' }} /> Outstanding balance</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--red-50)' }}>
            <TrendingUp size={20} color="var(--red-600)" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Accounts Payable</div>
            <div className="stat-value">{loading ? '—' : fmt(stats.apBalance)}</div>
            <div className="stat-change down"><ArrowDownRight size={12} style={{ display: 'inline' }} /> Owed to vendors</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--green-50)' }}>
            <Users size={20} color="var(--green-600)" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active Employees</div>
            <div className="stat-value">{loading ? '—' : stats.employees}</div>
            <div className="stat-change" style={{ color: 'var(--gray-500)' }}>Headcount</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--orange-50)' }}>
            <ShoppingCart size={20} color="var(--orange-500)" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Open Orders</div>
            <div className="stat-value">{loading ? '—' : stats.openOrders}</div>
            <div className="stat-change" style={{ color: 'var(--gray-500)' }}>In fulfillment</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: stats.lowStock > 0 ? 'var(--red-50)' : 'var(--teal-50)' }}>
            <Package size={20} color={stats.lowStock > 0 ? 'var(--red-600)' : 'var(--teal-600)'} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Low Stock Alerts</div>
            <div className="stat-value">{loading ? '—' : stats.lowStock}</div>
            <div className="stat-change" style={{ color: stats.lowStock > 0 ? 'var(--red-600)' : 'var(--green-600)' }}>
              {stats.lowStock > 0 ? 'Needs reorder' : 'All stocked'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue vs Expenses</span>
            <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Last 6 months</span>
          </div>
          <div className="card-body chart-container">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--gray-500)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--gray-500)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                <Bar dataKey="revenue" fill="var(--blue-500)" radius={[4,4,0,0]} name="Revenue" />
                <Bar dataKey="expenses" fill="var(--red-400)" radius={[4,4,0,0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Sales Pipeline</span>
            <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>By stage</span>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 8 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {pipelineData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {pipelineData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                    <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Activity</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Module</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'Order', desc: 'New customer order #ORD-0089 received', module: 'Supply Chain', time: '5 min ago', badge: 'badge-blue' },
                { type: 'Invoice', desc: 'Invoice INV-0042 marked overdue', module: 'Finance', time: '1 hr ago', badge: 'badge-red' },
                { type: 'Leave', desc: 'Leave request approved for J. Smith', module: 'HR', time: '2 hr ago', badge: 'badge-green' },
                { type: 'PO', desc: 'Purchase Order PO-0023 sent to vendor', module: 'Procurement', time: '3 hr ago', badge: 'badge-yellow' },
                { type: 'Lead', desc: 'New opportunity: Acme Corp - $45,000', module: 'CRM', time: '4 hr ago', badge: 'badge-teal' },
              ].map((row, i) => (
                <tr key={i}>
                  <td><span className={`badge ${row.badge}`}>{row.type}</span></td>
                  <td style={{ color: 'var(--gray-700)' }}>{row.desc}</td>
                  <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>{row.module}</td>
                  <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
