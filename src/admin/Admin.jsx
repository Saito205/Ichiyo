import { useEffect, useRef, useState } from 'react'
import './admin.css'
import AdminIcon from './AdminIcon.jsx'
import ProductsTab from './ProductsTab.jsx'
import CategoriesTab from './CategoriesTab.jsx'
import GuideTab from './GuideTab.jsx'
import SettingsTab from './SettingsTab.jsx'
import { clearToken, getToken, login, setToken } from './auth.js'
import { REPO } from './config.js'
import * as gh from './github.js'
import { markUploaded, slugify, takeUploads } from './media.js'
import { normalizeCatalog, planCatalogUpdate } from '../lib/catalog.js'
import { normalizeGuide } from '../lib/guide.js'
import { site as publishedSite } from '../content.js'
const toJson = (o) => JSON.stringify(o, null, 2) + '\n'
const sortProducts = (list) =>
  [...list].sort(
    (a, b) => (a.data.order ?? 0) - (b.data.order ?? 0) || a.data.title.localeCompare(b.data.title),
  )
function uniqueSlug(title, taken) {
  const base = slugify(title)
  let slug = base
  for (let n = 2; taken.includes(slug); n++) slug = `${base}-${n}`
  return slug
}
async function loadData() {
  const [repo, me, list, site, rawCatalog, rawGuide] = await Promise.all([
    gh.getRepo(),
    gh.getUser(),
    gh.loadProducts(),
    gh.loadSite(),
    gh.loadCatalog(),
    gh.loadGuide(),
  ])
  if (!repo.permissions?.push) throw new Error(`Tài khoản này không có quyền ghi vào ${REPO}.`)
  return {
    me,
    products: sortProducts(list),
    site,
    catalog: normalizeCatalog(rawCatalog, list),
    guide: normalizeGuide(rawGuide),
  }
}
const tabs = [
  ['products', 'Sản phẩm'],
  ['categories', 'Danh mục & bộ lọc'],
  ['guide', 'Hướng dẫn'],
  ['settings', 'Cài đặt'],
]
export default function Admin() {
  const [token, setTokenState] = useState(getToken)
  const [loginError, setLoginError] = useState('')
  const [fatal, setFatal] = useState('')
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('products')
  const [toast, setToast] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [revision, setRevision] = useState(0)
  const timer = useRef(0)
  useEffect(() => {
    document.title = 'Quản trị'
    return () => {
      document.title = publishedSite.name || 'Ichiyo'
      clearTimeout(timer.current)
    }
  }, [])
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
  const notify = (text, kind = 'ok') => {
    clearTimeout(timer.current)
    setToast({ text, kind })
    timer.current = setTimeout(() => setToast(null), 9000)
  }
  const saved = (what) =>
    notify(`${what} Website sẽ cập nhật sau khi quá trình triển khai hoàn tất.`)
  const canLeave = () =>
    !saving && (!dirty || window.confirm('Bạn có thay đổi chưa lưu. Bỏ thay đổi và tiếp tục?'))
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
      const snapshot = await loadData()
      setData(snapshot)
      setRevision((r) => r + 1)
      setFatal('')
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
      setFatal('')
      setTokenState(t)
    } catch (e) {
      setLoginError(e.message)
    }
  }
  const write = async (action) => {
    if (saving) throw new Error('Đang lưu thay đổi khác. Vui lòng đợi một chút.')
    setSaving(true)
    try {
      await action()
    } finally {
      setSaving(false)
    }
  }
  const saveProduct = (slug, values) =>
    write(async () => {
      const existing = data.products.find((p) => p.slug === slug)
      const key =
        slug ??
        uniqueSlug(
          values.title,
          data.products.map((p) => p.slug),
        )
      const product = {
        ...existing?.data,
        ...values,
        createdAt: slug === null ? new Date().toISOString() : existing?.data.createdAt || '',
        updatedAt: new Date().toISOString(),
      }
      const uploads = takeUploads([product.cover, ...(product.gallery || [])].filter(Boolean))
      await gh.commitFiles(`${slug ? 'Cập nhật' : 'Thêm'} sản phẩm: ${product.title}`, [
        ...uploads.map((u) => ({ path: `public${u.path}`, blob: u.blob })),
        { path: `content/products/${key}.json`, text: toJson(product) },
      ])
      markUploaded(uploads.map((u) => u.path))
      setData((prev) => ({
        ...prev,
        products: sortProducts([
          ...prev.products.filter((p) => p.slug !== key),
          { slug: key, data: product },
        ]),
      }))
      saved('Đã lưu sản phẩm.')
    })
  const deleteProduct = (slug) =>
    write(async () => {
      const item = data.products.find((p) => p.slug === slug)
      await gh.commitFiles(`Xóa sản phẩm: ${item?.data.title ?? slug}`, [
        { path: `content/products/${slug}.json`, remove: true },
      ])
      setData((prev) => ({ ...prev, products: prev.products.filter((p) => p.slug !== slug) }))
      saved('Đã xóa sản phẩm.')
    })
  const saveSite = (values) =>
    write(async () => {
      const merged = {
        ...data.site,
        ...values,
        contact: { ...data.site.contact, ...values.contact },
      }
      const uploads = takeUploads([merged.logo, merged.heroImage].filter(Boolean))
      await gh.commitFiles('Cập nhật cài đặt website', [
        ...uploads.map((u) => ({ path: `public${u.path}`, blob: u.blob })),
        { path: 'content/site.json', text: toJson(merged) },
      ])
      markUploaded(uploads.map((u) => u.path))
      setData((prev) => ({ ...prev, site: merged }))
      saved('Đã lưu cài đặt.')
    })
  const saveCatalog = (next) =>
    write(async () => {
      const { changedProducts } = planCatalogUpdate(data.catalog, next, data.products)
      await gh.commitFiles('Cập nhật danh mục và bộ lọc', [
        { path: 'content/catalog.json', text: toJson(next) },
        ...changedProducts.map((p) => ({
          path: `content/products/${p.slug}.json`,
          text: toJson(p.data),
        })),
      ])
      const updates = new Map(changedProducts.map((p) => [p.slug, p]))
      setData((prev) => ({
        ...prev,
        catalog: next,
        products: prev.products.map((p) => updates.get(p.slug) || p),
      }))
      saved('Đã lưu danh mục và bộ lọc.')
    })
  const saveGuide = (next) =>
    write(async () => {
      await gh.commitFiles('Cập nhật hướng dẫn mua hàng', [
        { path: 'content/guide.json', text: toJson(next) },
      ])
      setData((prev) => ({ ...prev, guide: next }))
      saved('Đã lưu hướng dẫn.')
    })
  if (!token)
    return (
      <div className="ad-login">
        <div className="ad-card ad-login-card">
          <span className="ad-mark" aria-hidden="true">
            一
          </span>
          <h1>Quản trị nội dung</h1>
          <p>Đăng nhập bằng tài khoản GitHub có quyền ghi vào kho mã của website.</p>
          <button type="button" className="ad-btn" onClick={doLogin}>
            Đăng nhập bằng GitHub
          </button>
          {loginError && (
            <p className="ad-error" role="alert">
              {loginError}
            </p>
          )}
          <a href="#/" className="ad-link">
            Về trang chủ
          </a>
        </div>
      </div>
    )
  return (
    <div className="ad-shell">
      <header className="ad-top">
        <div className="ad-brand">
          <span className="ad-mark" aria-hidden="true">
            一
          </span>{' '}
          Quản trị
        </div>
        <nav className="ad-tabs" aria-label="Mục quản trị">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              disabled={saving}
              className={tab === id ? 'on' : ''}
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => {
                if (id !== tab && canLeave()) {
                  setDirty(false)
                  setTab(id)
                }
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="ad-user">
          <a
            href="#/"
            className="ad-link"
            onClick={(e) => {
              if (!canLeave()) e.preventDefault()
            }}
          >
            Xem trang <AdminIcon name="external" size={15} />
          </a>
          {data?.me && <img src={data.me.avatar_url} alt={data.me.login} title={data.me.login} />}
          <button
            type="button"
            className="ad-icon-btn"
            disabled={saving}
            aria-label="Đăng xuất"
            title="Đăng xuất"
            onClick={logout}
          >
            <AdminIcon name="logout" />
          </button>
        </div>
      </header>
      <main className="ad-main">
        {fatal ? (
          <div className="ad-empty ad-error-box" role="alert">
            <p>{fatal}</p>
            <button type="button" className="ad-btn" onClick={reload}>
              Thử tải lại
            </button>
          </div>
        ) : !data ? (
          <p className="ad-empty">Đang tải dữ liệu…</p>
        ) : tab === 'products' ? (
          <ProductsTab
            key={revision}
            products={data.products}
            categories={data.catalog.categories}
            onSave={saveProduct}
            onDelete={deleteProduct}
            onReload={reload}
          />
        ) : tab === 'categories' ? (
          <CategoriesTab
            key={revision}
            catalog={data.catalog}
            products={data.products}
            onSave={saveCatalog}
            onDirtyChange={setDirty}
          />
        ) : tab === 'guide' ? (
          <GuideTab key={revision} guide={data.guide} onSave={saveGuide} onDirtyChange={setDirty} />
        ) : (
          <SettingsTab
            key={revision}
            site={data.site}
            onSave={saveSite}
            onError={(m) => notify(m, 'error')}
            onDirtyChange={setDirty}
          />
        )}
      </main>
      {toast && (
        <div className={`ad-toast ${toast.kind}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  )
}
