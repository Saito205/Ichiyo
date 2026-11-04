import { useEffect, useRef, useState } from 'react'
import './admin.css'
import AdminIcon from './AdminIcon.jsx'
import ProductsTab from './ProductsTab.jsx'
import SettingsTab from './SettingsTab.jsx'
import { clearToken, getToken, login, setToken } from './auth.js'
import { REPO } from './config.js'
import * as gh from './github.js'
import { markUploaded, slugify, takeUploads } from './media.js'
import { site as publishedSite } from '../content.js'

const toJson = (o) => JSON.stringify(o, null, 2) + '\n'
const sortProducts = (list) =>
  [...list].sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0) || a.data.title.localeCompare(b.data.title))

function uniqueSlug(title, taken) {
  const base = slugify(title)
  let slug = base
  for (let n = 2; taken.includes(slug); n++) slug = `${base}-${n}`
  return slug
}

export default function Admin() {
  const [token, setTokenState] = useState(() => {
    const t = getToken()
    gh.setAuthToken(t)
    return t
  })
  const [loginError, setLoginError] = useState('')
  const [fatal, setFatal] = useState('')
  const [me, setMe] = useState(null)
  const [products, setProducts] = useState(null)
  const [site, setSite] = useState(null)
  const [tab, setTab] = useState('products')
  const [toast, setToast] = useState(null)
  const timer = useRef(0)

  useEffect(() => {
    document.title = 'Quản trị'
    return () => { document.title = publishedSite.name || 'Ichiyo' }
  }, [])

  const notify = (text, kind = 'ok', link = false) => {
    clearTimeout(timer.current)
    setToast({ text, kind, link })
    timer.current = setTimeout(() => setToast(null), 9000)
  }
  const saved = (what) => notify(`${what} Web sẽ cập nhật sau khoảng 1–2 phút.`, 'ok', true)

  const logout = () => {
    clearToken()
    gh.setAuthToken('')
    setTokenState(null)
    setMe(null)
    setProducts(null)
    setSite(null)
    setFatal('')
  }

  const fetchAll = async () => {
    const [repo, user, list, siteData] = await Promise.all([gh.getRepo(), gh.getUser(), gh.loadProducts(), gh.loadSite()])
    if (!repo.permissions?.push) throw new Error(`Tài khoản này không có quyền ghi vào ${REPO}.`)
    setMe(user)
    setProducts(sortProducts(list))
    setSite(siteData)
  }

  const handleLoadError = (e) => {
    if (e.status === 401) logout()
    else if (e.status === 404) setFatal(`Không truy cập được repo ${REPO}. Kiểm tra lại tên repo trong src/admin/config.js.`)
    else setFatal(e.message)
  }

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetchAll().catch((e) => { if (!cancelled) handleLoadError(e) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const reload = async () => {
    try {
      await fetchAll()
      notify('Đã tải lại dữ liệu.')
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  const doLogin = async () => {
    setLoginError('')
    try {
      const t = await login()
      setToken(t)
      gh.setAuthToken(t)
      setTokenState(t)
    } catch (e) {
      setLoginError(e.message)
    }
  }

  const saveProduct = async (slug, data) => {
    const key = slug ?? uniqueSlug(data.title, products.map((p) => p.slug))
    const uploads = takeUploads([data.cover, ...data.gallery].filter(Boolean))
    await gh.commitFiles(`${slug ? 'Cập nhật' : 'Thêm'} sản phẩm: ${data.title}`, [
      ...uploads.map((u) => ({ path: `public${u.path}`, blob: u.blob })),
      { path: `content/products/${key}.json`, text: toJson(data) },
    ])
    markUploaded(uploads.map((u) => u.path))
    setProducts((prev) => sortProducts([...prev.filter((p) => p.slug !== key), { slug: key, data }]))
    saved('Đã lưu sản phẩm.')
  }

  const deleteProduct = async (slug) => {
    const item = products.find((p) => p.slug === slug)
    await gh.commitFiles(`Xóa sản phẩm: ${item?.data.title ?? slug}`, [{ path: `content/products/${slug}.json`, remove: true }])
    setProducts((prev) => prev.filter((p) => p.slug !== slug))
    saved('Đã xóa sản phẩm.')
  }

  const saveSite = async (values) => {
    const merged = { ...site, ...values, contact: { ...site.contact, ...values.contact } }
    const uploads = takeUploads([merged.logo, merged.heroImage].filter(Boolean))
    await gh.commitFiles('Cập nhật cài đặt website', [
      ...uploads.map((u) => ({ path: `public${u.path}`, blob: u.blob })),
      { path: 'content/site.json', text: toJson(merged) },
    ])
    markUploaded(uploads.map((u) => u.path))
    setSite(merged)
    saved('Đã lưu cài đặt.')
  }

  if (!token) {
    return (
      <div className="ad-login">
        <div className="ad-card ad-login-card">
          <span className="ad-mark" aria-hidden="true">一</span>
          <h1>Quản trị nội dung</h1>
          <p>Đăng nhập bằng tài khoản GitHub có quyền ghi vào kho mã của website.</p>
          <button type="button" className="ad-btn" onClick={doLogin}>Đăng nhập bằng GitHub</button>
          {loginError && <p className="ad-error" role="alert">{loginError}</p>}
          <a href="#" className="ad-link">Về trang chủ</a>
        </div>
      </div>
    )
  }

  const ready = products && site

  return (
    <div className="ad-shell">
      <header className="ad-top">
        <div className="ad-brand"><span className="ad-mark" aria-hidden="true">一</span> Quản trị</div>
        <nav className="ad-tabs" aria-label="Mục quản trị">
          <button type="button" className={tab === 'products' ? 'on' : ''} aria-current={tab === 'products'} onClick={() => setTab('products')}>Sản phẩm</button>
          <button type="button" className={tab === 'settings' ? 'on' : ''} aria-current={tab === 'settings'} onClick={() => setTab('settings')}>Cài đặt</button>
        </nav>
        <div className="ad-user">
          <a href="#" className="ad-link">Xem trang <AdminIcon name="external" size={15} /></a>
          {me && <img src={me.avatar_url} alt={me.login} title={me.login} />}
          <button type="button" className="ad-icon-btn" aria-label="Đăng xuất" title="Đăng xuất" onClick={logout}><AdminIcon name="logout" /></button>
        </div>
      </header>

      <main className="ad-main">
        {fatal ? (
          <p className="ad-empty ad-error-box" role="alert">{fatal}</p>
        ) : !ready ? (
          <p className="ad-empty">Đang tải dữ liệu…</p>
        ) : tab === 'products' ? (
          <ProductsTab products={products} onSave={saveProduct} onDelete={deleteProduct} onReload={reload} />
        ) : (
          <SettingsTab site={site} onSave={saveSite} onError={(m) => notify(m, 'error')} />
        )}
      </main>

      {toast && (
        <div className={`ad-toast ${toast.kind}`} role="status">
          {toast.text}
          {toast.link && <a href={`https://github.com/${REPO}/actions`} target="_blank" rel="noreferrer">Xem tiến trình</a>}
        </div>
      )}
    </div>
  )
}
