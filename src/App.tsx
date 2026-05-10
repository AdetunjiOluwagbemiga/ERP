import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import GeneralLedger from './pages/finance/GeneralLedger'
import AccountsPayable from './pages/finance/AccountsPayable'
import AccountsReceivable from './pages/finance/AccountsReceivable'
import FixedAssets from './pages/finance/FixedAssets'
import Banking from './pages/finance/Banking'
import Employees from './pages/hr/Employees'
import Payroll from './pages/hr/Payroll'
import TimeAttendance from './pages/hr/TimeAttendance'
import LeaveManagement from './pages/hr/LeaveManagement'
import Recruitment from './pages/hr/Recruitment'
import Inventory from './pages/supply/Inventory'
import Purchasing from './pages/supply/Purchasing'
import CustomerOrders from './pages/supply/CustomerOrders'
import Logistics from './pages/supply/Logistics'
import Contacts from './pages/crm/Contacts'
import Pipeline from './pages/crm/Pipeline'
import BillOfMaterials from './pages/manufacturing/BillOfMaterials'
import Production from './pages/manufacturing/Production'
import QualityControl from './pages/manufacturing/QualityControl'
import Settings from './pages/Settings'

const titleMap: Record<string, string> = {
  '/': 'Dashboard',
  '/finance/gl': 'General Ledger',
  '/finance/ap': 'Accounts Payable',
  '/finance/ar': 'Accounts Receivable',
  '/finance/assets': 'Fixed Assets',
  '/finance/bank': 'Cash & Banking',
  '/hr/employees': 'Employees',
  '/hr/payroll': 'Payroll',
  '/hr/time': 'Time & Attendance',
  '/hr/leave': 'Leave Management',
  '/hr/recruitment': 'Recruitment',
  '/supply/inventory': 'Inventory',
  '/supply/purchasing': 'Purchasing',
  '/supply/orders': 'Customer Orders',
  '/supply/logistics': 'Logistics',
  '/crm/contacts': 'Contacts',
  '/crm/leads': 'Sales Pipeline',
  '/mfg/bom': 'Bill of Materials',
  '/mfg/production': 'Production',
  '/mfg/quality': 'Quality Control',
  '/settings': 'Settings',
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <Routes>
      {Object.entries(titleMap).map(([path, title]) => (
        <Route
          key={path}
          path={path}
          element={
            <Layout user={user} title={title}>
              {path === '/' && <Dashboard />}
              {path === '/finance/gl' && <GeneralLedger />}
              {path === '/finance/ap' && <AccountsPayable />}
              {path === '/finance/ar' && <AccountsReceivable />}
              {path === '/finance/assets' && <FixedAssets />}
              {path === '/finance/bank' && <Banking />}
              {path === '/hr/employees' && <Employees />}
              {path === '/hr/payroll' && <Payroll />}
              {path === '/hr/time' && <TimeAttendance />}
              {path === '/hr/leave' && <LeaveManagement />}
              {path === '/hr/recruitment' && <Recruitment />}
              {path === '/supply/inventory' && <Inventory />}
              {path === '/supply/purchasing' && <Purchasing />}
              {path === '/supply/orders' && <CustomerOrders />}
              {path === '/supply/logistics' && <Logistics />}
              {path === '/crm/contacts' && <Contacts />}
              {path === '/crm/leads' && <Pipeline />}
              {path === '/mfg/bom' && <BillOfMaterials />}
              {path === '/mfg/production' && <Production />}
              {path === '/mfg/quality' && <QualityControl />}
              {path === '/settings' && <Settings />}
            </Layout>
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
