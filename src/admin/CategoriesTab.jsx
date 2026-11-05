import { useState } from 'react'
import AdminIcon from './AdminIcon.jsx'
import { categoryFor, planCatalogUpdate } from '../lib/catalog.js'
import useUnsavedChanges from './useUnsavedChanges.js'

const asDraft = (catalog) =>
  catalog.categories.map((c) => ({
    ...c,
    filters: c.filters.map((f) => ({ ...f, optionsText: f.options.join('\n') })),
  }))
const asCatalog = (draft) => ({
  categories: draft.map((c) => ({
    id: c.id,
    name: c.name.trim(),
    filters: c.filters.map((f) => ({
      id: f.id,
      name: f.name.trim(),
      options: f.optionsText
        .split('\n')
        .map((o) => o.trim())
        .filter(Boolean),
    })),
  })),
})

export default function CategoriesTab({ catalog, products, onSave, onDirtyChange }) {
  const [draft, setDraft] = useState(() => asDraft(catalog))
  const [baseline, setBaseline] = useState(() => JSON.stringify(asDraft(catalog)))
  const [selected, setSelected] = useState(catalog.categories[0]?.id || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useUnsavedChanges(JSON.stringify(draft) !== baseline, onDirtyChange)
  const current = draft.find((c) => c.id === selected)
  const usage = (id) =>
    products.filter((p) => categoryFor(p.data, catalog.categories)?.id === id).length
  const update = (change) =>
    setDraft((prev) => prev.map((c) => (c.id === selected ? { ...c, ...change } : c)))
  const updateFilter = (id, change) =>
    update({ filters: current.filters.map((f) => (f.id === id ? { ...f, ...change } : f)) })
  const addCategory = () => {
    const id = `cat-${crypto.randomUUID()}`
    setDraft((prev) => [...prev, { id, name: '', filters: [] }])
    setSelected(id)
    setError('')
  }
  const removeCategory = () => {
    if (usage(selected))
      return setError('Hãy chuyển các sản phẩm sang danh mục khác trước khi xóa danh mục này.')
    if (!window.confirm(`Xóa danh mục "${current.name || 'Chưa đặt tên'}" và các bộ lọc của nó?`))
      return
    const next = draft.filter((c) => c.id !== selected)
    setDraft(next)
    setSelected(next[0]?.id || '')
    setError('')
  }
  const removeFilter = (filter) => {
    if (
      !window.confirm(
        `Xóa bộ lọc "${filter.name || 'Chưa đặt tên'}"? Thay đổi có hiệu lực khi bạn lưu danh mục.`,
      )
    )
      return
    update({ filters: current.filters.filter((f) => f.id !== filter.id) })
  }
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const next = asCatalog(draft)
      const plan = planCatalogUpdate(catalog, next, products)
      if (
        plan.clearedValues &&
        !window.confirm(
          `Thay đổi này sẽ bỏ ${plan.clearedValues} giá trị bộ lọc đang gán cho sản phẩm vì lựa chọn đã bị xóa hoặc đổi tên. Tiếp tục lưu?`,
        )
      )
        return
      setBusy(true)
      await onSave(next)
      const clean = asDraft(next)
      setDraft(clean)
      setBaseline(JSON.stringify(clean))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="admin-fieldset">
        <div className="admin-section-heading">
          <div>
            <h2>Danh mục & bộ lọc</h2>
            <p>Tạo danh mục, sau đó thêm các lựa chọn để khách dễ tìm sản phẩm.</p>
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
                  <small>
                    {usage(c.id)} sản phẩm · {c.filters.length} bộ lọc
                  </small>
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
                  title={
                    usage(current.id)
                      ? 'Chuyển sản phẩm sang danh mục khác trước khi xóa'
                      : 'Xóa danh mục'
                  }
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
              <div className="admin-editor-heading">
                <h3>Bộ lọc của danh mục</h3>
                <button
                  type="button"
                  className="ad-btn ghost"
                  onClick={() =>
                    update({
                      filters: [
                        ...current.filters,
                        { id: `filter-${crypto.randomUUID()}`, name: '', optionsText: '' },
                      ],
                    })
                  }
                >
                  <AdminIcon name="plus" />
                  Thêm bộ lọc
                </button>
              </div>
              {!current.filters.length && (
                <p className="admin-soft-note">
                  Ví dụ: bộ lọc “Màu sắc” có các lựa chọn Trắng, Hồng; bộ lọc “Kích thước” có các
                  lựa chọn A5, A6.
                </p>
              )}
              {current.filters.map((f, index) => (
                <section
                  className="admin-filter-editor"
                  key={f.id}
                  aria-label={`Bộ lọc ${index + 1}`}
                >
                  <div className="admin-editor-heading">
                    <strong>Bộ lọc {index + 1}</strong>
                    <button
                      type="button"
                      className="ad-icon-btn"
                      aria-label={`Xóa bộ lọc ${f.name || index + 1}`}
                      onClick={() => removeFilter(f)}
                    >
                      <AdminIcon name="trash" />
                    </button>
                  </div>
                  <label className="ad-field">
                    <span className="ad-label">Tên bộ lọc</span>
                    <input
                      className="ad-input"
                      value={f.name}
                      onChange={(e) => updateFilter(f.id, { name: e.target.value })}
                      placeholder="Ví dụ: Màu sắc"
                    />
                  </label>
                  <label className="ad-field">
                    <span className="ad-label">Các lựa chọn — mỗi dòng một giá trị</span>
                    <textarea
                      className="ad-input"
                      rows={4}
                      value={f.optionsText}
                      onChange={(e) => updateFilter(f.id, { optionsText: e.target.value })}
                      placeholder={'Trắng\nHồng\nXanh'}
                    />
                  </label>
                </section>
              ))}
              {current.filters.length > 0 && (
                <p className="ad-hint">
                  Sau khi lưu, mở Sản phẩm để gán các lựa chọn. Nếu đổi hoặc xóa một lựa chọn đang
                  dùng, bạn sẽ được hỏi trước khi bỏ giá trị đó khỏi sản phẩm.
                </p>
              )}
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
          <span className="ad-hint">Lưu để áp dụng toàn bộ thay đổi danh mục và bộ lọc.</span>
          <button type="submit" className="ad-btn">
            {busy ? 'Đang lưu…' : 'Lưu danh mục & bộ lọc'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}
