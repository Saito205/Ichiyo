import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { site, products, asset } from '../content.js'

export default function Home() {
  const featured = products.filter((p) => p.featured)
  const list = (featured.length ? featured : products).slice(0, 6)

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              {site.tagline && <div className="hero-tag">{site.tagline}</div>}
              <h1 className="display-5 fw-bold">{site.heroTitle}</h1>
              <p className="lead text-muted">{site.heroText}</p>
              <Link to="/san-pham" className="btn btn-dark btn-lg">Xem sản phẩm</Link>
            </div>
            {site.heroImage && (
              <div className="col-lg-6">
                <img src={asset(site.heroImage)} alt="" className="img-fluid rounded-4 shadow-sm" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <h2 className="h3 mb-0">{featured.length ? 'Sản phẩm nổi bật' : 'Sản phẩm'}</h2>
          <Link to="/san-pham">Xem tất cả →</Link>
        </div>
        {list.length === 0 ? (
          <p className="text-muted">Chưa có sản phẩm nào. Hãy thêm tại /admin.</p>
        ) : (
          <div className="row g-4">
            {list.map((p) => (
              <div className="col-sm-6 col-lg-4" key={p.slug}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
