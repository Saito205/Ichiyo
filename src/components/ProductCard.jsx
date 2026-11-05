import { asset, formatPrice } from '../content.js'
import { useCart } from '../lib/cart.js'
import Icon from './Icon.jsx'

export default function ProductCard({ product, onOpen }) {
  const { getQuantity, add, increment, decrement } = useCart()
  const qty = getQuantity(product.slug)
  const inCart = qty > 0
  const priceLabel = formatPrice(product.price)

  return (
    <article className="card">
      <button
        type="button"
        className="card-open"
        onClick={onOpen}
        aria-label={`Xem chi tiết ${product.title}`}
      >
        <div className="card-media">
          {product.cover ? (
            <img src={asset(product.cover)} alt="" loading="lazy" />
          ) : (
            <span className="card-empty" aria-hidden="true">一</span>
          )}
          {product.featured && (
            <span className="badge">
              <span className="dot" />
              Nổi bật
            </span>
          )}
        </div>
        <div className="card-body">
          {product.category && <span className="card-cat">{product.category}</span>}
          <h3>{product.title}</h3>
          {priceLabel && <div className="card-price">{priceLabel}</div>}
          {product.summary && <p>{product.summary}</p>}
        </div>
      </button>

      {inCart ? (
        <div className="card-qty" role="group" aria-label={`Số lượng ${product.title}`}>
          <button
            type="button"
            className="card-qty-btn"
            aria-label={qty === 1 ? `Xóa ${product.title} khỏi giỏ` : `Giảm số lượng ${product.title}`}
            title={qty === 1 ? 'Xóa khỏi giỏ' : 'Giảm số lượng'}
            onClick={() => decrement(product.slug)}
          >
            <Icon name="minus" size={16} />
          </button>
          <span className="card-qty-value" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            className="card-qty-btn"
            aria-label={`Tăng số lượng ${product.title}`}
            title="Tăng số lượng"
            onClick={() => increment(product.slug)}
          >
            <Icon name="plus" size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="card-cart"
          aria-label={`Thêm ${product.title} vào giỏ`}
          title="Thêm vào giỏ"
          onClick={() => add(product.slug, 1)}
        >
          <Icon name="cart" size={20} />
        </button>
      )}
    </article>
  )
}
