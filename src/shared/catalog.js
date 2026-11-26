// Danh mục và các hàm lọc / sắp xếp / phân trang sản phẩm.
import { isFullySoldOut, lowestPrice } from './price.js'
import { searchText, slugify, uniqueId } from './text.js'

export const PAGE_SIZE = 20

// Danh mục của sản phẩm: ưu tiên theo mã, sau đó theo tên (dữ liệu cũ chỉ có tên).
export function categoryFor(product, categories) {
  return (
    categories.find((c) => product.categoryId && c.id === product.categoryId) ||
    categories.find((c) => c.name === product.category)
  )
}
// Tự nhận diện danh mục cũ khi dự án chưa có catalog.json.
export function normalizeCatalog(raw, products = []) {
  const categories = (Array.isArray(raw?.categories) ? raw.categories : []).map((c) => ({
    id: c.id || slugify(c.name),
    name: String(c.name || '').trim(),
  }))
  for (const product of products) {
    const p = product.data || product
    if (!p.category || categoryFor(p, categories)) continue
    categories.push({
      id: p.categoryId || uniqueId(p.category, categories.map((c) => c.id)),
      name: p.category,
    })
  }
  return { categories }
}
export function validateCatalog(catalog) {
  const seen = new Set()
  const ids = new Set()
  for (const c of catalog.categories) {
    if (!c.name.trim()) throw new Error('Hãy nhập tên cho tất cả danh mục.')
    if (seen.has(searchText(c.name))) throw new Error(`Tên danh mục "${c.name}" bị trùng.`)
    if (!c.id || ids.has(c.id)) throw new Error('Mã danh mục bị trùng. Hãy tạo lại danh mục mới.')
    seen.add(searchText(c.name))
    ids.add(c.id)
  }
}
// Kiểm tra danh mục mới và tìm các sản phẩm cần sửa theo (khi đổi tên danh mục).
export function planCatalogUpdate(previous, next, products) {
  validateCatalog(next)
  const changedProducts = []
  for (const product of products) {
    const oldCategory = categoryFor(product.data, previous.categories)
    if (!oldCategory) continue
    const category = next.categories.find((c) => c.id === oldCategory.id)
    if (!category)
      throw new Error(
        `Danh mục "${oldCategory.name}" còn sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước khi xóa.`,
      )
    const data = { ...product.data, categoryId: category.id, category: category.name }
    if (JSON.stringify(data) !== JSON.stringify(product.data))
      changedProducts.push({ ...product, data })
  }
  return { changedProducts }
}
const timestamp = (p) => Date.parse(p.createdAt) || 0
export function newestFirst(a, b) {
  return (
    timestamp(b) - timestamp(a) ||
    (Number(a.order) || 0) - (Number(b.order) || 0) ||
    String(a.title).localeCompare(String(b.title), 'vi')
  )
}
// Món hết hàng luôn xếp sau món còn hàng.
const inStockFirst = (a, b) => Number(isFullySoldOut(a)) - Number(isFullySoldOut(b))

// Các cách sắp xếp trên trang Sản phẩm. Sản phẩm không có giá (Liên hệ) luôn nằm cuối khi xếp theo giá.
export const SORTS = [
  ['newest', 'Mới nhất'],
  ['price-asc', 'Giá thấp → cao'],
  ['price-desc', 'Giá cao → thấp'],
  ['name', 'Tên A → Z'],
]
const byPrice = (dir) => (a, b) => {
  const x = lowestPrice(a)
  const y = lowestPrice(b)
  if (x === null || y === null) return (x === null) - (y === null)
  return (x - y) * dir
}
const sorters = {
  newest: newestFirst,
  'price-asc': byPrice(1),
  'price-desc': byPrice(-1),
  name: (a, b) => String(a.title).localeCompare(String(b.title), 'vi'),
}

export function homeProducts(products) {
  return [...products]
    .sort((a, b) => inStockFirst(a, b) || Number(!!b.featured) - Number(!!a.featured) || newestFirst(a, b))
    .slice(0, 10)
}
export function filterProducts(
  products,
  { query = '', categoryId = '', sort = 'newest' } = {},
  categories = [],
) {
  const keyword = searchText(query)
  return products
    .filter(
      (p) =>
        (!categoryId || categoryFor(p, categories)?.id === categoryId) &&
        (!keyword || searchText(`${p.title} ${p.summary || ''} ${p.category || ''}`).includes(keyword)),
    )
    .sort((a, b) => inStockFirst(a, b) || (sorters[sort] || newestFirst)(a, b) || newestFirst(a, b))
}
export function paginate(items, page, size = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(1, page), pageCount)
  return { items: items.slice((current - 1) * size, current * size), current, pageCount }
}
