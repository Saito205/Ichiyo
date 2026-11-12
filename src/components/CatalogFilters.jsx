import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon.jsx'

// Thanh tìm kiếm + danh mục. Bộ lọc của danh mục nằm gọn trong một nút tròn (cài đặt),
// mỗi bộ lọc đang bật hiện thành một nút đỏ nhỏ bên dưới để tắt nhanh.
export default function CatalogFilters({
  query,
  onQuery,
  categories,
  categoryId,
  onCategory,
  attributes,
  onAttribute,
}) {
  const category = categories.find((c) => c.id === categoryId)
  const filters = category?.filters ?? []
  const hasFilters = filters.length > 0
  const applied = filters.filter((f) => attributes[f.id])

  // Lưu danh mục đang mở bảng lọc: đổi danh mục thì bảng tự đóng.
  const [openFor, setOpenFor] = useState(null)
  const open = hasFilters && openFor === categoryId
  const wrapRef = useRef(null)
  const toggleRef = useRef(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return undefined
    const close = () => setOpenFor(null)
    const handlePointerDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) close()
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        close()
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="catalog-filters">
      <div className="filter-top">
        <label className="search">
          <Icon name="search" />
          <input
            type="search"
            placeholder="Tìm tên sản phẩm…"
            aria-label="Tìm sản phẩm"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>

        <div className="category-picker">
          <label className="select-field">
            <span>Danh mục</span>
            <select value={categoryId} onChange={(e) => onCategory(e.target.value)}>
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {hasFilters && (
            <div className="filter-more" ref={wrapRef}>
              <button
                ref={toggleRef}
                type="button"
                className="filter-toggle"
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                aria-label={`Bộ lọc của ${category.name}${applied.length ? `, đang lọc ${applied.length}` : ''}`}
                title="Bộ lọc"
                onClick={() => setOpenFor(open ? null : categoryId)}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
                  <circle cx="15" cy="7" r="2" />
                  <circle cx="9" cy="17" r="2" />
                </svg>
                {applied.length > 0 && (
                  <span className="filter-toggle-count" aria-hidden="true">
                    {applied.length}
                  </span>
                )}
              </button>

              {open && (
                <div id={panelId} className="filter-popover" role="group" aria-label={`Bộ lọc của ${category.name}`}>
                  <p className="filter-popover-title">Lọc trong {category.name}</p>
                  {filters.map((f) => (
                    <label className="select-field" key={f.id}>
                      <span>{f.name}</span>
                      <select
                        value={attributes[f.id] || ''}
                        onChange={(e) => onAttribute(f.id, e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        {f.options.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <button type="button" className="btn filter-done" onClick={() => setOpenFor(null)}>
                    Xong
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {applied.length > 0 && (
        <ul className="active-filters" aria-label="Đang lọc theo">
          {applied.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                className="filter-chip"
                aria-label={`Bỏ lọc ${f.name}: ${attributes[f.id]}`}
                onClick={() => onAttribute(f.id, '')}
              >
                {f.name}: <strong>{attributes[f.id]}</strong>
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
