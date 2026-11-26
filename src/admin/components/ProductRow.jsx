import { formatPrice, normalizeVariants, priceRangeLabel } from '../../shared/price.js'
import { previewSrc } from '../api/media.js'

// Giá hiển thị từ dữ liệu thô trong file JSON của sản phẩm.
const priceText = (data) =>
  data.variants?.length
    ? priceRangeLabel({ variants: normalizeVariants(data.variants) })
    : formatPrice(data.price)

// Một dòng sản phẩm (ảnh, tên, danh mục · giá, nhãn) dùng ở tab Sản phẩm và Tổng quan.
export default function ProductRow({ product, className, onClick, children }) {
  const { data } = product
  const price = priceText(data)
  return (
    <button type="button" className={className} onClick={onClick}>
      <span className="ad-item-img">
        {data.cover ? <img src={previewSrc(data.cover)} alt="" loading="lazy" /> : <span aria-hidden="true">一</span>}
      </span>
      <span className="ad-item-info">
        <strong>{data.title}</strong>
        <small>
          {data.category || 'Chưa có danh mục'}
          {price ? ` · ${price}` : ''}
        </small>
      </span>
      {data.variants?.length > 0 && <span className="ad-tag soft">{data.variants.length} phân loại</span>}
      {data.featured && <span className="ad-tag">Nổi bật</span>}
      {children}
    </button>
  )
}
