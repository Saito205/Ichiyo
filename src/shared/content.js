// Nạp nội dung website từ thư mục content/ (đóng gói sẵn lúc build).
// Trang quản trị sửa các file này qua GitHub → website build lại → dữ liệu mới xuất hiện ở đây.
import { categoryFor, normalizeCatalog } from './catalog.js'
import { normalizeCurrency } from './currency.js'
import { normalizeGuide } from './guide.js'
import { normalizeVariants } from './price.js'

const first = (files) => Object.values(files)[0]?.default

const productFiles = import.meta.glob('/content/products/*.json', { eager: true })
const rawProducts = Object.entries(productFiles).map(([path, mod]) => ({
  ...mod.default,
  slug: path.split('/').pop().replace(/\.json$/, ''),
}))

export const site = first(import.meta.glob('/content/site.json', { eager: true })) ?? {}
export const catalog = normalizeCatalog(
  first(import.meta.glob('/content/catalog.json', { eager: true })),
  rawProducts,
)
export const categories = catalog.categories
export const guide = normalizeGuide(first(import.meta.glob('/content/guide.json', { eager: true })))
export const currency = normalizeCurrency(
  first(import.meta.glob('/content/currency.json', { eager: true })),
)

export const products = rawProducts.map((p) => {
  const category = categoryFor(p, categories)
  return {
    ...p,
    categoryId: category?.id || '',
    category: category?.name || p.category || '',
    variants: normalizeVariants(p.variants),
  }
})

// Đường dẫn ảnh trong content ("/uploads/a.webp") -> URL đúng khi web chạy trong thư mục con.
export function asset(path) {
  if (!path) return ''
  if (/^(https?:|data:)/.test(path)) return path
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '')
}
