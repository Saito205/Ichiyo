import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { products, asset, paragraphs } from '../content.js'

export default function ProductDetail() {
  const { slug } = useParams()
  const product = products.find((p) => p.slug === slug)
  const [active, setActive] = useState(0)

  if (!product) {
    return (
      <div className="container py-5">
        <p>Không tìm thấy sản phẩm.</p>
        <Link to="/san-pham">← Quay lại danh sách</Link>
      </div>
    )
  }

  const images = [product.cover, ...(product.gallery ?? [])].filter(Boolean)

  return (
    <div className="container py-5">
      <Link to="/san-pham" className="d-inline-block mb-4">← Tất cả sản phẩm</Link>
      <div className="row g-5">
        <div className="col-lg-7">
          {images.length > 0 ? (
            <>
              <img src={asset(images[active])} alt={product.title} className="img-fluid rounded-4 w-100" />
              {images.length > 1 && (
                <div className="d-flex gap-2 mt-3 flex-wrap">
                  {images.map((img, i) => (
                    <button
                      key={img + i}
                      type="button"
                      className={`thumb-btn ${i === active ? 'active' : ''}`}
                      onClick={() => setActive(i)}
                    >
                      <img src={asset(img)} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="product-thumb-empty rounded-4" style={{ aspectRatio: '4/3' }}>
              <i className="bi bi-image" />
            </div>
          )}
        </div>

        <div className="col-lg-5">
          {product.category && <div className="product-cat">{product.category}</div>}
          <h1 className="h2">{product.title}</h1>
          {product.summary && <p className="lead text-muted">{product.summary}</p>}
          {paragraphs(product.description).map((t, i) => <p key={i}>{t}</p>)}
          {product.link && (
            <a href={product.link} target="_blank" rel="noreferrer" className="btn btn-outline-dark">
              Xem thêm <i className="bi bi-box-arrow-up-right ms-1" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
