// Đọc nội dung từ thư mục /content (do Decap CMS ghi vào) ngay lúc build.
const siteFiles = import.meta.glob('/content/site.json', { eager: true })
const productFiles = import.meta.glob('/content/products/*.json', { eager: true })

export const site = Object.values(siteFiles)[0]?.default ?? {}

export const products = Object.entries(productFiles)
  .map(([path, mod]) => ({
    slug: path.split('/').pop().replace(/\.json$/, ''),
    ...mod.default,
  }))
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title))

export const categories = [...new Set(products.map((p) => p.category).filter(Boolean))]

// Ảnh upload qua CMS có dạng "/uploads/abc.jpg" -> thêm base để chạy được ở thư mục con.
export function asset(path) {
  if (!path) return ''
  if (/^(https?:|data:)/.test(path)) return path
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '')
}

export function paragraphs(text) {
  return (text || '').split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean)
}
