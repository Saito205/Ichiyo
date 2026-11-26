import { PROXY_URL } from './config.js'

// Token GitHub chỉ được giữ trong phiên (sessionStorage): đóng tab là tự đăng xuất,
// giảm rủi ro nếu máy dùng chung hoặc trình duyệt bị đọc trộm dữ liệu.
const KEY = 'ichiyo-admin-token'

export const getToken = () => {
  try {
    localStorage.removeItem(KEY) // dọn token cũ từng lưu vĩnh viễn ở phiên bản trước
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}
export const setToken = (t) => {
  try {
    sessionStorage.setItem(KEY, t)
  } catch {
    /* bỏ qua */
  }
}
export const clearToken = () => {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* bỏ qua */
  }
}

const SUCCESS = 'authorization:github:success:'
const ERROR = 'authorization:github:error:'

// Giao thức của decap-proxy: popup gửi "authorizing:github", trang này trả lời lại,
// popup mới gửi token về. Chỉ nhận tin nhắn đến từ đúng địa chỉ của Worker đăng nhập.
export function login() {
  return new Promise((resolve, reject) => {
    const origin = new URL(PROXY_URL).origin
    const url = `${PROXY_URL}/auth?provider=github&site_id=${encodeURIComponent(location.hostname)}`
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
      if (e.origin !== origin || e.source !== popup || typeof e.data !== 'string') return
      if (e.data === 'authorizing:github') {
        e.source.postMessage(e.data, e.origin)
      } else if (e.data.startsWith(SUCCESS)) {
        try {
          const { token } = JSON.parse(e.data.slice(SUCCESS.length))
          if (!token) throw new Error()
          finish(resolve, token)
        } catch {
          finish(reject, new Error('Phản hồi đăng nhập không hợp lệ.'))
        }
      } else if (e.data.startsWith(ERROR)) {
        finish(reject, new Error('GitHub từ chối đăng nhập.'))
      }
    }
    window.addEventListener('message', onMessage)
    const timer = setInterval(() => {
      if (popup.closed) setTimeout(() => finish(reject, new Error('Bạn đã đóng cửa sổ đăng nhập.')), 800)
    }, 500)
  })
}
