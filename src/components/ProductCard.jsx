import { asset } from '../content.js'

export default function ProductCard({ product, onOpen }) {
  return (
    <button type="button" className="card" onClick={onOpen} aria-label={`Xem chi tiết ${product.title}`}>
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
  )
}
