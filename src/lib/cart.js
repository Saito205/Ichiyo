import { useMemo, useSyncExternalStore } from 'react'
import { products } from '../content.js'

// Giỏ hàng chỉ lưu danh sách slug sản phẩm (không có số lượng), giữ trong localStorage
// nên tải lại trang hoặc đóng trình duyệt vẫn còn.
const KEY = 'ichiyo-cart'
const listeners = new Set()
const known = new Set(products.map((p) => p.slug))

function read() {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY))
    return Array.isArray(value) ? [...new Set(value.filter((s) => typeof s === 'string'))] : []
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

export const addToCart = (slug) => {
  if (!items.includes(slug)) write([...items, slug])
}
export const removeFromCart = (slug) => {
  if (items.includes(slug)) write(items.filter((s) => s !== slug))
}
export const clearCart = () => {
  if (items.length) write([])
}

export function useCart() {
  const raw = useSyncExternalStore(subscribe, getSnapshot)
  // Bỏ những sản phẩm đã bị xóa khỏi cửa hàng.
  const slugs = useMemo(() => raw.filter((s) => known.has(s)), [raw])
  return {
    slugs,
    count: slugs.length,
    has: (slug) => slugs.includes(slug),
    add: addToCart,
    remove: removeFromCart,
    toggle: (slug) => (slugs.includes(slug) ? removeFromCart(slug) : addToCart(slug)),
    clear: clearCart,
  }
}
