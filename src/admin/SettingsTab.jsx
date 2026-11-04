import { useState } from 'react'
import { ImageField } from './ImageField.jsx'

const contactFields = [
  ['email', 'Email'],
  ['phone', 'Điện thoại'],
  ['zalo', 'Zalo (link)'],
  ['facebook', 'Facebook (link)'],
  ['instagram', 'Instagram (link)'],
  ['address', 'Địa chỉ'],
]

export default function SettingsTab({ site, onSave, onError }) {
  const [form, setForm] = useState({ ...site, contact: { ...site.contact } })
  const [busy, setBusy] = useState(false)

  const text = (key) => ({ value: form[key] ?? '', onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })
  const image = (key) => ({ value: form[key] ?? '', onChange: (v) => setForm((f) => ({ ...f, [key]: v })), onError })
  const contact = (key) => ({
    value: form.contact?.[key] ?? '',
    onChange: (e) => setForm((f) => ({ ...f, contact: { ...f.contact, [key]: e.target.value } })),
  })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await onSave(form)
    } catch (err) {
      onError(err.message)
    }
    setBusy(false)
  }

  return (
    <form className="ad-card ad-settings" onSubmit={submit}>
      <h2>Thông tin chung</h2>
      <ImageField label="Logo (ảnh nền trong suốt, nên dùng PNG hoặc SVG)" {...image('logo')} />
      <div className="ad-row">
        <label className="ad-field"><span className="ad-label">Tên thương hiệu</span><input className="ad-input" required {...text('name')} /></label>
        <label className="ad-field"><span className="ad-label">Khẩu hiệu</span><input className="ad-input" {...text('tagline')} /></label>
      </div>
      <label className="ad-field"><span className="ad-label">Tiêu đề trang chủ</span><input className="ad-input" {...text('heroTitle')} /></label>
      <label className="ad-field"><span className="ad-label">Mô tả trang chủ</span><textarea className="ad-input" rows={3} {...text('heroText')} /></label>
      <ImageField label="Ảnh trang chủ" {...image('heroImage')} />

      <h2>Liên hệ</h2>
      <div className="ad-row">
        {contactFields.map(([key, label]) => (
          <label className="ad-field" key={key}><span className="ad-label">{label}</span><input className="ad-input" {...contact(key)} /></label>
        ))}
      </div>
      <label className="ad-field"><span className="ad-label">Chữ cuối trang</span><input className="ad-input" {...text('footer')} /></label>

      <div className="ad-actions">
        <button type="submit" className="ad-btn" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu cài đặt'}</button>
      </div>
    </form>
  )
}
