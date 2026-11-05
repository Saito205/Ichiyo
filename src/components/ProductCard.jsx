import { asset } from '../content.js'
import { useCart } from '../lib/cart.js'
import Icon from './Icon.jsx'

export default function ProductCard({ product, onOpen }) {
  const { has, toggle } = useCart()
  const inCart = has(product.slug)

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
          {product.summary && <p>{product.summary}</p>}
        </div>
      </button>
      <button
        type="button"
        className={`card-cart ${inCart ? 'on' : ''}`}
        aria-pressed={inCart}
        aria-label={inCart ? `Xóa ${product.title} khỏi giỏ` : `Thêm ${product.title} vào giỏ`}
        title={inCart ? 'Đã trong giỏ — bấm để xóa' : 'Thêm vào giỏ'}
        onClick={() => toggle(product.slug)}
      >
        <Icon name={inCart ? 'check' : 'cart'} size={20} />
      </button>
    </article>
  )
}
