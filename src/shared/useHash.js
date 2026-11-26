import { useSyncExternalStore } from 'react'

// Website dùng đường dẫn dạng "#/products" (chạy được trên GitHub Pages).
// Hook này trả về phần "#..." hiện tại và tự vẽ lại khi người dùng chuyển trang.
const subscribe = (callback) => {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
const getHash = () => window.location.hash

export default function useHash() {
  return useSyncExternalStore(subscribe, getHash)
}
