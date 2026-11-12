import { useEffect, useState } from 'react'
import { normalizeTheme, themeVariables } from './theme.js'

export default function useStorefrontTheme(publishedTheme) {
  const [preview, setPreview] = useState(null)
  useEffect(() => {
    // Chỉ iframe xem thử do admin cùng website mở mới được nhận bảng màu nháp.
    if (window.parent === window || new URLSearchParams(window.location.search).get('theme-preview') !== '1') return
    const receive = (event) => {
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== 'ichiyo-theme-preview') return
      setPreview(normalizeTheme(event.data.theme))
    }
    window.addEventListener('message', receive)
    window.parent.postMessage({ type: 'ichiyo-theme-ready' }, window.location.origin)
    return () => window.removeEventListener('message', receive)
  }, [])
  return themeVariables(preview || publishedTheme)
}
