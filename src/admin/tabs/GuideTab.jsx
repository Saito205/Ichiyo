import { useState } from 'react'
import GuideContent from '../../store/components/GuideContent.jsx'
import AdminIcon from '../components/AdminIcon.jsx'
import useDraft from '../hooks/useDraft.js'

function StepEditor({ step, index, isFirst, isLast, onEdit, onMove, onRemove }) {
  const n = index + 1
  return (
    <section className="admin-filter-editor" aria-label={`Bước ${n}`}>
      <div className="admin-editor-heading">
        <h3>Bước {n}</h3>
        <div className="admin-inline-actions">
          <button
            className="ad-icon-btn"
            type="button"
            disabled={isFirst}
            onClick={() => onMove(-1)}
            aria-label={`Đưa bước ${n} lên trên`}
          >
            ↑
          </button>
          <button
            className="ad-icon-btn"
            type="button"
            disabled={isLast}
            onClick={() => onMove(1)}
            aria-label={`Đưa bước ${n} xuống dưới`}
          >
            ↓
          </button>
          <button className="ad-icon-btn" type="button" onClick={onRemove} aria-label={`Xóa bước ${n}`}>
            <AdminIcon name="trash" />
          </button>
        </div>
      </div>
      <label className="ad-field">
        <span className="ad-label">Tiêu đề bước {n}</span>
        <input className="ad-input" required value={step.title} onChange={(e) => onEdit('title', e.target.value)} />
      </label>
      <label className="ad-field">
        <span className="ad-label">Nội dung bước {n}</span>
        <textarea
          className="ad-input"
          required
          rows={4}
          value={step.body}
          onChange={(e) => onEdit('body', e.target.value)}
        />
      </label>
    </section>
  )
}

export default function GuideTab({ guide, onSave, onDirtyChange }) {
  const { draft, setDraft, busy, error, setError, save, field } = useDraft(() => structuredClone(guide), {
    onDirtyChange,
  })
  const [preview, setPreview] = useState(false)

  const setSteps = (change) => setDraft((prev) => ({ ...prev, steps: change(prev.steps) }))
  const editStep = (id, key, value) => setSteps((steps) => steps.map((s) => (s.id === id ? { ...s, [key]: value } : s)))
  const moveStep = (index, delta) =>
    setSteps((steps) => {
      const next = [...steps]
      ;[next[index], next[index + delta]] = [next[index + delta], next[index]]
      return next
    })
  const removeStep = (step) => {
    if (window.confirm(`Xóa bước "${step.title || 'Chưa đặt tên'}"?`))
      setSteps((steps) => steps.filter((s) => s.id !== step.id))
  }
  const addStep = () => setSteps((steps) => [...steps, { id: `step-${crypto.randomUUID()}`, title: '', body: '' }])

  const submit = (e) => {
    e.preventDefault()
    if (!draft.title.trim()) return setError('Hãy nhập tiêu đề hướng dẫn.')
    if (!draft.steps.length || draft.steps.some((s) => !s.title.trim() || !s.body.trim()))
      return setError('Cần ít nhất một bước, với đầy đủ tiêu đề và nội dung.')
    save(async () => {
      const next = {
        ...draft,
        title: draft.title.trim(),
        intro: draft.intro.trim(),
        note: draft.note.trim(),
        steps: draft.steps.map((s) => ({ ...s, title: s.title.trim(), body: s.body.trim() })),
      }
      await onSave(next)
      return next
    })
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
            <GuideContent guide={draft} />
          </div>
        ) : (
          <div className="ad-card ad-settings">
            <label className="ad-field">
              <span className="ad-label">Tiêu đề trang</span>
              <input className="ad-input" required {...field('title')} />
            </label>
            <label className="ad-field">
              <span className="ad-label">Lời giới thiệu</span>
              <textarea className="ad-input" rows={3} {...field('intro')} />
            </label>
            {draft.steps.map((step, i) => (
              <StepEditor
                key={step.id}
                step={step}
                index={i}
                isFirst={i === 0}
                isLast={i === draft.steps.length - 1}
                onEdit={(key, value) => editStep(step.id, key, value)}
                onMove={(delta) => moveStep(i, delta)}
                onRemove={() => removeStep(step)}
              />
            ))}
            <button type="button" className="ad-btn ghost" onClick={addStep}>
              <AdminIcon name="plus" />
              Thêm bước
            </button>
            <label className="ad-field admin-note-field">
              <span className="ad-label">Lưu ý cuối trang</span>
              <textarea className="ad-input" rows={3} {...field('note')} />
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
