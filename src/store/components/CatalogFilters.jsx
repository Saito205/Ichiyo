import Icon from './Icon.jsx'

// Thanh tìm kiếm + chọn danh mục.
export default function CatalogFilters({ query, onQuery, categories, categoryId, onCategory }) {
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
      </div>
    </div>
  )
}
