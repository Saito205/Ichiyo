import { asset } from '../../shared/content.js'

// Ảnh sản phẩm; chưa có ảnh thì hiện chữ "一" làm ảnh tạm.
export default function ProductImage({ src, alt = '', placeholderClass = 'card-empty', ...imgProps }) {
  if (src) return <img src={asset(src)} alt={alt} {...imgProps} />
  return (
    <span className={placeholderClass || undefined} aria-hidden="true">
      一
    </span>
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
