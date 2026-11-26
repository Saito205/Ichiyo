import { useState } from 'react'
import { categoryFor } from '../../shared/catalog.js'
import { searchText } from '../../shared/text.js'
import { checkUrl } from '../../shared/url.js'
import useModalDialog from '../../shared/useModalDialog.js'
import AdminIcon from '../components/AdminIcon.jsx'
import { GalleryField, ImageField } from '../components/ImageField.jsx'

const newVariantId = () => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const toPriceNumber = (value) => Number(String(value ?? '').replace(/[.,\s₫đ]/g, ''))

// Form giữ giá dạng chuỗi để dễ gõ; khi lưu mới chuyển thành số.
const toForm = (data, categories) => ({
  ...data,
  price: data.price ?? '',
  categoryId: categoryFor(data, categories)?.id || '',
  variants: (data.variants || []).map((v) => ({
    id: v.id || newVariantId(),
    label: v.label ?? '',
    price: v.price ?? '',
    soldOut: !!v.soldOut,
  })),
})

// Kiểm tra phân loại: bỏ dòng trống hoàn toàn, các dòng còn lại cần đủ tên và giá hợp lệ.
// Trả về danh sách đã làm sạch, hoặc ném lỗi để hiện cho người dùng.
function cleanVariants(variants) {
  const rows = variants
    .map((v) => ({ id: v.id, label: String(v.label).trim(), price: String(v.price ?? '').trim(), soldOut: !!v.soldOut }))
    .filter((v) => v.label || v.price)
  for (const v of rows) {
    if (!v.label) throw new Error('Hãy nhập tên cho tất cả phân loại.')
    if (!/^\d+$/.test(v.price.replace(/[.,\s₫đ]/g, '')) || toPriceNumber(v.price) <= 0)
      throw new Error(`Hãy nhập giá hợp lệ (số lớn hơn 0) cho phân loại "${v.label}".`)
  }
  const labels = rows.map((v) => searchText(v.label))
  if (new Set(labels).size !== labels.length) throw new Error('Tên các phân loại bị trùng nhau.')
  return rows.map((v) => ({ id: v.id, label: v.label, price: toPriceNumber(v.price), soldOut: v.soldOut }))
}

// Giá chung: số nếu chỉ gồm chữ số (cho phép dấu . , cách), còn lại giữ nguyên chữ (vd "Liên hệ").
function cleanPrice(value) {
  const raw = String(value ?? '').trim()
  return raw && /^\d+$/.test(raw.replace(/[.,\s]/g, '')) ? Number(raw.replace(/[.,\s]/g, '')) : raw
}

function VariantsEditor({ variants, onChange }) {
  const setVariant = (id, patch) => onChange(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)))
  return (
    <section className="admin-product-variants">
      <h3>Phân loại sản phẩm (không bắt buộc)</h3>
      {variants.length === 0 ? (
        <p className="ad-hint">
          Không phân loại: sản phẩm chỉ có 1 loại và 1 giá ở ô “Giá tiền”. Bấm “Thêm phân loại” nếu
          muốn bán nhiều loại với giá khác nhau (ví dụ: 1 cặp – 25000, 2 cặp – 50000).
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
              <label className="ad-check variant-sold-out" title="Phân loại này tạm hết hàng">
                <input
                  type="checkbox"
                  checked={!!v.soldOut}
                  onChange={(e) => setVariant(v.id, { soldOut: e.target.checked })}
                />
                Hết hàng
              </label>
              <button
                type="button"
                className="ad-icon-btn variant-remove"
                aria-label={`Xóa phân loại ${v.label || i + 1}`}
                title="Xóa phân loại"
                onClick={() => onChange(variants.filter((x) => x.id !== v.id))}
              >
                <AdminIcon name="trash" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="ad-btn ghost"
        onClick={() => onChange([...variants, { id: newVariantId(), label: '', price: '', soldOut: false }])}
      >
        <AdminIcon name="plus" /> Thêm phân loại
      </button>
    </section>
  )
}

export default function ProductEditor({ product, categories, onSave, onDelete, onClose }) {
  const ref = useModalDialog()
  const [form, setForm] = useState(() => toForm(product.data, categories))
  const [initial] = useState(() => JSON.stringify(form))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dirty = JSON.stringify(form) !== initial
  const category = categories.find((c) => c.id === form.categoryId)
  const variants = form.variants || []
  const isNew = product.slug === null

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const text = (key) => ({ value: form[key] ?? '', onChange: (e) => set(key)(e.target.value) })

  const tryClose = () => {
    if (busy) return
    if (dirty && !window.confirm('Bỏ các thay đổi chưa lưu?')) return
    ref.current.close()
  }

  // Chạy thao tác lưu / xóa; xong thì đóng hộp thoại, lỗi thì hiện ngay trong hộp thoại.
  const run = async (action) => {
    setBusy(true)
    try {
      await action()
      ref.current.close()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('Hãy nhập tên sản phẩm.')
    let savedVariants, link
    try {
      link = checkUrl(form.link, 'Liên kết ngoài')
      savedVariants = cleanVariants(variants)
    } catch (err) {
      return setError(err.message)
    }
    setError('')
    run(() =>
      onSave(product.slug, {
        title: form.title.trim(),
        // Có phân loại thì giá chung là giá thấp nhất; giá thật nằm ở từng phân loại.
        price: savedVariants.length ? Math.min(...savedVariants.map((v) => v.price)) : cleanPrice(form.price),
        variants: savedVariants,
        categoryId: category?.id || '',
        category: category?.name || '',
        summary: (form.summary || '').trim(),
        description: (form.description || '').trim(),
        cover: form.cover || '',
        gallery: form.gallery || [],
        link,
        featured: !!form.featured,
        soldOut: !!form.soldOut,
        order: Number(form.order) || 0,
      }),
    )
  }

  const remove = () => {
    if (window.confirm(`Xóa "${product.data.title}" khỏi website?`)) run(() => onDelete(product.slug))
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

            <VariantsEditor variants={variants} onChange={set('variants')} />

            <div className="ad-row">
              <label className="ad-field">
                <span className="ad-label">Danh mục</span>
                <select
                  className="ad-input"
                  value={form.categoryId}
                  onChange={(e) => {
                    const c = categories.find((item) => item.id === e.target.value)
                    setForm((prev) => ({ ...prev, categoryId: c?.id || '', category: c?.name || '' }))
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

            {!categories.length && (
              <p className="ad-hint">
                Tạo danh mục trong tab “Danh mục” trước khi phân loại sản phẩm.
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

            <ImageField label="Ảnh đại diện" value={form.cover} onChange={set('cover')} onError={setError} />
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
            <label className="ad-check">
              <input
                type="checkbox"
                checked={!!form.soldOut}
                onChange={(e) => set('soldOut')(e.target.checked)}
              />
              Hết hàng (khách vẫn xem được nhưng không thêm vào giỏ được)
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
