import { useState } from 'react'
import { categoryFor, planCatalogUpdate } from '../../shared/catalog.js'
import AdminIcon from '../components/AdminIcon.jsx'
import useDraft from '../hooks/useDraft.js'

const asCatalog = (draft) => ({
  categories: draft.map((c) => ({ id: c.id, name: c.name.trim() })),
})

export default function CategoriesTab({ catalog, products, onSave, onDirtyChange }) {
  const { draft, setDraft, busy, error, setError, save } = useDraft(() => catalog.categories, { onDirtyChange })
  const [selected, setSelected] = useState(catalog.categories[0]?.id || '')
  const current = draft.find((c) => c.id === selected)
  const usage = (id) => products.filter((p) => categoryFor(p.data, catalog.categories)?.id === id).length

  const update = (change) => setDraft((prev) => prev.map((c) => (c.id === selected ? { ...c, ...change } : c)))

  const addCategory = () => {
    const id = `cat-${crypto.randomUUID()}`
    setDraft((prev) => [...prev, { id, name: '' }])
    setSelected(id)
    setError('')
  }
  const removeCategory = () => {
    if (usage(selected))
      return setError('Hãy chuyển các sản phẩm sang danh mục khác trước khi xóa danh mục này.')
    if (!window.confirm(`Xóa danh mục "${current.name || 'Chưa đặt tên'}"?`)) return
    const next = draft.filter((c) => c.id !== selected)
    setDraft(next)
    setSelected(next[0]?.id || '')
    setError('')
  }

  const submit = (event) => {
    event.preventDefault()
    setError('')
    let next
    try {
      next = asCatalog(draft)
      planCatalogUpdate(catalog, next, products)
    } catch (err) {
      return setError(err.message)
    }
    save(async () => {
      await onSave(next)
      return next.categories
    })
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="admin-fieldset">
        <div className="admin-section-heading">
          <div>
            <h2>Danh mục</h2>
            <p>Khách chọn danh mục trên trang Sản phẩm để xem nhanh các món cùng loại.</p>
          </div>
          <button type="button" className="ad-btn" onClick={addCategory}>
            <AdminIcon name="plus" />
            Thêm danh mục
          </button>
        </div>
        <div className="admin-category-layout">
          <aside className="admin-category-menu" aria-label="Danh mục đang quản lý">
            {draft.length ? (
              draft.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={selected === c.id ? 'active' : ''}
                  aria-pressed={selected === c.id}
                  onClick={() => setSelected(c.id)}
                >
                  <strong>{c.name || 'Danh mục mới'}</strong>
                  <small>{usage(c.id)} sản phẩm</small>
                </button>
              ))
            ) : (
              <p className="ad-hint">Chưa có danh mục.</p>
            )}
          </aside>
          {current ? (
            <div className="ad-card admin-category-editor">
              <div className="admin-editor-heading">
                <h3>Thiết lập danh mục</h3>
                <button
                  type="button"
                  className="ad-icon-btn"
                  aria-label="Xóa danh mục"
                  onClick={removeCategory}
                  disabled={usage(current.id) > 0}
                  title={usage(current.id) ? 'Chuyển sản phẩm sang danh mục khác trước khi xóa' : 'Xóa danh mục'}
                >
                  <AdminIcon name="trash" />
                </button>
              </div>
              <label className="ad-field">
                <span className="ad-label">Tên danh mục</span>
                <input
                  className="ad-input"
                  value={current.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Ví dụ: Đồ đóng gói"
                />
              </label>
              <p className="ad-hint">
                Đổi tên danh mục vẫn giữ các sản phẩm bên trong. Danh mục đang có sản phẩm cần được
                chuyển hết sản phẩm trước khi xóa.
              </p>
            </div>
          ) : (
            <div className="ad-empty">Bấm “Thêm danh mục” để bắt đầu.</div>
          )}
        </div>
        {error && (
          <p className="ad-error admin-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="admin-save-bar">
          <span className="ad-hint">Lưu để áp dụng toàn bộ thay đổi danh mục.</span>
          <button type="submit" className="ad-btn">
            {busy ? 'Đang lưu…' : 'Lưu danh mục'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}
