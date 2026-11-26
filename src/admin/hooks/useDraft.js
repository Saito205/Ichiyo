import { useEffect, useState } from 'react'

// Bản nháp của một form quản trị:
// - so với bản đã lưu để biết có thay đổi chưa lưu (báo cho Admin + cảnh báo khi đóng tab),
// - trạng thái đang lưu (busy) và thông báo lỗi.
//
// save(task): chạy task (thường là gọi onSave); task trả về bản nháp đã làm sạch
// để đặt làm mốc "đã lưu". Lỗi được hiện ở `error`, hoặc gửi cho onError nếu có.
export default function useDraft(createInitial, { onDirtyChange, onError } = {}) {
  const [draft, setDraft] = useState(createInitial)
  const [baseline, setBaseline] = useState(() => JSON.stringify(draft))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dirty = JSON.stringify(draft) !== baseline

  useEffect(() => {
    onDirtyChange?.(dirty)
    const warn = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    if (dirty) window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
      onDirtyChange?.(false)
    }
  }, [dirty, onDirtyChange])

  const save = async (task) => {
    if (busy) return
    setError('')
    setBusy(true)
    try {
      const saved = await task()
      if (saved) {
        setDraft(saved)
        setBaseline(JSON.stringify(saved))
      }
    } catch (e) {
      if (onError) onError(e.message)
      else setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  // Gắn nhanh một ô nhập chữ với một trường: <input {...field('title')} />
  const field = (key) => ({
    value: draft[key] ?? '',
    onChange: (e) => setDraft((d) => ({ ...d, [key]: e.target.value })),
  })

  return { draft, setDraft, dirty, busy, error, setError, save, field }
}
