import { slugify } from './text.js'

// Giá có thể là số (45000) hoặc chuỗi ("45.000", "Liên hệ"). Trả về số > 0, hoặc 0 nếu không có giá.
export function parsePrice(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : 0
  if (typeof value === 'string') {
    const digits = value.trim().replace(/[^\d]/g, '')
    return digits ? Number(digits) : 0
  }
  return 0
}

// "45000" -> "45.000 ₫". Chuỗi chữ (ví dụ "Liên hệ") được giữ nguyên.
export function formatPrice(value) {
  const num = parsePrice(value)
  if (num > 0) return `${num.toLocaleString('vi-VN')} ₫`
  if (typeof value === 'string' && value.trim()) return value.trim()
  return ''
}

// Phân loại của sản phẩm: [{ id, label, price }]. Không có thì sản phẩm chỉ có 1 loại, 1 giá.
export function normalizeVariants(raw) {
  const taken = new Set()
  return (Array.isArray(raw) ? raw : [])
    .map((v) => ({ id: String(v?.id || '').trim(), label: String(v?.label || '').trim(), price: v?.price }))
    .filter((v) => v.label)
    .map((v) => {
      const base = v.id || slugify(v.label)
      let id = base
      for (let n = 2; taken.has(id); n++) id = `${base}-${n}`
      taken.add(id)
      return { id, label: v.label, price: parsePrice(v.price) }
    })
}

export const hasVariants = (product) => (product?.variants?.length || 0) > 0

export const findVariant = (product, variantId) =>
  (product?.variants || []).find((v) => v.id === variantId) || null

// Giá (số) theo phân loại đã chọn; không có phân loại thì lấy giá chung.
export function unitPriceOf(product, variantId = '') {
  if (!hasVariants(product)) return parsePrice(product?.price)
  return findVariant(product, variantId)?.price || 0
}

// Giá hiển thị trên thẻ: "25.000 ₫ – 50.000 ₫" khi các loại có giá khác nhau.
export function priceRangeLabel(product) {
  if (!hasVariants(product)) return formatPrice(product?.price)
  const prices = product.variants.map((v) => v.price).filter((n) => n > 0)
  if (!prices.length) return ''
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`
}
