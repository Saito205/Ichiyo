import { asset } from '../content.js'

const MAX_SIDE = 1600
const previews = new Map() // đường dẫn -> blob URL (xem tạm tới khi web build xong)
const queue = new Map() // đường dẫn -> blob chờ tải lên khi bấm Lưu

export const previewSrc = (path) => previews.get(path) || asset(path)

export function slugify(s) {
  return (
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'muc'
  )
}

async function shrink(file) {
  if (!file.type.startsWith('image/')) throw new Error('Chỉ nhận file ảnh.')
  if (file.type === 'image/svg+xml') return { blob: file, ext: 'svg' }
  if (file.type === 'image/gif') return { blob: file, ext: 'gif' }
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Không đọc được ảnh này. Hãy dùng JPG, PNG hoặc WebP.')
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86))
  return blob ? { blob, ext: 'webp' } : { blob: file, ext: file.type.split('/')[1] || 'jpg' }
}

// Nén + đặt tên, chưa tải lên GitHub. Trả về đường dẫn dạng "/uploads/xxx.webp".
export async function addImage(file) {
  const { blob, ext } = await shrink(file)
  const base = slugify(file.name.replace(/\.[^.]+$/, '')).slice(0, 40)
  const path = `/uploads/${base}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  previews.set(path, URL.createObjectURL(blob))
  queue.set(path, blob)
  return path
}

export const takeUploads = (paths) =>
  [...new Set(paths)].filter((p) => queue.has(p)).map((p) => ({ path: p, blob: queue.get(p) }))

export const markUploaded = (paths) => paths.forEach((p) => queue.delete(p))
