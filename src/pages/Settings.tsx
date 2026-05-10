import { Building2, Shield, Bell, Database, Users } from 'lucide-react'

export default function Settings() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">System configuration and preferences</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {[
          { icon: Building2, title: 'Company Profile', desc: 'Company name, logo, address, and contact info.', color: 'var(--blue-100)', iconColor: 'var(--blue-600)' },
          { icon: Users, title: 'User Management', desc: 'Manage users, roles, and access permissions (RBAC).', color: 'var(--green-100)', iconColor: 'var(--green-600)' },
          { icon: Shield, title: 'Security', desc: 'Password policies, two-factor authentication, and audit settings.', color: 'var(--yellow-100)', iconColor: 'var(--yellow-600)' },
          { icon: Bell, title: 'Notifications', desc: 'Configure email alerts, workflow triggers, and notification preferences.', color: 'var(--orange-100)', iconColor: 'var(--orange-500)' },
          { icon: Database, title: 'Data & Integrations', desc: 'API keys, webhooks, third-party integrations, and data exports.', color: 'var(--teal-50)', iconColor: 'var(--teal-600)' },
        ].map(item => (
          <div className="card" key={item.title} style={{ cursor: 'pointer' }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 44, height: 44, background: item.color, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon size={20} color={item.iconColor} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header"><span className="card-title">System Information</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              ['ERP Version', 'v2026.1.0'],
              ['Database', 'Supabase PostgreSQL'],
              ['Frontend', 'React + TypeScript'],
              ['Deployment', 'Cloud (Vite)'],
              ['Last Updated', new Date().toLocaleDateString()],
              ['License', 'Enterprise'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 500, color: 'var(--gray-800)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
