import { useEffect, useRef } from 'react'

// Mở thẻ <dialog> dạng modal ngay khi hiện ra và khóa cuộn trang phía sau.
// Trả về ref để gắn vào <dialog ref={...}>.
export default function useModalDialog() {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])
  return ref
}
