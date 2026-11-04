import { Link } from 'react-router-dom'
import { asset } from '../content.js'

export default function ProductCard({ product }) {
  return (
    <Link to={`/san-pham/${product.slug}`} className="product-card">
      <div className="product-thumb">
        {product.cover ? (
          <img src={asset(product.cover)} alt={product.title} loading="lazy" />
        ) : (
          <div className="product-thumb-empty"><i className="bi bi-image" /></div>
        )}
      </div>
      <div className="p-3">
        {product.category && <div className="product-cat">{product.category}</div>}
        <h3 className="h5 mb-1">{product.title}</h3>
        {product.summary && <p className="mb-0 text-muted small">{product.summary}</p>}
      </div>
    </Link>
  )
}
