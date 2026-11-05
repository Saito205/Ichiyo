import { Suspense, lazy, useSyncExternalStore } from 'react'
import App from './App.jsx'
const Admin = lazy(() => import('./admin/Admin.jsx'))
const subscribe = (callback) => {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
const isAdminRoute = () => window.location.hash.startsWith('#/admin')
export default function Root() {
  const admin = useSyncExternalStore(subscribe, isAdminRoute)
  return admin ? (
    <Suspense fallback={<div className="ad-loading">Đang tải…</div>}>
      <Admin />
    </Suspense>
  ) : (
    <App />
  )
}
