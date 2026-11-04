import { useState } from 'react'
import AdminIcon from './AdminIcon.jsx'
import { addImage, previewSrc } from './media.js'

export function ImageField({ label, value, onChange, onError }) {
  const [busy, setBusy] = useState(false)

  const pick = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      onChange(await addImage(file))
    } catch (err) {
      onError(err.message)
    }
    setBusy(false)
  }

  return (
    <div className="ad-field">
      <span className="ad-label">{label}</span>
      <div className="ad-img-row">
        <div className="ad-img-box">
          {value ? <img src={previewSrc(value)} alt="" /> : <AdminIcon name="image" size={28} />}
        </div>
        <label className="ad-btn ghost">
          <input className="ad-file" type="file" accept="image/*" onChange={pick} />
          {busy ? 'Đang xử lý…' : value ? 'Đổi ảnh' : 'Chọn ảnh'}
        </label>
        {value && (
          <button type="button" className="ad-btn ghost" onClick={() => onChange('')}>Xóa ảnh</button>
        )}
      </div>
    </div>
  )
}

export function GalleryField({ label, value, onChange, onError }) {
  const [busy, setBusy] = useState(false)

  const add = async (e) => {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    try {
      const paths = []
      for (const f of files) paths.push(await addImage(f))
      onChange([...value, ...paths])
    } catch (err) {
      onError(err.message)
    }
    setBusy(false)
  }
  const move = (i, step) => {
    const next = [...value]
    ;[next[i], next[i + step]] = [next[i + step], next[i]]
    onChange(next)
  }

  return (
    <div className="ad-field">
      <span className="ad-label">{label}</span>
      <div className="ad-gallery">
        {value.map((p, i) => (
          <div className="ad-thumb" key={p + i}>
            <img src={previewSrc(p)} alt="" />
            <div className="ad-thumb-bar">
              <button type="button" aria-label="Chuyển trái" disabled={i === 0} onClick={() => move(i, -1)}><AdminIcon name="left" size={14} /></button>
              <button type="button" aria-label="Chuyển phải" disabled={i === value.length - 1} onClick={() => move(i, 1)}><AdminIcon name="right" size={14} /></button>
              <button type="button" aria-label="Xóa ảnh" onClick={() => onChange(value.filter((_, j) => j !== i))}><AdminIcon name="close" size={14} /></button>
            </div>
          </div>
        ))}
        <label className="ad-add-img">
          <input className="ad-file" type="file" accept="image/*" multiple onChange={add} />
          <AdminIcon name="plus" size={22} />
          <span>{busy ? 'Đang xử lý…' : 'Thêm ảnh'}</span>
        </label>
      </div>
    </div>
  )
}
