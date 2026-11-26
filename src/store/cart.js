import { useMemo, useSyncExternalStore } from 'react'
import { products } from '../shared/content.js'
import { hasVariants } from '../shared/price.js'

// Giỏ hàng lưu danh sách { slug, variantId, quantity } trong localStorage.
// Cùng một sản phẩm nhưng khác phân loại sẽ là các dòng riêng.
// Tự động tương thích ngược với dữ liệu cũ (mảng slug, hoặc { slug, quantity }).
const KEY = 'ichiyo-cart'
const listeners = new Set()
const bySlug = new Map(products.map((p) => [p.slug, p]))
const same = (item, slug, variantId) => item.slug === slug && item.variantId === variantId

function normalize(raw) {
  if (!Array.isArray(raw)) return []
  const map = new Map()
  const put = (slug, variantId, quantity) => {
    const key = `${slug}::${variantId}`
    map.set(key, { slug, variantId, quantity: (map.get(key)?.quantity || 0) + quantity })
  }
  for (const entry of raw) {
    if (typeof entry === 'string') put(entry, '', 1)
    else if (entry && typeof entry.slug === 'string')
      put(entry.slug, String(entry.variantId || ''), Math.max(1, Math.floor(Number(entry.quantity) || 1)))
  }
  return Array.from(map.values())
}

function read() {
  try {
    return normalize(JSON.parse(window.localStorage.getItem(KEY)))
  } catch {
    return []
  }
}

let items = read()
const notify = () => listeners.forEach((listener) => listener())

function write(next) {
  items = next
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Trình duyệt chặn lưu trữ: giỏ vẫn hoạt động trong phiên hiện tại.
  }
  notify()
}

// Đồng bộ khi mở nhiều tab cùng lúc.
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    items = read()
    notify()
  }
})

const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const getSnapshot = () => items
const quantityOf = (slug, variantId) => items.find((i) => same(i, slug, variantId))?.quantity || 0

// Mọi thay đổi giỏ đều đi qua hàm này: số lượng <= 0 nghĩa là xóa dòng.
export function setCartQuantity(slug, qty, variantId = '') {
  const amount = Math.floor(Number(qty) || 0)
  const existing = items.find((i) => same(i, slug, variantId))
  if (amount <= 0) {
    if (existing) write(items.filter((i) => i !== existing))
  } else if (!existing) {
    write([...items, { slug, variantId, quantity: amount }])
  } else if (existing.quantity !== amount) {
    write(items.map((i) => (i === existing ? { ...i, quantity: amount } : i)))
  }
}

export const incrementCart = (slug, delta = 1, variantId = '') =>
  setCartQuantity(slug, quantityOf(slug, variantId) + delta, variantId)

export const addToCart = (slug, qty = 1, variantId = '') =>
  incrementCart(slug, Math.max(1, Math.floor(Number(qty) || 1)), variantId)

export const removeFromCart = (slug, variantId = '') => setCartQuantity(slug, 0, variantId)

export const clearCart = () => {
  if (items.length) write([])
}

// Dòng giỏ hợp lệ khi sản phẩm còn tồn tại và phân loại khớp với dữ liệu hiện tại.
function isValid(item) {
  const product = bySlug.get(item.slug)
  if (!product) return false
  if (!hasVariants(product)) return !item.variantId
  return product.variants.some((v) => v.id === item.variantId)
}

export function useCart() {
  const raw = useSyncExternalStore(subscribe, getSnapshot)
  // Bỏ những sản phẩm / phân loại đã bị xóa khỏi cửa hàng.
  const validItems = useMemo(() => raw.filter(isValid), [raw])
  const count = useMemo(() => validItems.reduce((sum, i) => sum + i.quantity, 0), [validItems])

  return {
    items: validItems,
    count,
    getQuantity: (slug, variantId = '') =>
      validItems.find((i) => same(i, slug, variantId))?.quantity || 0,
    // Tổng số lượng của một sản phẩm, cộng tất cả các phân loại.
    getProductQuantity: (slug) =>
      validItems.filter((i) => i.slug === slug).reduce((sum, i) => sum + i.quantity, 0),
    add: addToCart,
    increment: (slug, variantId = '') => incrementCart(slug, 1, variantId),
    decrement: (slug, variantId = '') => incrementCart(slug, -1, variantId),
    remove: removeFromCart,
    clear: clearCart,
  }
}
