import { useMemo, useSyncExternalStore } from 'react'
import { products } from '../content.js'

// Giỏ hàng lưu danh sách { slug, quantity } trong localStorage
// và tự động tương thích ngược với dữ liệu mảng slug cũ.
const KEY = 'ichiyo-cart'
const listeners = new Set()
const known = new Set(products.map((p) => p.slug))

function normalize(raw) {
  if (!Array.isArray(raw)) return []
  const map = new Map()
  for (const entry of raw) {
    if (typeof entry === 'string') {
      map.set(entry, (map.get(entry) || 0) + 1)
    } else if (entry && typeof entry.slug === 'string') {
      const q = Math.max(1, Math.floor(Number(entry.quantity) || 1))
      map.set(entry.slug, (map.get(entry.slug) || 0) + q)
    }
  }
  return Array.from(map, ([slug, quantity]) => ({ slug, quantity }))
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

export const addToCart = (slug, qty = 1) => {
  const amount = Math.max(1, Math.floor(Number(qty) || 1))
  const existing = items.find((i) => i.slug === slug)
  if (existing) {
    write(items.map((i) => (i.slug === slug ? { ...i, quantity: i.quantity + amount } : i)))
  } else {
    write([...items, { slug, quantity: amount }])
  }
}

export const setCartQuantity = (slug, qty) => {
  const amount = Math.floor(Number(qty) || 0)
  if (amount <= 0) {
    removeFromCart(slug)
    return
  }
  const existing = items.find((i) => i.slug === slug)
  if (existing) {
    if (existing.quantity !== amount) {
      write(items.map((i) => (i.slug === slug ? { ...i, quantity: amount } : i)))
    }
  } else {
    write([...items, { slug, quantity: amount }])
  }
}

export const incrementCart = (slug, delta = 1) => {
  const existing = items.find((i) => i.slug === slug)
  const current = existing ? existing.quantity : 0
  setCartQuantity(slug, current + delta)
}

export const removeFromCart = (slug) => {
  if (items.some((i) => i.slug === slug)) {
    write(items.filter((i) => i.slug !== slug))
  }
}

export const clearCart = () => {
  if (items.length) write([])
}

export function useCart() {
  const raw = useSyncExternalStore(subscribe, getSnapshot)
  // Bỏ những sản phẩm đã bị xóa khỏi cửa hàng.
  const validItems = useMemo(() => raw.filter((i) => known.has(i.slug)), [raw])
  const slugs = useMemo(() => validItems.map((i) => i.slug), [validItems])
  const totalQuantity = useMemo(
    () => validItems.reduce((sum, i) => sum + i.quantity, 0),
    [validItems],
  )

  return {
    items: validItems,
    slugs,
    count: totalQuantity,
    itemCount: validItems.length,
    has: (slug) => validItems.some((i) => i.slug === slug),
    getQuantity: (slug) => validItems.find((i) => i.slug === slug)?.quantity || 0,
    add: addToCart,
    setQuantity: setCartQuantity,
    increment: (slug) => incrementCart(slug, 1),
    decrement: (slug) => incrementCart(slug, -1),
    remove: removeFromCart,
    toggle: (slug) => (slugs.includes(slug) ? removeFromCart(slug) : addToCart(slug, 1)),
    clear: clearCart,
  }
}
