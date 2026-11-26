// Ảnh tải lên từ trang quản trị: nén về WebP (tối đa 1600px) rồi giữ trong hàng chờ,
// tới khi bấm Lưu mới được đưa vào commit cùng file JSON.
import { asset } from '../../shared/content.js'
import { slugify } from '../../shared/text.js'

const MAX_SIDE = 1600
const previews = new Map() // đường dẫn -> blob URL (xem tạm tới khi web build xong)
const queue = new Map() // đường dẫn -> blob chờ tải lên khi bấm Lưu

export const previewSrc = (path) => previews.get(path) || asset(path)

// Chỉ những định dạng này mới được giữ nguyên file gốc khi trình duyệt không nén được.
const SAFE_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

// Đọc ảnh thành thứ vẽ được lên canvas. SVG có thể chứa mã script nên không bao giờ
// được lưu nguyên bản: nó được vẽ lại thành ảnh thường như mọi ảnh khác.
async function loadDrawable(file) {
  if (file.type === 'image/svg+xml') {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.src = url
    try {
      await img.decode()
    } finally {
      URL.revokeObjectURL(url)
    }
    const width = img.naturalWidth || 1024
    const height = img.naturalHeight || 1024
    // SVG không có kích thước cố định: phóng tới cạnh dài 1600px cho nét.
    const scale = MAX_SIDE / Math.max(width, height)
    return { source: img, width: width * scale, height: height * scale }
  }
  const bitmap = await createImageBitmap(file)
  return { source: bitmap, width: bitmap.width, height: bitmap.height }
}

async function shrink(file) {
  if (!file.type.startsWith('image/')) throw new Error('Chỉ nhận file ảnh.')
  if (file.type === 'image/gif') return { blob: file, ext: 'gif' } // giữ ảnh động
  let image
  try {
    image = await loadDrawable(file)
  } catch {
    throw new Error('Không đọc được ảnh này. Hãy dùng JPG, PNG, WebP hoặc SVG.')
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  canvas.getContext('2d').drawImage(image.source, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86))
  if (blob) return { blob, ext: 'webp' }
  if (SAFE_EXT[file.type]) return { blob: file, ext: SAFE_EXT[file.type] }
  throw new Error('Không nén được ảnh này. Hãy dùng JPG, PNG hoặc WebP.')
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
