import { asset } from '../../shared/content.js'

// Ảnh thu nhỏ (rộng ~640px) được tạo tự động lúc build cho mọi ảnh trong public/uploads
// (xem scripts/content-assets.js): "/uploads/a.webp" -> "generated/thumbs/a.webp".
const thumbOf = (path) =>
  /^\/?uploads\/[^/]+\.(webp|jpe?g|png)$/i.test(path || '')
    ? `generated/thumbs/${path.split('/').pop().replace(/\.[^.]+$/, '')}.webp`
    : path

// Ảnh sản phẩm; chưa có ảnh thì hiện chữ "一" làm ảnh tạm.
// thumb: dùng ảnh thu nhỏ cho nhẹ; nếu ảnh thu nhỏ chưa có thì tự quay về ảnh gốc.
export default function ProductImage({ src, alt = '', placeholderClass = 'card-empty', thumb = false, ...imgProps }) {
  if (!src) {
    return (
      <span className={placeholderClass || undefined} aria-hidden="true">
        一
      </span>
    )
  }
  const full = asset(src)
  const small = thumb ? asset(thumbOf(src)) : full
  return (
    <img
      src={small}
      alt={alt}
      onError={(e) => {
        if (small !== full && !e.currentTarget.dataset.fallback) {
          e.currentTarget.dataset.fallback = '1'
          e.currentTarget.src = full
        }
      }}
      {...imgProps}
    />
  )
}

export function FeaturedBadge() {
  return (
    <span className="badge">
      <span className="dot" />
      Nổi bật
    </span>
  )
}

export function SoldOutBadge() {
  return <span className="badge badge-sold-out">Hết hàng</span>
}
