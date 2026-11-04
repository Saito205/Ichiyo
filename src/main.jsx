import { StrictMode, Suspense, lazy, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Trang quản trị chỉ tải khi mở /#/admin, nên trang khách vẫn nhẹ.
const Admin = lazy(() => import('./admin/Admin.jsx'))

const subscribe = (callback) => {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
const isAdminRoute = () => window.location.hash.startsWith('#/admin')

function Root() {
  const admin = useSyncExternalStore(subscribe, isAdminRoute)
  if (!admin) return <App />
  return (
    <Suspense fallback={<div className="ad-loading">Đang tải…</div>}>
      <Admin />
    </Suspense>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
