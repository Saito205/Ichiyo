import { PROXY_URL } from './config.js'

const KEY = 'ichiyo-admin-token'

export const getToken = () => {
  try { return localStorage.getItem(KEY) } catch { return null }
}
export const setToken = (t) => {
  try { localStorage.setItem(KEY, t) } catch { /* bỏ qua */ }
}
export const clearToken = () => {
  try { localStorage.removeItem(KEY) } catch { /* bỏ qua */ }
}

// Dùng đúng giao thức của decap-proxy: popup gửi "authorizing:github",
// trang này phản hồi lại, popup mới gửi token về.
export function login() {
  return new Promise((resolve, reject) => {
    const origin = new URL(PROXY_URL).origin
    const url = `${PROXY_URL}/auth?provider=github&site_id=${encodeURIComponent(location.hostname)}&scope=repo`
    const popup = window.open(url, 'ichiyo-login', 'width=600,height=720')
    if (!popup) return reject(new Error('Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép popup rồi thử lại.'))

    let finished = false
    const finish = (fn, value) => {
      if (finished) return
      finished = true
      window.removeEventListener('message', onMessage)
      clearInterval(timer)
      fn(value)
    }
    const onMessage = (e) => {
      if (e.origin !== origin || typeof e.data !== 'string') return
      if (e.data === 'authorizing:github') {
        e.source.postMessage(e.data, e.origin)
      } else if (e.data.startsWith('authorization:github:success:')) {
        try {
          const { token } = JSON.parse(e.data.slice('authorization:github:success:'.length))
          finish(resolve, token)
        } catch {
          finish(reject, new Error('Phản hồi đăng nhập không hợp lệ.'))
        }
      } else if (e.data.startsWith('authorization:github:error:')) {
        finish(reject, new Error('GitHub từ chối đăng nhập.'))
      }
    }
    window.addEventListener('message', onMessage)
    const timer = setInterval(() => {
      if (popup.closed) setTimeout(() => finish(reject, new Error('Bạn đã đóng cửa sổ đăng nhập.')), 800)
    }, 500)
  })
}
