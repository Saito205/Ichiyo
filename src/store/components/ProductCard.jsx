import { hasVariants, priceRangeLabel } from '../../shared/price.js'
import { useCart } from '../cart.js'
import Icon from './Icon.jsx'
import ProductImage, { FeaturedBadge } from './ProductImage.jsx'
import QtyStepper from './QtyStepper.jsx'

// Nút giỏ hàng ở góc thẻ:
// - Sản phẩm có phân loại: mở cửa sổ chi tiết để khách chọn loại trước khi thêm.
// - Không phân loại: thêm ngay, sau đó đổi thành bộ chọn số lượng.
function CardCartButton({ product, onOpen }) {
  const { getQuantity, getProductQuantity, add, increment, decrement } = useCart()
  const { slug, title } = product

  if (hasVariants(product)) {
    const qty = getProductQuantity(slug)
    return (
      <button
        type="button"
        className={`card-cart ${qty > 0 ? 'on' : ''}`}
        aria-label={`Chọn phân loại ${title}${qty > 0 ? ` (đã có ${qty} trong giỏ)` : ''}`}
        title="Chọn phân loại"
        onClick={onOpen}
      >
        {qty > 0 ? <span className="card-cart-count">{qty}</span> : <Icon name="cart" size={20} />}
      </button>
    )
  }

  const qty = getQuantity(slug)
  if (qty > 0) {
    return (
      <QtyStepper
        variant="card"
        value={qty}
        label={`Số lượng ${title}`}
        onMinus={() => decrement(slug)}
        onPlus={() => increment(slug)}
        minus={{
          label: qty === 1 ? `Xóa ${title} khỏi giỏ` : `Giảm số lượng ${title}`,
          title: qty === 1 ? 'Xóa khỏi giỏ' : 'Giảm số lượng',
        }}
        plus={{ label: `Tăng số lượng ${title}`, title: 'Tăng số lượng' }}
      />
    )
  }
  return (
    <button
      type="button"
      className="card-cart"
      aria-label={`Thêm ${title} vào giỏ`}
      title="Thêm vào giỏ"
      onClick={() => add(slug, 1)}
    >
      <Icon name="cart" size={20} />
    </button>
  )
}

export default function ProductCard({ product, onOpen }) {
  const priceLabel = priceRangeLabel(product)
  return (
    <article className="card">
      <button
        type="button"
        className="card-open"
        onClick={onOpen}
        aria-label={`Xem chi tiết ${product.title}`}
      >
        <div className="card-media">
          <ProductImage src={product.cover} loading="lazy" />
          {product.featured && <FeaturedBadge />}
        </div>
        <div className="card-body">
          {product.category && <span className="card-cat">{product.category}</span>}
          <h3>{product.title}</h3>
          {priceLabel && <div className="card-price">{priceLabel}</div>}
          {product.summary && <p>{product.summary}</p>}
        </div>
      </button>
      <CardCartButton product={product} onOpen={onOpen} />
    </article>
  )
}
