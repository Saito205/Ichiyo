import { useRef, useState } from 'react'
import { products, categories } from '../content.js'
import { filterProducts, paginate, PAGE_SIZE } from '../lib/catalog.js'
import ProductCard from '../components/ProductCard.jsx'
import Icon from '../components/Icon.jsx'
export default function Products({ onOpen }) {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [attributes, setAttributes] = useState({})
  const [page, setPage] = useState(1)
  const results = useRef(null)
  const category = categories.find((c) => c.id === categoryId)
  const filtered = filterProducts(products, { query, categoryId, attributes }, categories)
  const paged = paginate(filtered, page)
  const active = query || categoryId || Object.values(attributes).some(Boolean)
  const reset = () => {
    setQuery('')
    setCategoryId('')
    setAttributes({})
    setPage(1)
  }
  const goTo = (n) => {
    setPage(n)
    results.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    results.current?.focus({ preventScroll: true })
  }
  return (
    <section className="wrap products-page">
      <div className="page-heading">
        <span className="eyebrow">Tìm món bạn thích</span>
        <h1>Tất cả sản phẩm</h1>
        <p className="page-intro">Những món đồ nhỏ, dành cho những điều bạn nâng niu.</p>
      </div>
      <div className="catalog-filters">
        <div className="filter-top">
          <label className="search">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Tìm tên sản phẩm…"
              aria-label="Tìm sản phẩm"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          </label>
          <label className="select-field">
            <span>Danh mục</span>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                setAttributes({})
                setPage(1)
              }}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {category?.filters.length > 0 && (
          <div className="category-filters" role="group" aria-label={`Bộ lọc của ${category.name}`}>
            {category.filters.map((f) => (
              <label className="select-field" key={f.id}>
                <span>{f.name}</span>
                <select
                  value={attributes[f.id] || ''}
                  onChange={(e) => {
                    setAttributes((prev) => ({ ...prev, [f.id]: e.target.value }))
                    setPage(1)
                  }}
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
          </div>
        )}
      </div>
      <div className="results-heading" ref={results} tabIndex={-1}>
        <p className="count" role="status">
          {filtered.length
            ? `${(paged.current - 1) * PAGE_SIZE + 1}–${Math.min(paged.current * PAGE_SIZE, filtered.length)} / ${filtered.length} sản phẩm`
            : '0 sản phẩm'}
        </p>
        {active && (
          <button type="button" className="reset-filters" onClick={reset}>
            <Icon name="close" size={16} />
            Xóa bộ lọc
          </button>
        )}
      </div>
      {paged.items.length ? (
        <div className="grid product-grid">
          {paged.items.map((p) => (
            <ProductCard key={p.slug} product={p} onOpen={() => onOpen(p)} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>Chưa tìm thấy sản phẩm</h2>
          <p>
            {products.length
              ? 'Thử từ khóa khác hoặc bỏ bớt bộ lọc nhé.'
              : 'Tiệm đang chuẩn bị những sản phẩm mới.'}
          </p>
          {active && (
            <button type="button" className="btn" onClick={reset}>
              Xem tất cả sản phẩm
            </button>
          )}
        </div>
      )}
      {paged.pageCount > 1 && (
        <nav className="pagination" aria-label="Phân trang sản phẩm">
          <button
            type="button"
            disabled={paged.current === 1}
            onClick={() => goTo(paged.current - 1)}
            aria-label="Trang trước"
          >
            <Icon name="left" size={18} />
          </button>
          {Array.from({ length: paged.pageCount }, (_, i) => i + 1).map((n) => (
            <button
              type="button"
              key={n}
              className={n === paged.current ? 'current' : ''}
              aria-current={n === paged.current ? 'page' : undefined}
              aria-label={`Trang ${n}`}
              onClick={() => goTo(n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={paged.current === paged.pageCount}
            onClick={() => goTo(paged.current + 1)}
            aria-label="Trang sau"
          >
            <Icon name="right" size={18} />
          </button>
        </nav>
      )}
    </section>
  )
}
