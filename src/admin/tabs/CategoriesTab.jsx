import { useState } from 'react'
import { categoryFor, planCatalogUpdate } from '../../shared/catalog.js'
import AdminIcon from '../components/AdminIcon.jsx'
import useDraft from '../hooks/useDraft.js'

// Trong form, các lựa chọn của bộ lọc được sửa dưới dạng văn bản (mỗi dòng một giá trị).
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

function FilterEditor({ filter, index, onChange, onRemove }) {
  return (
    <section className="admin-filter-editor" aria-label={`Bộ lọc ${index + 1}`}>
      <div className="admin-editor-heading">
        <strong>Bộ lọc {index + 1}</strong>
        <button
          type="button"
          className="ad-icon-btn"
          aria-label={`Xóa bộ lọc ${filter.name || index + 1}`}
          onClick={onRemove}
        >
          <AdminIcon name="trash" />
        </button>
      </div>
      <label className="ad-field">
        <span className="ad-label">Tên bộ lọc</span>
        <input
          className="ad-input"
          value={filter.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ví dụ: Màu sắc"
        />
      </label>
      <label className="ad-field">
        <span className="ad-label">Các lựa chọn — mỗi dòng một giá trị</span>
        <textarea
          className="ad-input"
          rows={4}
          value={filter.optionsText}
          onChange={(e) => onChange({ optionsText: e.target.value })}
          placeholder={'Trắng\nHồng\nXanh'}
        />
      </label>
    </section>
  )
}

export default function CategoriesTab({ catalog, products, onSave, onDirtyChange }) {
  const { draft, setDraft, busy, error, setError, save } = useDraft(() => asDraft(catalog), { onDirtyChange })
  const [selected, setSelected] = useState(catalog.categories[0]?.id || '')
  const current = draft.find((c) => c.id === selected)
  const usage = (id) => products.filter((p) => categoryFor(p.data, catalog.categories)?.id === id).length

  const update = (change) => setDraft((prev) => prev.map((c) => (c.id === selected ? { ...c, ...change } : c)))
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
    if (!window.confirm(`Xóa danh mục "${current.name || 'Chưa đặt tên'}" và các bộ lọc của nó?`)) return
    const next = draft.filter((c) => c.id !== selected)
    setDraft(next)
    setSelected(next[0]?.id || '')
    setError('')
  }
  const addFilter = () =>
    update({ filters: [...current.filters, { id: `filter-${crypto.randomUUID()}`, name: '', optionsText: '' }] })
  const removeFilter = (filter) => {
    if (window.confirm(`Xóa bộ lọc "${filter.name || 'Chưa đặt tên'}"? Thay đổi có hiệu lực khi bạn lưu danh mục.`))
      update({ filters: current.filters.filter((f) => f.id !== filter.id) })
  }

  const submit = (event) => {
    event.preventDefault()
    setError('')
    let next
    try {
      next = asCatalog(draft)
      const plan = planCatalogUpdate(catalog, next, products)
      const message = `Thay đổi này sẽ bỏ ${plan.clearedValues} giá trị bộ lọc đang gán cho sản phẩm vì lựa chọn đã bị xóa hoặc đổi tên. Tiếp tục lưu?`
      if (plan.clearedValues && !window.confirm(message)) return
    } catch (err) {
      return setError(err.message)
    }
    save(async () => {
      await onSave(next)
      return asDraft(next)
    })
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
              <div className="admin-editor-heading">
                <h3>Bộ lọc của danh mục</h3>
                <button type="button" className="ad-btn ghost" onClick={addFilter}>
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
                <FilterEditor
                  key={f.id}
                  filter={f}
                  index={index}
                  onChange={(change) => updateFilter(f.id, change)}
                  onRemove={() => removeFilter(f)}
                />
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
