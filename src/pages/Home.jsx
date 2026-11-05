import { site, products, asset, paragraphs } from '../content.js'
import { homeProducts } from '../lib/catalog.js'
import Icon from '../components/Icon.jsx'
import ProductCarousel from '../components/ProductCarousel.jsx'
const picks = homeProducts(products)
export default function Home({ onOpen }) {
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            {site.tagline && (
              <p className="hero-tag">
                <span className="dot" />
                {site.tagline}
              </p>
            )}
            <h1>{site.heroTitle || `Chào mừng đến với ${site.name || 'Ichiyo'}`}</h1>
            {site.heroText && <p className="hero-text">{site.heroText}</p>}
            <div className="hero-actions">
              <a href="#/products" className="btn">
                Xem sản phẩm <Icon name="arrow" size={18} />
              </a>
              <a href="#/guide" className="text-link">
                Cách mua hàng
              </a>
            </div>
          </div>
          {site.heroImage ? (
            <img className="hero-img" src={asset(site.heroImage)} alt="" />
          ) : (
            <div className="art" aria-hidden="true">
              <span className="leaf a" />
              <span className="leaf b" />
              <span className="art-mark">一</span>
            </div>
          )}
        </div>
      </section>
      <ProductCarousel products={picks} onOpen={onOpen} />
      {(site.aboutTitle || site.aboutText) && (
        <section className="wrap about-section">
          <h2>{site.aboutTitle || 'Về Ichiyo'}</h2>
          <div>
            {paragraphs(site.aboutText).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      )}
      <section className="wrap shopping-help">
        <div>
          <span className="eyebrow">Lần đầu ghé tiệm?</span>
          <h2>Mua hàng cùng Ichiyo thật dễ.</h2>
          <p>Xem các bước chọn món, liên hệ và xác nhận đơn hàng.</p>
        </div>
        <a href="#/guide" className="btn">
          Hướng dẫn mua hàng <Icon name="arrow" size={18} />
        </a>
      </section>
    </>
  )
}
