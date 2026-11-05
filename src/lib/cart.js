import { useMemo, useSyncExternalStore } from 'react'
import { products, hasVariants } from '../content.js'

// Giỏ hàng lưu danh sách { slug, variantId, quantity } trong localStorage.
// Cùng một sản phẩm nhưng khác phân loại sẽ là các dòng riêng.
// Tự động tương thích ngược với dữ liệu cũ (mảng slug, hoặc { slug, quantity }).
const KEY = 'ichiyo-cart'
const listeners = new Set()
const bySlug = new Map(products.map((p) => [p.slug, p]))
const keyOf = (slug, variantId = '') => `${slug}::${variantId}`

function normalize(raw) {
  if (!Array.isArray(raw)) return []
  const map = new Map()
  const put = (slug, variantId, quantity) => {
    const k = keyOf(slug, variantId)
    const current = map.get(k)
    map.set(k, { slug, variantId, quantity: (current?.quantity || 0) + quantity })
  }
  for (const entry of raw) {
    if (typeof entry === 'string') {
      put(entry, '', 1)
    } else if (entry && typeof entry.slug === 'string') {
      const q = Math.max(1, Math.floor(Number(entry.quantity) || 1))
      put(entry.slug, String(entry.variantId || ''), q)
    }
  }
  return Array.from(map.values())
}

function read() {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY))
    return normalize(value)
  } catch {
    return []
  }
}

let items = read()

function write(next) {
  items = next
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Trình duyệt chặn lưu trữ: giỏ vẫn hoạt động trong phiên hiện tại.
  }
  listeners.forEach((listener) => listener())
}

// Đồng bộ khi mở nhiều tab cùng lúc.
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    items = read()
    listeners.forEach((listener) => listener())
  }
})

const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const getSnapshot = () => items

const same = (i, slug, variantId) => i.slug === slug && i.variantId === variantId

export const addToCart = (slug, qty = 1, variantId = '') => {
  const amount = Math.max(1, Math.floor(Number(qty) || 1))
  if (items.some((i) => same(i, slug, variantId))) {
    write(items.map((i) => (same(i, slug, variantId) ? { ...i, quantity: i.quantity + amount } : i)))
  } else {
    write([...items, { slug, variantId, quantity: amount }])
  }
}

export const removeFromCart = (slug, variantId = '') => {
  if (items.some((i) => same(i, slug, variantId))) {
    write(items.filter((i) => !same(i, slug, variantId)))
  }
}

export const setCartQuantity = (slug, qty, variantId = '') => {
  const amount = Math.floor(Number(qty) || 0)
  if (amount <= 0) {
    removeFromCart(slug, variantId)
    return
  }
  const existing = items.find((i) => same(i, slug, variantId))
  if (existing) {
    if (existing.quantity !== amount) {
      write(items.map((i) => (same(i, slug, variantId) ? { ...i, quantity: amount } : i)))
    }
  } else {
    write([...items, { slug, variantId, quantity: amount }])
  }
}

export const incrementCart = (slug, delta = 1, variantId = '') => {
  const existing = items.find((i) => same(i, slug, variantId))
  setCartQuantity(slug, (existing ? existing.quantity : 0) + delta, variantId)
}

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
  const slugs = useMemo(() => [...new Set(validItems.map((i) => i.slug))], [validItems])
  const totalQuantity = useMemo(
    () => validItems.reduce((sum, i) => sum + i.quantity, 0),
    [validItems],
  )

  return {
    items: validItems,
    slugs,
    count: totalQuantity,
    itemCount: validItems.length,
    has: (slug, variantId = '') => validItems.some((i) => same(i, slug, variantId)),
    getQuantity: (slug, variantId = '') =>
      validItems.find((i) => same(i, slug, variantId))?.quantity || 0,
    // Tổng số lượng của một sản phẩm, cộng tất cả các phân loại.
    getProductQuantity: (slug) =>
      validItems.filter((i) => i.slug === slug).reduce((sum, i) => sum + i.quantity, 0),
    add: addToCart,
    setQuantity: setCartQuantity,
    increment: (slug, variantId = '') => incrementCart(slug, 1, variantId),
    decrement: (slug, variantId = '') => incrementCart(slug, -1, variantId),
    remove: removeFromCart,
    toggle: (slug, variantId = '') =>
      validItems.some((i) => same(i, slug, variantId))
        ? removeFromCart(slug, variantId)
        : addToCart(slug, 1, variantId),
    clear: clearCart,
  }
}
