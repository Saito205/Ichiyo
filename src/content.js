import { categoryFor, normalizeCatalog, slugify } from './lib/catalog.js'
import { normalizeGuide } from './lib/guide.js'
const siteFiles = import.meta.glob('/content/site.json', { eager: true })
const productFiles = import.meta.glob('/content/products/*.json', { eager: true })
const catalogFiles = import.meta.glob('/content/catalog.json', { eager: true })
const guideFiles = import.meta.glob('/content/guide.json', { eager: true })
export const site = Object.values(siteFiles)[0]?.default ?? {}
const rawProducts = Object.entries(productFiles).map(([path, mod]) => ({
  ...mod.default,
  slug: path
    .split('/')
    .pop()
    .replace(/\.json$/, ''),
}))
export const catalog = normalizeCatalog(Object.values(catalogFiles)[0]?.default, rawProducts)
export const categories = catalog.categories
// Phân loại cụ thể của sản phẩm: [{ id, label, price }]. Không có thì sản phẩm chỉ có 1 loại, 1 giá.
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
export const products = rawProducts.map((p) => {
  const category = categoryFor(p, categories)
  return {
    ...p,
    categoryId: category?.id || '',
    category: category?.name || p.category || '',
    variants: normalizeVariants(p.variants),
  }
})
export const guide = normalizeGuide(Object.values(guideFiles)[0]?.default)
export function asset(path) {
  if (!path) return ''
  if (/^(https?:|data:)/.test(path)) return path
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '')
}
export function paragraphs(text) {
  return (text || '')
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean)
}
export function parsePrice(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : 0
  if (typeof value === 'string') {
    const cleaned = value.trim()
    if (!cleaned) return 0
    const digits = cleaned.replace(/[^\d]/g, '')
    return digits ? Number(digits) : 0
  }
  return 0
}
export function formatPrice(value) {
  const num = parsePrice(value)
  if (num > 0) return `${num.toLocaleString('vi-VN')} ₫`
  if (typeof value === 'string' && value.trim()) return value.trim()
  return ''
}

export const hasVariants = (product) => (product?.variants?.length || 0) > 0
export const findVariant = (product, variantId) =>
  (product?.variants || []).find((v) => v.id === variantId) || null
// Giá (số) của một sản phẩm theo phân loại đã chọn; không có phân loại thì lấy giá chung.
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
