// Chỉ nhận màu HEX, không chèn CSS tùy ý từ dữ liệu quản trị.
export const themeFields = [
  { key: 'primary', css: '--green', label: 'Màu chủ đạo', group: 'Điểm nhấn', value: '#15804f' },
  { key: 'accent', css: '--leaf', label: 'Màu nhấn phụ', group: 'Điểm nhấn', value: '#1e9e63' },
  { key: 'primaryHover', css: '--primary-hover', label: 'Màu nút khi rê chuột', group: 'Điểm nhấn', value: '#0e3b2c' },
  { key: 'onPrimary', css: '--on-primary', label: 'Chữ trên nút màu', group: 'Điểm nhấn', value: '#ffffff' },
  { key: 'background', css: '--page-bg', label: 'Nền toàn trang', group: 'Nền & đường viền', value: '#ffffff' },
  { key: 'surface', css: '--white', label: 'Nền thẻ, ô nhập & hộp thoại', group: 'Nền & đường viền', value: '#ffffff' },
  { key: 'soft', css: '--mist', label: 'Nền các khu vực phụ', group: 'Nền & đường viền', value: '#f3faf6' },
  { key: 'tint', css: '--mint', label: 'Nền nhấn nhẹ', group: 'Nền & đường viền', value: '#e2f4ea' },
  { key: 'border', css: '--line', label: 'Đường viền', group: 'Nền & đường viền', value: '#d9eadf' },
  { key: 'heading', css: '--forest', label: 'Tiêu đề', group: 'Chữ', value: '#0e3b2c' },
  { key: 'text', css: '--text', label: 'Nội dung chính', group: 'Chữ', value: '#17302a' },
  { key: 'muted', css: '--muted', label: 'Nội dung phụ', group: 'Chữ', value: '#587064' },
  { key: 'header', css: '--header-bg', label: 'Nền thanh điều hướng', group: 'Đầu & cuối trang', value: '#ffffff' },
  { key: 'footer', css: '--footer-bg', label: 'Nền cuối trang', group: 'Đầu & cuối trang', value: '#0e3b2c' },
  { key: 'footerText', css: '--footer-text', label: 'Chữ cuối trang', group: 'Đầu & cuối trang', value: '#cfe6da' },
  { key: 'danger', css: '--danger', label: 'Màu lỗi & thao tác xóa', group: 'Trạng thái', value: '#b42318' },
  { key: 'dangerSoft', css: '--danger-soft', label: 'Nền thông báo lỗi', group: 'Trạng thái', value: '#fef3f2' },
  { key: 'onDanger', css: '--on-danger', label: 'Chữ trên nhãn đỏ', group: 'Trạng thái', value: '#ffffff' },
]
export const defaultTheme = Object.fromEntries(themeFields.map((f) => [f.key, f.value]))
export function normalizeHex(value) {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(v)) return v
  if (/^#[0-9a-f]{3}$/.test(v)) return '#' + [...v.slice(1)].map((c) => c + c).join('')
  return null
}
export function normalizeTheme(raw) {
  return Object.fromEntries(themeFields.map((f) => [f.key, normalizeHex(raw?.[f.key]) || f.value]))
}
export function validateTheme(raw) {
  for (const f of themeFields) {
    if (!normalizeHex(raw?.[f.key])) throw new Error(`${f.label}: nhập màu HEX hợp lệ, ví dụ #15804f hoặc #fff.`)
  }
  return normalizeTheme(raw)
}
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')
export function themeVariables(raw) {
  const theme = normalizeTheme(raw)
  const variables = Object.fromEntries(themeFields.map((f) => [f.css, theme[f.key]]))
  for (const key of ['primary', 'accent', 'surface', 'heading', 'onPrimary', 'footerText']) variables[`--${key}-rgb`] = rgb(theme[key])
  variables['--shadow'] = `0 18px 40px -18px rgba(${rgb(theme.heading)}, 0.28)`
  return variables
}
export const themePresets = [
  { name: 'Xanh Ichiyo', colors: defaultTheme },
  { name: 'Hồng', colors: { ...defaultTheme, primary: '#b33470', accent: '#d75593', primaryHover: '#81204f', heading: '#542239', text: '#442b37', muted: '#806471', soft: '#fff5f9', tint: '#fce0ed', border: '#edc8da', footer: '#542239', footerText: '#ffe6f2' } },
  { name: 'Xanh dương', colors: { ...defaultTheme, primary: '#2563eb', accent: '#3b82f6', primaryHover: '#1e40af', heading: '#172f60', text: '#23334e', muted: '#5f718e', soft: '#f3f7ff', tint: '#dbeafe', border: '#cbdcf7', footer: '#172f60', footerText: '#dbeafe' } },
  { name: 'Tím', colors: { ...defaultTheme, primary: '#7c3aed', accent: '#a168ef', primaryHover: '#5b21b6', heading: '#39215e', text: '#362d43', muted: '#796787', soft: '#faf5ff', tint: '#ede0ff', border: '#e0cfef', footer: '#39215e', footerText: '#efe1ff' } },
  { name: 'Tối', colors: { ...defaultTheme, primary: '#7dd3fc', accent: '#38bdf8', primaryHover: '#bae6fd', onPrimary: '#082f49', background: '#101827', surface: '#1e293b', soft: '#172235', tint: '#263c54', border: '#3b506b', heading: '#f1f5f9', text: '#e2e8f0', muted: '#a8b9cf', header: '#152033', footer: '#0b1220', footerText: '#cbd5e1', danger: '#fda4af', dangerSoft: '#421d2b', onDanger: '#450a0a' } },
]
// Gợi ý đọc chữ; không cấm bảng màu do admin tự chọn.
export function contrastRatio(a, b) {
  const lum = (hex) => {
    const channels = [1, 3, 5].map((i) => {
      const s = parseInt(hex.slice(i, i + 2), 16) / 255
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
  }
  const x = lum(a), y = lum(b)
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05)
}
