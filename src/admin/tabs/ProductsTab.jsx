import { useState } from 'react'
import { searchText } from '../../shared/text.js'
import AdminIcon from '../components/AdminIcon.jsx'
import ProductRow from '../components/ProductRow.jsx'
import ProductEditor from './ProductEditor.jsx'

const emptyProduct = (order) => ({
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
  soldOut: false,
  order,
})

export default function ProductsTab({ products, categories, onSave, onDelete, onReload }) {
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null) // { slug, data }; slug = null là sản phẩm mới

  // Tìm không cần gõ dấu: "bia lanh" vẫn ra "Bìa lạnh".
  const keyword = searchText(q)
  const shown = products.filter((p) => searchText(`${p.data.title} ${p.data.category ?? ''}`).includes(keyword))
  const create = () => {
    const nextOrder = Math.max(0, ...products.map((p) => p.data.order ?? 0)) + 1
    setEditing({ slug: null, data: emptyProduct(nextOrder) })
  }

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
        <button type="button" className="ad-icon-btn" aria-label="Tải lại danh sách" onClick={onReload}>
          <AdminIcon name="refresh" />
        </button>
        <button type="button" className="ad-btn" onClick={create}>
          <AdminIcon name="plus" /> Thêm sản phẩm
        </button>
      </div>

      <p className="ad-count" role="status">
        {shown.length === products.length
          ? `${products.length} sản phẩm`
          : `${shown.length} / ${products.length} sản phẩm`}
      </p>

      {shown.length === 0 ? (
        <p className="ad-empty">
          {products.length
            ? 'Không có sản phẩm khớp.'
            : 'Chưa có sản phẩm. Bấm “Thêm sản phẩm” để tạo cái đầu tiên.'}
        </p>
      ) : (
        <ul className="ad-list ad-stagger">
          {shown.map((p) => (
            <li key={p.slug}>
              <ProductRow product={p} className="ad-item" onClick={() => setEditing(p)}>
                <span className="ad-item-edit">
                  <AdminIcon name="edit" /> Sửa
                </span>
              </ProductRow>
            </li>
          ))}
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
