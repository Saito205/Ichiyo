import { useEffect, useRef, useState } from 'react'
import AdminIcon from './AdminIcon.jsx'
import { ImageField, GalleryField } from './ImageField.jsx'

export default function ProductEditor({ product, categories, onSave, onDelete, onClose }) {
  const ref = useRef(null)
  const [form, setForm] = useState(product.data)
  const [initial] = useState(() => JSON.stringify(product.data))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dirty = JSON.stringify(form) !== initial
  const isNew = product.slug === null

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const text = (key) => ({ value: form[key] ?? '', onChange: (e) => set(key)(e.target.value) })

  const tryClose = () => {
    if (busy) return
    if (dirty && !window.confirm('Bỏ các thay đổi chưa lưu?')) return
    ref.current.close()
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('Hãy nhập tên sản phẩm.')
    setBusy(true)
    setError('')
    try {
      await onSave(product.slug, {
        title: form.title.trim(),
        category: (form.category || '').trim(),
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
    <dialog ref={ref} className="ad-dialog" aria-label="Sản phẩm" onClose={onClose}
      onCancel={(e) => { e.preventDefault(); tryClose() }}>
      <form onSubmit={submit}>
        <div className="ad-dialog-head">
          <h2>{isNew ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}</h2>
          <button type="button" className="ad-icon-btn" aria-label="Đóng" onClick={tryClose}><AdminIcon name="close" /></button>
        </div>

        <div className="ad-dialog-body">
          <label className="ad-field">
            <span className="ad-label">Tên sản phẩm</span>
            <input className="ad-input" required {...text('title')} />
          </label>

          <div className="ad-row">
            <label className="ad-field">
              <span className="ad-label">Danh mục</span>
              <input className="ad-input" list="ad-cats" {...text('category')} />
              <datalist id="ad-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <label className="ad-field">
              <span className="ad-label">Thứ tự (số nhỏ hiện trước)</span>
              <input className="ad-input" type="number" min="0" {...text('order')} />
            </label>
          </div>

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
          <GalleryField label="Thư viện ảnh" value={form.gallery || []} onChange={set('gallery')} onError={setError} />

          <label className="ad-field">
            <span className="ad-label">Liên kết ngoài (không bắt buộc)</span>
            <input className="ad-input" type="url" placeholder="https://" {...text('link')} />
          </label>
          <label className="ad-check">
            <input type="checkbox" checked={!!form.featured} onChange={(e) => set('featured')(e.target.checked)} />
            Đánh dấu nổi bật
          </label>
        </div>

        <div className="ad-dialog-foot">
          {error && <p className="ad-error" role="alert">{error}</p>}
          {!isNew && (
            <button type="button" className="ad-btn danger" disabled={busy} onClick={remove}>
              <AdminIcon name="trash" /> Xóa
            </button>
          )}
          <span className="ad-spacer" />
          <button type="button" className="ad-btn ghost" disabled={busy} onClick={tryClose}>Hủy</button>
          <button type="submit" className="ad-btn" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu sản phẩm'}</button>
        </div>
      </form>
    </dialog>
  )
}
