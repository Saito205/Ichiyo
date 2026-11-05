import { useState } from 'react'
import AdminIcon from './AdminIcon.jsx'
import GuideContent from '../components/GuideContent.jsx'
import useUnsavedChanges from './useUnsavedChanges.js'
export default function GuideTab({ guide, onSave, onDirtyChange }) {
  const [form, setForm] = useState(() => structuredClone(guide))
  const [baseline, setBaseline] = useState(() => JSON.stringify(guide))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  useUnsavedChanges(JSON.stringify(form) !== baseline, onDirtyChange)
  const text = (key) => ({
    value: form[key],
    onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
  })
  const editStep = (id, key, value) =>
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id ? { ...s, [key]: value } : s)),
    }))
  const move = (index, delta) =>
    setForm((prev) => {
      const steps = [...prev.steps]
      ;[steps[index], steps[index + delta]] = [steps[index + delta], steps[index]]
      return { ...prev, steps }
    })
  const remove = (step) => {
    if (window.confirm(`Xóa bước "${step.title || 'Chưa đặt tên'}"?`))
      setForm((prev) => ({ ...prev, steps: prev.steps.filter((s) => s.id !== step.id) }))
  }
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) return setError('Hãy nhập tiêu đề hướng dẫn.')
    if (!form.steps.length || form.steps.some((s) => !s.title.trim() || !s.body.trim()))
      return setError('Cần ít nhất một bước, với đầy đủ tiêu đề và nội dung.')
    setBusy(true)
    try {
      const next = {
        ...form,
        title: form.title.trim(),
        intro: form.intro.trim(),
        note: form.note.trim(),
        steps: form.steps.map((s) => ({ ...s, title: s.title.trim(), body: s.body.trim() })),
      }
      await onSave(next)
      setForm(next)
      setBaseline(JSON.stringify(next))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="admin-fieldset">
        <div className="admin-section-heading">
          <div>
            <h2>Hướng dẫn mua hàng</h2>
            <p>Nội dung này xuất hiện tại trang Hướng dẫn của website.</p>
          </div>
          <button className="ad-btn ghost" type="button" onClick={() => setPreview((p) => !p)}>
            {preview ? 'Tiếp tục chỉnh sửa' : 'Xem trước'}
          </button>
        </div>
        {preview ? (
          <div className="ad-card admin-guide-preview">
            <GuideContent guide={form} />
          </div>
        ) : (
          <div className="ad-card ad-settings">
            <label className="ad-field">
              <span className="ad-label">Tiêu đề trang</span>
              <input className="ad-input" required {...text('title')} />
            </label>
            <label className="ad-field">
              <span className="ad-label">Lời giới thiệu</span>
              <textarea className="ad-input" rows={3} {...text('intro')} />
            </label>
            {form.steps.map((step, i) => (
              <section key={step.id} className="admin-filter-editor" aria-label={`Bước ${i + 1}`}>
                <div className="admin-editor-heading">
                  <h3>Bước {i + 1}</h3>
                  <div className="admin-inline-actions">
                    <button
                      className="ad-icon-btn"
                      type="button"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      aria-label={`Đưa bước ${i + 1} lên trên`}
                    >
                      ↑
                    </button>
                    <button
                      className="ad-icon-btn"
                      type="button"
                      disabled={i === form.steps.length - 1}
                      onClick={() => move(i, 1)}
                      aria-label={`Đưa bước ${i + 1} xuống dưới`}
                    >
                      ↓
                    </button>
                    <button
                      className="ad-icon-btn"
                      type="button"
                      onClick={() => remove(step)}
                      aria-label={`Xóa bước ${i + 1}`}
                    >
                      <AdminIcon name="trash" />
                    </button>
                  </div>
                </div>
                <label className="ad-field">
                  <span className="ad-label">Tiêu đề bước {i + 1}</span>
                  <input
                    className="ad-input"
                    required
                    value={step.title}
                    onChange={(e) => editStep(step.id, 'title', e.target.value)}
                  />
                </label>
                <label className="ad-field">
                  <span className="ad-label">Nội dung bước {i + 1}</span>
                  <textarea
                    className="ad-input"
                    required
                    rows={4}
                    value={step.body}
                    onChange={(e) => editStep(step.id, 'body', e.target.value)}
                  />
                </label>
              </section>
            ))}
            <button
              type="button"
              className="ad-btn ghost"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  steps: [
                    ...prev.steps,
                    { id: `step-${crypto.randomUUID()}`, title: '', body: '' },
                  ],
                }))
              }
            >
              <AdminIcon name="plus" />
              Thêm bước
            </button>
            <label className="ad-field admin-note-field">
              <span className="ad-label">Lưu ý cuối trang</span>
              <textarea className="ad-input" rows={3} {...text('note')} />
            </label>
            <p className="ad-hint">
              Nội dung được hiển thị dưới dạng văn bản. Xuống dòng trong ô nhập sẽ được giữ trên
              trang Hướng dẫn.
            </p>
          </div>
        )}
        {error && (
          <p className="ad-error admin-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="admin-save-bar">
          <span className="ad-hint">Kiểm tra thông tin mua hàng trước khi lưu.</span>
          <button className="ad-btn" type="submit">
            {busy ? 'Đang lưu…' : 'Lưu hướng dẫn'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}
