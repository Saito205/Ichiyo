import { useEffect, useRef, useState } from 'react'
import { categoryFor, cleanAttributes, searchText } from '../lib/catalog.js'
import AdminIcon from './AdminIcon.jsx'
import { ImageField, GalleryField } from './ImageField.jsx'

const newVariantId = () => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const toPriceNumber = (value) => Number(String(value ?? '').replace(/[.,\s₫đ]/g, ''))

export default function ProductEditor({ product, categories, onSave, onDelete, onClose }) {
  const ref = useRef(null)
  const makeForm = () => ({
    ...product.data,
    price: product.data.price ?? '',
    categoryId: categoryFor(product.data, categories)?.id || '',
    attributes: product.data.attributes || {},
    // Giá của từng phân loại được giữ dạng chuỗi trong form để dễ gõ.
    variants: (product.data.variants || []).map((v) => ({
      id: v.id || newVariantId(),
      label: v.label ?? '',
      price: v.price ?? '',
    })),
  })
  const [form, setForm] = useState(makeForm)
  const [initial] = useState(() => JSON.stringify(form))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dirty = JSON.stringify(form) !== initial
  const category = categories.find((c) => c.id === form.categoryId)
  const isNew = product.slug === null

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const variants = form.variants || []
  const setVariant = (id, patch) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }))
  const addVariant = () =>
    setForm((f) => ({
      ...f,
      variants: [...(f.variants || []), { id: newVariantId(), label: '', price: '' }],
    }))
  const removeVariant = (id) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((v) => v.id !== id) }))
  const text = (key) => ({ value: form[key] ?? '', onChange: (e) => set(key)(e.target.value) })

  const tryClose = () => {
    if (busy) return
    if (dirty && !window.confirm('Bỏ các thay đổi chưa lưu?')) return
    ref.current.close()
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('Hãy nhập tên sản phẩm.')
    // Phân loại: bỏ dòng trống hoàn toàn, các dòng còn lại cần đủ tên và giá hợp lệ.
    const cleanedVariants = variants
      .map((v) => ({ id: v.id, label: String(v.label).trim(), price: String(v.price ?? '').trim() }))
      .filter((v) => v.label || v.price)
    for (const v of cleanedVariants) {
      if (!v.label) return setError('Hãy nhập tên cho tất cả phân loại.')
      if (!/^\d+$/.test(v.price.replace(/[.,\s₫đ]/g, '')) || toPriceNumber(v.price) <= 0)
        return setError(`Hãy nhập giá hợp lệ (số lớn hơn 0) cho phân loại "${v.label}".`)
    }
    const labels = cleanedVariants.map((v) => searchText(v.label))
    if (new Set(labels).size !== labels.length) return setError('Tên các phân loại bị trùng nhau.')
    const savedVariants = cleanedVariants.map((v) => ({
      id: v.id,
      label: v.label,
      price: toPriceNumber(v.price),
    }))

    setBusy(true)
    setError('')
    try {
      const rawPrice = String(form.price ?? '').trim()
      const numericPrice = rawPrice && /^\d+$/.test(rawPrice.replace(/[.,\s]/g, ''))
        ? Number(rawPrice.replace(/[.,\s]/g, ''))
        : rawPrice
      await onSave(product.slug, {
        title: form.title.trim(),
        // Có phân loại thì giá chung là giá thấp nhất; giá thật nằm ở từng phân loại.
        price: savedVariants.length
          ? Math.min(...savedVariants.map((v) => v.price))
          : numericPrice,
        variants: savedVariants,
        categoryId: category?.id || '',
        category: category?.name || '',
        attributes: cleanAttributes(form.attributes, category),
        summary: (form.summary || '').trim(),
        description: (form.description || '').trim(),
        cover: form.cover || '',
        gallery: form.gallery || [],
        link: (form.link || '').trim(),
        featured: !!form.featured,
        order: Number(form.order) || 0,
      })
      ref.current.close()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`Xóa "${product.data.title}" khỏi website?`)) return
    setBusy(true)
    try {
      await onDelete(product.slug)
      ref.current.close()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={ref}
      className="ad-dialog"
      aria-label="Sản phẩm"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        tryClose()
      }}
    >
      <form onSubmit={submit}>
        <fieldset disabled={busy} className="admin-fieldset admin-dialog-fields">
          <div className="ad-dialog-head">
            <h2>{isNew ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}</h2>
            <button type="button" className="ad-icon-btn" aria-label="Đóng" onClick={tryClose}>
              <AdminIcon name="close" />
            </button>
          </div>

          <div className="ad-dialog-body">
            <div className="ad-row">
              <label className="ad-field">
                <span className="ad-label">Tên sản phẩm</span>
                <input className="ad-input" required {...text('title')} />
              </label>
              <label className="ad-field">
                <span className="ad-label">Giá tiền (VNĐ)</span>
                <input
                  className="ad-input"
                  placeholder={
                    variants.length
                      ? 'Giá được đặt theo từng phân loại bên dưới'
                      : 'Ví dụ: 45000 (để trống nếu Liên hệ)'
                  }
                  disabled={variants.length > 0}
                  {...text('price')}
                />
              </label>
            </div>

            <section className="admin-product-variants">
              <h3>Phân loại sản phẩm (không bắt buộc)</h3>
              {variants.length === 0 ? (
                <p className="ad-hint">
                  Không phân loại: sản phẩm chỉ có 1 loại và 1 giá ở ô “Giá tiền”. Bấm “Thêm phân
                  loại” nếu muốn bán nhiều loại với giá khác nhau (ví dụ: 1 cặp – 25000, 2 cặp – 50000).
                </p>
              ) : (
                <ul className="variant-rows">
                  {variants.map((v, i) => (
                    <li key={v.id} className="variant-row">
                      <label className="ad-field">
                        <span className="ad-label">Tên phân loại {i + 1}</span>
                        <input
                          className="ad-input"
                          placeholder="Ví dụ: 1 cặp"
                          value={v.label}
                          onChange={(e) => setVariant(v.id, { label: e.target.value })}
                        />
                      </label>
                      <label className="ad-field">
                        <span className="ad-label">Giá (VNĐ)</span>
                        <input
                          className="ad-input"
                          inputMode="numeric"
                          placeholder="Ví dụ: 25000"
                          value={v.price}
                          onChange={(e) => setVariant(v.id, { price: e.target.value })}
                        />
                      </label>
                      <button
                        type="button"
                        className="ad-icon-btn variant-remove"
                        aria-label={`Xóa phân loại ${v.label || i + 1}`}
                        title="Xóa phân loại"
                        onClick={() => removeVariant(v.id)}
                      >
                        <AdminIcon name="trash" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="ad-btn ghost" onClick={addVariant}>
                <AdminIcon name="plus" /> Thêm phân loại
              </button>
            </section>

            <div className="ad-row">
              <label className="ad-field">
                <span className="ad-label">Danh mục</span>
                <select
                  className="ad-input"
                  value={form.categoryId}
                  onChange={(e) => {
                    const c = categories.find((item) => item.id === e.target.value)
                    setForm((prev) => ({
                      ...prev,
                      categoryId: c?.id || '',
                      category: c?.name || '',
                      attributes: {},
                    }))
                  }}
                >
                  <option value="">Chưa phân loại</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ad-field">
                <span className="ad-label">Thứ tự phụ (số nhỏ trước)</span>
                <input className="ad-input" type="number" min="0" {...text('order')} />
              </label>
            </div>

            {category?.filters.length > 0 && (
              <section className="admin-product-filters">
                <h3>Bộ lọc: {category.name}</h3>
                <div className="ad-row">
                  {category.filters.map((filter) => (
                    <label className="ad-field" key={filter.id}>
                      <span className="ad-label">{filter.name}</span>
                      <select
                        className="ad-input"
                        value={
                          filter.options.includes(form.attributes?.[filter.id])
                            ? form.attributes[filter.id]
                            : ''
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            attributes: { ...prev.attributes, [filter.id]: e.target.value },
                          }))
                        }
                      >
                        <option value="">Chưa chọn</option>
                        {filter.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <p className="ad-hint">
                  Khách chọn bộ lọc nào thì chỉ thấy sản phẩm được gán đúng giá trị đó.
                </p>
              </section>
            )}
            {!categories.length && (
              <p className="ad-hint">
                Tạo danh mục và bộ lọc trong tab “Danh mục & bộ lọc” trước khi phân loại sản phẩm.
              </p>
            )}
            <label className="ad-field">
              <span className="ad-label">Mô tả ngắn</span>
              <textarea className="ad-input" rows={2} {...text('summary')} />
            </label>
            <label className="ad-field">
              <span className="ad-label">Mô tả chi tiết</span>
              <textarea className="ad-input" rows={5} {...text('description')} />
              <span className="ad-hint">Để trống một dòng để xuống đoạn mới.</span>
            </label>

            <ImageField
              label="Ảnh đại diện"
              value={form.cover}
              onChange={set('cover')}
              onError={setError}
            />
            <GalleryField
              label="Thư viện ảnh"
              value={form.gallery || []}
              onChange={set('gallery')}
              onError={setError}
            />

            <label className="ad-field">
              <span className="ad-label">Liên kết ngoài (không bắt buộc)</span>
              <input className="ad-input" type="url" placeholder="https://" {...text('link')} />
            </label>
            <label className="ad-check">
              <input
                type="checkbox"
                checked={!!form.featured}
                onChange={(e) => set('featured')(e.target.checked)}
              />
              Đánh dấu nổi bật
            </label>
          </div>

          <div className="ad-dialog-foot">
            {error && (
              <p className="ad-error" role="alert">
                {error}
              </p>
            )}
            {!isNew && (
              <button type="button" className="ad-btn danger" disabled={busy} onClick={remove}>
                <AdminIcon name="trash" /> Xóa
              </button>
            )}
            <span className="ad-spacer" />
            <button type="button" className="ad-btn ghost" disabled={busy} onClick={tryClose}>
              Hủy
            </button>
            <button type="submit" className="ad-btn" disabled={busy}>
              {busy ? 'Đang lưu…' : 'Lưu sản phẩm'}
            </button>
          </div>
        </fieldset>
      </form>
    </dialog>
  )
}
