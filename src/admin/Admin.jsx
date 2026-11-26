import { useEffect, useRef, useState } from 'react'
import { site as publishedSite } from '../shared/content.js'
import AdminTopBar from './AdminTopBar.jsx'
import LoginScreen from './LoginScreen.jsx'
import { clearToken, getToken, login, setToken } from './api/auth.js'
import * as gh from './api/github.js'
import './styles/index.css'
import CategoriesTab from './tabs/CategoriesTab.jsx'
import CurrencyTab from './tabs/CurrencyTab.jsx'
import GuideTab from './tabs/GuideTab.jsx'
import OverviewTab from './tabs/OverviewTab.jsx'
import ProductsTab from './tabs/ProductsTab.jsx'
import SettingsTab from './tabs/SettingsTab.jsx'
import { loadData, useAdminActions } from './useAdminData.js'

// heading: tiêu đề lớn phía trên tab (Danh mục, Hướng dẫn, Tiền tệ đã có tiêu đề riêng bên trong).
const tabs = [
  { id: 'overview', label: 'Tổng quan', icon: 'home', heading: ['Tổng quan', 'Số liệu nhanh về cửa hàng của bạn.'] },
  { id: 'products', label: 'Sản phẩm', icon: 'box', heading: ['Sản phẩm', 'Thêm, chỉnh sửa và quản lý toàn bộ sản phẩm.'] },
  { id: 'categories', label: 'Danh mục & bộ lọc', icon: 'tag' },
  { id: 'guide', label: 'Hướng dẫn', icon: 'book' },
  { id: 'currency', label: 'Tiền tệ', icon: 'currency' },
  { id: 'settings', label: 'Cài đặt', icon: 'sliders', heading: ['Cài đặt', 'Thông tin chung và liên hệ hiển thị trên website.'] },
]

function Skeletons() {
  return (
    <div className="ad-skeletons" role="status" aria-label="Đang tải dữ liệu">
      <div className="ad-skeleton wide" />
      <div className="ad-skeleton" />
      <div className="ad-skeleton" />
      <div className="ad-skeleton" />
    </div>
  )
}

export default function Admin() {
  const [token, setTokenState] = useState(getToken)
  const [loginError, setLoginError] = useState('')
  const [fatal, setFatal] = useState('')
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('overview')
  const [toast, setToast] = useState(null)
  const [dirty, setDirty] = useState(false) // tab hiện tại có thay đổi chưa lưu
  const [revision, setRevision] = useState(0) // tăng khi tải lại => các tab tạo lại form
  const timer = useRef(0)

  const notify = (text, kind = 'ok') => {
    clearTimeout(timer.current)
    setToast({ text, kind })
    timer.current = setTimeout(() => setToast(null), 9000)
  }
  const actions = useAdminActions(data, setData, (message) =>
    notify(`${message} Website sẽ cập nhật sau khi quá trình triển khai hoàn tất.`),
  )
  const { saving } = actions

  useEffect(() => {
    document.title = 'Quản trị'
    return () => {
      document.title = publishedSite.name || 'Ichiyo'
      clearTimeout(timer.current)
    }
  }, [])

  // Có token thì tải dữ liệu; token hết hạn (401) thì quay về màn hình đăng nhập.
  useEffect(() => {
    gh.setAuthToken(token)
    if (!token) return
    let cancelled = false
    loadData()
      .then((snapshot) => {
        if (!cancelled) setData(snapshot)
      })
      .catch((e) => {
        if (cancelled) return
        if (e.status === 401) {
          clearToken()
          gh.setAuthToken('')
          setTokenState(null)
        } else setFatal(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const canLeave = () =>
    !saving && (!dirty || window.confirm('Bạn có thay đổi chưa lưu. Bỏ thay đổi và tiếp tục?'))
  const goToTab = (id) => {
    if (id !== tab && canLeave()) {
      setDirty(false)
      setTab(id)
    }
  }
  const doLogin = async () => {
    setLoginError('')
    try {
      const t = await login()
      setToken(t)
      gh.setAuthToken(t)
      setFatal('')
      setTokenState(t)
    } catch (e) {
      setLoginError(e.message)
    }
  }
  const logout = () => {
    if (!canLeave()) return
    clearToken()
    gh.setAuthToken('')
    setTokenState(null)
    setData(null)
    setFatal('')
    setDirty(false)
  }
  const reload = async () => {
    if (!canLeave()) return
    try {
      setData(await loadData())
      setRevision((r) => r + 1)
      setFatal('')
      notify('Đã tải lại dữ liệu.')
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  if (!token) return <LoginScreen onLogin={doLogin} error={loginError} />

  const heading = tabs.find((t) => t.id === tab).heading
  const renderTab = () => {
    const common = { onDirtyChange: setDirty }
    switch (tab) {
      case 'overview':
        return <OverviewTab products={data.products} categories={data.catalog.categories} onGo={goToTab} />
      case 'products':
        return (
          <ProductsTab
            key={revision}
            products={data.products}
            categories={data.catalog.categories}
            onSave={actions.saveProduct}
            onDelete={actions.deleteProduct}
            onReload={reload}
          />
        )
      case 'categories':
        return <CategoriesTab key={revision} {...common} catalog={data.catalog} products={data.products} onSave={actions.saveCatalog} />
      case 'guide':
        return <GuideTab key={revision} {...common} guide={data.guide} onSave={actions.saveGuide} />
      case 'currency':
        return <CurrencyTab key={revision} {...common} config={data.currency} onSave={actions.saveCurrency} />
      default:
        return (
          <SettingsTab key={revision} {...common} site={data.site} onSave={actions.saveSite} onError={(m) => notify(m, 'error')} />
        )
    }
  }

  return (
    <div className="ad-shell">
      <AdminTopBar
        tabs={tabs}
        tab={tab}
        onTab={goToTab}
        user={data?.me}
        saving={saving}
        canLeave={canLeave}
        onLogout={logout}
      />
      <main className="ad-main">
        <div key={tab} className="ad-page">
          {data && heading && (
            <div className="ad-heading">
              <h1>{heading[0]}</h1>
              <p>
                {tab === 'overview' && data.me
                  ? `Xin chào ${data.me.login}, đây là tình hình cửa hàng của bạn.`
                  : heading[1]}
              </p>
            </div>
          )}
          {fatal ? (
            <div className="ad-empty ad-error-box" role="alert">
              <p>{fatal}</p>
              <button type="button" className="ad-btn" onClick={reload}>
                Thử tải lại
              </button>
            </div>
          ) : !data ? (
            <Skeletons />
          ) : (
            renderTab()
          )}
        </div>
      </main>
      {toast && (
        <div className={`ad-toast ${toast.kind}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  )
}
