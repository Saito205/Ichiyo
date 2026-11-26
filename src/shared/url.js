// Chỉ chấp nhận liên kết web http(s). Các dạng khác (javascript:, data:, …) bị bỏ qua
// để nội dung nhập từ trang quản trị không thể chèn mã chạy trên website.
export function safeUrl(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  try {
    const url = new URL(text)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch {
    return ''
  }
}

// Dùng khi lưu ở trang quản trị: rỗng thì cho qua, sai thì báo lỗi rõ ràng.
export function checkUrl(value, label) {
  if (String(value || '').trim() && !safeUrl(value))
    throw new Error(`${label}: hãy nhập liên kết đầy đủ, bắt đầu bằng https://`)
  return String(value || '').trim()
}
