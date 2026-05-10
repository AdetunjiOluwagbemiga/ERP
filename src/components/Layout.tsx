import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Building2, LayoutDashboard, BookOpen, CreditCard, FileText, Landmark, Users, Clock, CalendarDays, Briefcase, Package, ShoppingCart, Truck, UserCheck, TrendingUp, Factory, ClipboardList, Settings, Bell, LogOut, ChevronDown, TriangleAlert as AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

interface Props {
  user: User
  title: string
  children: React.ReactNode
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: 'Finance',
    items: [
      { to: '/finance/gl', label: 'General Ledger', icon: BookOpen },
      { to: '/finance/ap', label: 'Accounts Payable', icon: CreditCard },
      { to: '/finance/ar', label: 'Accounts Receivable', icon: FileText },
      { to: '/finance/assets', label: 'Fixed Assets', icon: Landmark },
      { to: '/finance/bank', label: 'Cash & Banking', icon: Landmark },
    ]
  },
  {
    label: 'Human Resources',
    items: [
      { to: '/hr/employees', label: 'Employees', icon: Users },
      { to: '/hr/payroll', label: 'Payroll', icon: BookOpen },
      { to: '/hr/time', label: 'Time & Attendance', icon: Clock },
      { to: '/hr/leave', label: 'Leave Management', icon: CalendarDays },
      { to: '/hr/recruitment', label: 'Recruitment', icon: Briefcase },
    ]
  },
  {
    label: 'Supply Chain',
    items: [
      { to: '/supply/inventory', label: 'Inventory', icon: Package },
      { to: '/supply/purchasing', label: 'Purchasing', icon: ShoppingCart },
      { to: '/supply/orders', label: 'Customer Orders', icon: FileText },
      { to: '/supply/logistics', label: 'Logistics', icon: Truck },
    ]
  },
  {
    label: 'Sales & CRM',
    items: [
      { to: '/crm/contacts', label: 'Contacts', icon: UserCheck },
      { to: '/crm/leads', label: 'Pipeline', icon: TrendingUp },
    ]
  },
  {
    label: 'Manufacturing',
    items: [
      { to: '/mfg/bom', label: 'Bill of Materials', icon: ClipboardList },
      { to: '/mfg/production', label: 'Production', icon: Factory },
      { to: '/mfg/quality', label: 'Quality Control', icon: AlertTriangle },
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
    ]
  }
]

export default function Layout({ user, title, children }: Props) {
  const location = useLocation()
  const [showNotif, setShowNotif] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user.email?.slice(0, 2).toUpperCase() ?? 'U'

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Building2 size={20} />
          </div>
          <div>
            <div className="sidebar-logo-text">EnterpriseERP</div>
            <div className="sidebar-logo-sub">v2026</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map(group => (
            <div className="sidebar-section" key={group.label}>
              <div className="sidebar-section-label">{group.label}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={signOut} title="Sign out">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.email}</div>
              <div className="sidebar-user-role">Administrator</div>
            </div>
            <LogOut size={14} color="var(--gray-500)" />
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="header">
          <div className="header-title">{title}</div>
          <div className="header-actions">
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowNotif(!showNotif)}>
                <Bell size={18} />
              </button>
              {showNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">Notifications</div>
                  <div className="notif-list">
                    <div className="notif-item unread">
                      <div className="notif-item-title">Low Stock Alert</div>
                      <div className="notif-item-msg">3 products are below reorder point</div>
                      <div className="notif-item-time">Just now</div>
                    </div>
                    <div className="notif-item unread">
                      <div className="notif-item-title">Invoice Overdue</div>
                      <div className="notif-item-msg">INV-0042 is 5 days overdue</div>
                      <div className="notif-item-time">2 hours ago</div>
                    </div>
                    <div className="notif-item">
                      <div className="notif-item-title">Payroll Complete</div>
                      <div className="notif-item-msg">June payroll processed successfully</div>
                      <div className="notif-item-time">Yesterday</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
              <div className="sidebar-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials}</div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{user.email?.split('@')[0]}</span>
              <ChevronDown size={14} color="var(--gray-400)" />
            </div>
          </div>
        </header>

        <main className="page" key={location.pathname}>
          {children}
        </main>
      </div>
    </div>
  )
}
