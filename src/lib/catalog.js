export const PAGE_SIZE = 20
export function slugify(value) {
  return (
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'muc'
  )
}
export const searchText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
export function uniqueId(label, taken = []) {
  const base = slugify(label)
  let id = base
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`
  return id
}
export function categoryFor(product, categories) {
  return (
    categories.find((c) => product.categoryId && c.id === product.categoryId) ||
    categories.find((c) => c.name === product.category)
  )
}
// Tự nhận diện danh mục cũ khi dự án chưa có catalog.json.
export function normalizeCatalog(raw, products = []) {
  const categories = (Array.isArray(raw?.categories) ? raw.categories : []).map((c) => ({
    ...c,
    id: c.id || slugify(c.name),
    name: String(c.name || '').trim(),
    filters: (Array.isArray(c.filters) ? c.filters : []).map((f) => ({
      id: f.id || slugify(f.name),
      name: String(f.name || '').trim(),
      options: [...new Set((f.options || []).map((o) => String(o).trim()).filter(Boolean))],
    })),
  }))
  for (const product of products) {
    const p = product.data || product
    if (!p.category || categoryFor(p, categories)) continue
    categories.push({
      id:
        p.categoryId ||
        uniqueId(
          p.category,
          categories.map((c) => c.id),
        ),
      name: p.category,
      filters: [],
    })
  }
  return { categories }
}
export function cleanAttributes(attributes = {}, category) {
  return Object.fromEntries(
    (category?.filters || [])
      .filter((f) => f.options.includes(attributes[f.id]))
      .map((f) => [f.id, attributes[f.id]]),
  )
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
    const names = new Set()
    const filterIds = new Set()
    for (const f of c.filters) {
      if (!f.name.trim()) throw new Error(`Hãy nhập tên bộ lọc trong "${c.name}".`)
      if (names.has(searchText(f.name)) || filterIds.has(f.id))
        throw new Error(`Bộ lọc trong "${c.name}" bị trùng.`)
      names.add(searchText(f.name))
      filterIds.add(f.id)
      if (!f.options.length) throw new Error(`Bộ lọc "${f.name}" cần ít nhất một lựa chọn.`)
      if (new Set(f.options.map(searchText)).size !== f.options.length)
        throw new Error(`Lựa chọn của "${f.name}" bị trùng.`)
    }
  }
}
export function planCatalogUpdate(previous, next, products) {
  validateCatalog(next)
  let clearedValues = 0
  const changedProducts = []
  for (const product of products) {
    const oldCategory = categoryFor(product.data, previous.categories)
    if (!oldCategory) continue
    const category = next.categories.find((c) => c.id === oldCategory.id)
    if (!category)
      throw new Error(
        `Danh mục "${oldCategory.name}" còn sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước khi xóa.`,
      )
    const attributes = cleanAttributes(product.data.attributes, category)
    clearedValues += Object.keys(product.data.attributes || {}).filter(
      (key) => product.data.attributes[key] && !(key in attributes),
    ).length
    const data = { ...product.data, categoryId: category.id, category: category.name, attributes }
    if (JSON.stringify(data) !== JSON.stringify(product.data))
      changedProducts.push({ ...product, data })
  }
  return { changedProducts, clearedValues }
}
const timestamp = (p) => Date.parse(p.createdAt) || 0
export function newestFirst(a, b) {
  return (
    timestamp(b) - timestamp(a) ||
    (Number(a.order) || 0) - (Number(b.order) || 0) ||
    String(a.title).localeCompare(String(b.title), 'vi')
  )
}
export function homeProducts(products) {
  return [...products]
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || newestFirst(a, b))
    .slice(0, 10)
}
export function filterProducts(
  products,
  { query = '', categoryId = '', attributes = {} } = {},
  categories = [],
) {
  const keyword = searchText(query)
  const category = categories.find((c) => c.id === categoryId)
  return products
    .filter((p) => {
      if (categoryId && categoryFor(p, categories)?.id !== categoryId) return false
      if (
        keyword &&
        !searchText(`${p.title} ${p.summary || ''} ${p.category || ''}`).includes(keyword)
      )
        return false
      return (
        !category ||
        category.filters.every(
          (f) => !attributes[f.id] || p.attributes?.[f.id] === attributes[f.id],
        )
      )
    })
    .sort(newestFirst)
}
export function paginate(items, page, size = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(1, page), pageCount)
  return { items: items.slice((current - 1) * size, current * size), current, pageCount }
}
