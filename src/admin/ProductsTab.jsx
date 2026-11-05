import { useState } from 'react'
import AdminIcon from './AdminIcon.jsx'
import ProductEditor from './ProductEditor.jsx'
import { previewSrc } from './media.js'
import { formatPrice, normalizeVariants, priceRangeLabel } from '../content.js'

export default function ProductsTab({ products, categories, onSave, onDelete, onReload }) {
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)

  const keyword = q.trim().toLowerCase()
  const shown = products.filter((p) =>
    `${p.data.title} ${p.data.category ?? ''}`.toLowerCase().includes(keyword),
  )

  const create = () =>
    setEditing({
      slug: null,
      data: {
        title: '',
        price: '',
        variants: [],
        category: '',
        categoryId: '',
        attributes: {},
        summary: '',
        description: '',
        cover: '',
        gallery: [],
        link: '',
        featured: false,
        order: Math.max(0, ...products.map((p) => p.data.order ?? 0)) + 1,
      },
    })

  return (
    <>
      <div className="ad-toolbar">
        <label className="ad-search">
          <AdminIcon name="search" />
          <input
            type="search"
            placeholder="Tìm sản phẩm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Tìm sản phẩm"
          />
        </label>
        <button
          type="button"
          className="ad-icon-btn"
          aria-label="Tải lại danh sách"
          onClick={onReload}
        >
          <AdminIcon name="refresh" />
        </button>
        <button type="button" className="ad-btn" onClick={create}>
          <AdminIcon name="plus" /> Thêm sản phẩm
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="ad-empty">
          {products.length
            ? 'Không có sản phẩm khớp.'
            : 'Chưa có sản phẩm. Bấm “Thêm sản phẩm” để tạo cái đầu tiên.'}
        </p>
      ) : (
        <ul className="ad-list">
          {shown.map((p) => {
            const priceLabel = p.data.variants?.length
              ? priceRangeLabel({ variants: normalizeVariants(p.data.variants) })
              : formatPrice(p.data.price)
            return (
              <li key={p.slug}>
                <button type="button" className="ad-item" onClick={() => setEditing(p)}>
                  <span className="ad-item-img">
                    {p.data.cover ? (
                      <img src={previewSrc(p.data.cover)} alt="" loading="lazy" />
                    ) : (
                      <span aria-hidden="true">一</span>
                    )}
                  </span>
                  <span className="ad-item-info">
                    <strong>{p.data.title}</strong>
                    <small>
                      {p.data.category || 'Chưa có danh mục'}
                      {priceLabel ? ` · ${priceLabel}` : ''}
                    </small>
                  </span>
                  {p.data.featured && <span className="ad-tag">Nổi bật</span>}
                  <span className="ad-item-edit">
                    <AdminIcon name="edit" /> Sửa
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <ProductEditor
          key={editing.slug ?? 'new'}
          product={editing}
          categories={categories}
          onSave={onSave}
          onDelete={onDelete}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
