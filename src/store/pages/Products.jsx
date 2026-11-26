import { useRef, useState } from 'react'
import { PAGE_SIZE, SORTS, filterProducts, paginate } from '../../shared/catalog.js'
import { categories, products } from '../../shared/content.js'
import CatalogFilters from '../components/CatalogFilters.jsx'
import Icon from '../components/Icon.jsx'
import Pagination from '../components/Pagination.jsx'
import ProductCard from '../components/ProductCard.jsx'

const noFilters = { query: '', categoryId: '', attributes: {}, sort: 'newest' }

export default function Products({ onOpen }) {
  const [filters, setFilters] = useState(noFilters)
  const [page, setPage] = useState(1)
  const results = useRef(null)
  const { query, categoryId, attributes, sort } = filters
  const filtered = filterProducts(products, filters, categories)
  const paged = paginate(filtered, page)
  const active = query || categoryId || Object.values(attributes).some(Boolean)

  // Mỗi lần đổi bộ lọc thì quay về trang 1.
  const updateFilters = (change) => {
    setFilters((prev) => ({ ...prev, ...change(prev) }))
    setPage(1)
  }
  const goTo = (n) => {
    setPage(n)
    results.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    results.current?.focus({ preventScroll: true })
  }
  const first = (paged.current - 1) * PAGE_SIZE + 1
  const last = Math.min(paged.current * PAGE_SIZE, filtered.length)

  return (
    <section className="wrap products-page">
      <div className="page-heading">
        <span className="eyebrow">Tìm món bạn thích</span>
        <h1>Tất cả sản phẩm</h1>
        <p className="page-intro">Những món đồ nhỏ, dành cho những điều bạn nâng niu.</p>
      </div>
      <CatalogFilters
        query={query}
        onQuery={(value) => updateFilters(() => ({ query: value }))}
        categories={categories}
        categoryId={categoryId}
        onCategory={(id) => updateFilters(() => ({ categoryId: id, attributes: {} }))}
        attributes={attributes}
        onAttribute={(id, value) =>
          updateFilters((prev) => ({ attributes: { ...prev.attributes, [id]: value } }))
        }
      />
      <div className="results-heading" ref={results} tabIndex={-1}>
        <p className="count" role="status">
          {filtered.length ? `${first}–${last} / ${filtered.length} sản phẩm` : '0 sản phẩm'}
        </p>
        <div className="results-tools">
          {active && (
            <button type="button" className="reset-filters" onClick={() => updateFilters(() => noFilters)}>
              <Icon name="close" size={16} />
              Xóa bộ lọc
            </button>
          )}
          <label className="sort-field">
            <span>Sắp xếp</span>
            <select value={sort} onChange={(e) => updateFilters(() => ({ sort: e.target.value }))}>
              {SORTS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {paged.items.length ? (
        <div className="product-grid">
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
      <Pagination current={paged.current} pageCount={paged.pageCount} onChange={goTo} />
    </section>
  )
}
