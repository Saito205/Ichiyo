import { Suspense, lazy } from 'react'
import StoreApp from './store/StoreApp.jsx'
import useHash from './shared/useHash.js'

// Trang quản trị chỉ được tải khi mở "#/admin" để khách không phải tải thêm code.
const Admin = lazy(() => import('./admin/Admin.jsx'))

export default function Root() {
  const isAdmin = useHash().startsWith('#/admin')
  return isAdmin ? (
    <Suspense fallback={<div className="ad-loading">Đang tải…</div>}>
      <Admin />
    </Suspense>
  ) : (
    <StoreApp />
  )
}
