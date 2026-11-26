import { useState } from 'react'
import { normalizeCatalog, planCatalogUpdate } from '../shared/catalog.js'
import { normalizeCurrency, validateCurrency } from '../shared/currency.js'
import { normalizeGuide } from '../shared/guide.js'
import { uniqueId } from '../shared/text.js'
import { REPO } from './api/config.js'
import * as gh from './api/github.js'
import { markUploaded, takeUploads } from './api/media.js'

const sortProducts = (list) =>
  [...list].sort(
    (a, b) => (a.data.order ?? 0) - (b.data.order ?? 0) || a.data.title.localeCompare(b.data.title),
  )
const productPath = (slug) => `content/products/${slug}.json`

// Tải toàn bộ nội dung đang có trên GitHub (bản mới nhất, kể cả khi web chưa build xong).
export async function loadData() {
  const [repo, me, list, site, rawCatalog, rawGuide, rawCurrency] = await Promise.all([
    gh.getRepo(),
    gh.getUser(),
    gh.loadProducts(),
    gh.loadSite(),
    gh.loadCatalog(),
    gh.loadGuide(),
    gh.loadCurrency(),
  ])
  if (!repo.permissions?.push) throw new Error(`Tài khoản này không có quyền ghi vào ${REPO}.`)
  return {
    me,
    products: sortProducts(list),
    site,
    catalog: normalizeCatalog(rawCatalog, list),
    guide: normalizeGuide(rawGuide),
    currency: normalizeCurrency(rawCurrency),
  }
}

// Commit các file JSON + ảnh mới chọn (nếu có) trong cùng một lần.
async function commit(message, files, imagePaths = []) {
  const uploads = takeUploads(imagePaths.filter(Boolean))
  await gh.commitFiles(message, [...uploads.map((u) => ({ path: `public${u.path}`, blob: u.blob })), ...files])
  markUploaded(uploads.map((u) => u.path))
}

// Các thao tác lưu của trang quản trị. Mỗi thao tác: commit lên GitHub → cập nhật dữ liệu
// trên màn hình → báo thành công. Chỉ cho chạy một thao tác lưu tại một thời điểm.
export function useAdminActions(data, setData, onSaved) {
  const [saving, setSaving] = useState(false)

  const write = (successMessage, action) => async (...args) => {
    if (saving) throw new Error('Đang lưu thay đổi khác. Vui lòng đợi một chút.')
    setSaving(true)
    try {
      await action(...args)
      onSaved(successMessage)
    } finally {
      setSaving(false)
    }
  }

  const saveProduct = write('Đã lưu sản phẩm.', async (slug, values) => {
    const existing = data.products.find((p) => p.slug === slug)
    const key = slug ?? uniqueId(values.title, data.products.map((p) => p.slug))
    const now = new Date().toISOString()
    const product = {
      ...existing?.data,
      ...values,
      createdAt: slug === null ? now : existing?.data.createdAt || '',
      updatedAt: now,
    }
    await commit(
      `${slug ? 'Cập nhật' : 'Thêm'} sản phẩm: ${product.title}`,
      [gh.jsonFile(productPath(key), product)],
      [product.cover, ...(product.gallery || [])],
    )
    setData((prev) => ({
      ...prev,
      products: sortProducts([...prev.products.filter((p) => p.slug !== key), { slug: key, data: product }]),
    }))
  })

  const deleteProduct = write('Đã xóa sản phẩm.', async (slug) => {
    const item = data.products.find((p) => p.slug === slug)
    await commit(`Xóa sản phẩm: ${item?.data.title ?? slug}`, [{ path: productPath(slug), remove: true }])
    setData((prev) => ({ ...prev, products: prev.products.filter((p) => p.slug !== slug) }))
  })

  const saveSite = write('Đã lưu cài đặt.', async (values) => {
    const site = { ...data.site, ...values, contact: { ...data.site.contact, ...values.contact } }
    await commit('Cập nhật cài đặt website', [gh.jsonFile('content/site.json', site)], [site.logo, site.heroImage])
    setData((prev) => ({ ...prev, site }))
  })

  // Đổi / xóa danh mục, bộ lọc có thể phải sửa cả các sản phẩm đang dùng chúng.
  const saveCatalog = write('Đã lưu danh mục và bộ lọc.', async (catalog) => {
    const { changedProducts } = planCatalogUpdate(data.catalog, catalog, data.products)
    await commit('Cập nhật danh mục và bộ lọc', [
      gh.jsonFile('content/catalog.json', catalog),
      ...changedProducts.map((p) => gh.jsonFile(productPath(p.slug), p.data)),
    ])
    const updates = new Map(changedProducts.map((p) => [p.slug, p]))
    setData((prev) => ({
      ...prev,
      catalog,
      products: prev.products.map((p) => updates.get(p.slug) || p),
    }))
  })

  const saveGuide = write('Đã lưu hướng dẫn.', async (guide) => {
    await commit('Cập nhật hướng dẫn mua hàng', [gh.jsonFile('content/guide.json', guide)])
    setData((prev) => ({ ...prev, guide }))
  })

  const saveCurrency = write('Đã lưu tiền tệ.', async (currency) => {
    validateCurrency(currency)
    await commit('Cập nhật tiền tệ và công thức quy đổi', [gh.jsonFile('content/currency.json', currency)])
    setData((prev) => ({ ...prev, currency }))
  })

  return { saving, saveProduct, deleteProduct, saveSite, saveCatalog, saveGuide, saveCurrency }
}
