import { useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import ProductCard from '../components/ProductCard.jsx'
import CatalogFilters from '../components/CatalogFilters.jsx'
import { products, categories } from '../content.js'
import { filterProducts, paginate, PAGE_SIZE } from '../lib/catalog.js'

// Dãy số trang: luôn có trang đầu, trang cuối và 1 trang quanh trang hiện tại.
function pageNumbers(current, total) {
  const keep = new Set([1, total, current - 1, current, current + 1])
  const list = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  return list.flatMap((n, i) => (i > 0 && n - list[i - 1] > 1 ? ['…', n] : [n]))
}

export default function Products({ onOpen }) {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [attributes, setAttributes] = useState({})
  const [page, setPage] = useState(1)
  const results = useRef(null)
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
      <CatalogFilters
        query={query}
        onQuery={(value) => {
          setQuery(value)
          setPage(1)
        }}
        categories={categories}
        categoryId={categoryId}
        onCategory={(id) => {
          setCategoryId(id)
          setAttributes({})
          setPage(1)
        }}
        attributes={attributes}
        onAttribute={(id, value) => {
          setAttributes((prev) => ({ ...prev, [id]: value }))
          setPage(1)
        }}
      />
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
          <p>Thử từ khóa khác hoặc bỏ bớt bộ lọc nhé.</p>
        </div>
      )}
      {paged.pageCount > 1 && (
        <nav className="pagination" aria-label="Phân trang">
          <button
            type="button"
            disabled={paged.current === 1}
            aria-label="Trang trước"
            onClick={() => goTo(paged.current - 1)}
          >
            <Icon name="left" size={18} />
          </button>
          {pageNumbers(paged.current, paged.pageCount).map((n, i) =>
            n === '…' ? (
              <span key={`gap-${i}`} aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                className={n === paged.current ? 'current' : ''}
                aria-current={n === paged.current ? 'page' : undefined}
                aria-label={`Trang ${n}`}
                onClick={() => goTo(n)}
              >
                {n}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={paged.current === paged.pageCount}
            aria-label="Trang sau"
            onClick={() => goTo(paged.current + 1)}
          >
            <Icon name="right" size={18} />
          </button>
        </nav>
      )}
    </section>
  )
}
