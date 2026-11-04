import { useState } from 'react'
import ProductCard from '../components/ProductCard.jsx'
import { products, categories } from '../content.js'

export default function Products() {
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')

  const shown = products.filter((p) => {
    if (cat && p.category !== cat) return false
    const text = `${p.title} ${p.summary ?? ''} ${p.category ?? ''}`.toLowerCase()
    return text.includes(q.trim().toLowerCase())
  })

  return (
    <div className="container py-5">
      <h1 className="h2 mb-4">Sản phẩm</h1>

      <div className="row g-2 mb-4">
        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Tìm sản phẩm…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <div className="col-md-6">
            <select className="form-select" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="text-muted">Không có sản phẩm phù hợp.</p>
      ) : (
        <div className="row g-4">
          {shown.map((p) => (
            <div className="col-sm-6 col-lg-4" key={p.slug}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
