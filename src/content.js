import { categoryFor, normalizeCatalog } from './lib/catalog.js'
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
export const products = rawProducts.map((p) => {
  const category = categoryFor(p, categories)
  return { ...p, categoryId: category?.id || '', category: category?.name || p.category || '' }
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
