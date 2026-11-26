import { normalizeTheme, validateTheme } from '../../shared/theme.js'
import { checkUrl } from '../../shared/url.js'
import { ImageField } from '../components/ImageField.jsx'
import useDraft from '../hooks/useDraft.js'
import ThemeEditor from './ThemeEditor.jsx'

const contactFields = [
  ['email', 'Email'],
  ['phone', 'Điện thoại'],
  ['zalo', 'Zalo (link)'],
  ['facebook', 'Facebook (link)'],
  ['instagram', 'Instagram (link)'],
  ['tiktok', 'TikTok (link)'],
  ['address', 'Địa chỉ'],
]

export default function SettingsTab({ site, onSave, onError, onDirtyChange }) {
  const { draft, setDraft, busy, save, field } = useDraft(
    () => ({ ...site, contact: { ...site.contact }, theme: normalizeTheme(site.theme) }),
    { onDirtyChange, onError }, // lỗi hiện dạng thông báo nổi
  )

  const image = (key) => ({
    value: draft[key] ?? '',
    onChange: (v) => setDraft((f) => ({ ...f, [key]: v })),
    onError,
  })
  const contact = (key) => ({
    value: draft.contact?.[key] ?? '',
    onChange: (e) => setDraft((f) => ({ ...f, contact: { ...f.contact, [key]: e.target.value } })),
  })

  const submit = (e) => {
    e.preventDefault()
    save(async () => {
      const contact = { ...draft.contact }
      for (const [key, label] of contactFields.slice(2, 6)) contact[key] = checkUrl(contact[key], label)
      const next = { ...draft, contact, theme: validateTheme(draft.theme) }
      await onSave(next)
      return next
    })
  }

  return (
    <form className="ad-card ad-settings" onSubmit={submit}>
      <fieldset disabled={busy} className="admin-fieldset">
        <h2>Thông tin chung</h2>
        <ImageField label="Logo (nên dùng ảnh nền trong suốt: PNG, WebP hoặc SVG)" {...image('logo')} />
        <div className="ad-row">
          <label className="ad-field">
            <span className="ad-label">Tên thương hiệu</span>
            <input className="ad-input" required {...field('name')} />
          </label>
          <label className="ad-field">
            <span className="ad-label">Khẩu hiệu</span>
            <input className="ad-input" {...field('tagline')} />
          </label>
        </div>
        <label className="ad-field">
          <span className="ad-label">Tiêu đề trang chủ</span>
          <input className="ad-input" {...field('heroTitle')} />
        </label>
        <label className="ad-field">
          <span className="ad-label">Mô tả trang chủ</span>
          <textarea className="ad-input" rows={3} {...field('heroText')} />
        </label>
        <ImageField label="Ảnh trang chủ" {...image('heroImage')} />

        <label className="ad-field">
          <span className="ad-label">Tiêu đề giới thiệu thêm trên Trang chủ</span>
          <input className="ad-input" {...field('aboutTitle')} />
        </label>
        <label className="ad-field">
          <span className="ad-label">Nội dung giới thiệu thêm</span>
          <textarea className="ad-input" rows={4} {...field('aboutText')} />
        </label>
        <ThemeEditor
          value={draft.theme}
          siteName={draft.name}
          onChange={(theme) => setDraft((f) => ({ ...f, theme }))}
        />
        <h2>Liên hệ</h2>
        <div className="ad-row">
          {contactFields.map(([key, label]) => (
            <label className="ad-field" key={key}>
              <span className="ad-label">{label}</span>
              <input className="ad-input" {...contact(key)} />
            </label>
          ))}
        </div>
        <label className="ad-field">
          <span className="ad-label">Chữ cuối trang</span>
          <input className="ad-input" {...field('footer')} />
        </label>

        <div className="ad-actions">
          <button type="submit" className="ad-btn" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu cài đặt'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}
