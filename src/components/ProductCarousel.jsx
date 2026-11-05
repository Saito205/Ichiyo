import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import ProductCard from './ProductCard.jsx'
export default function ProductCarousel({ products, onOpen }) {
  const track = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  useEffect(() => {
    const el = track.current
    if (!el) return
    const measure = () =>
      setEdges({
        start: el.scrollLeft <= 2,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
      })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    el.addEventListener('scroll', measure, { passive: true })
    return () => {
      observer.disconnect()
      el.removeEventListener('scroll', measure)
    }
  }, [products.length])
  const move = (direction) => {
    const el = track.current
    const step = (el.querySelector('.card')?.getBoundingClientRect().width || 260) + 20
    el.scrollBy({
      left: direction * step * Math.max(1, Math.floor(el.clientWidth / step)),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }
  return (
    <section className="wrap home-products" aria-labelledby="home-products-title">
      <div className="section-head">
        <div>
          <span className="eyebrow">Ghé xem một chút</span>
          <h2 id="home-products-title">Nổi bật & mới về</h2>
          <p className="section-subtitle">Những món nổi bật và sản phẩm mới của tiệm.</p>
        </div>
        <div className="carousel-actions">
          <a className="text-link" href="#/products">
            Xem tất cả <Icon name="arrow" size={18} />
          </a>
          <button
            type="button"
            className="round-button"
            aria-label="Sản phẩm trước"
            aria-controls="home-product-track"
            disabled={edges.start}
            onClick={() => move(-1)}
          >
            <Icon name="left" />
          </button>
          <button
            type="button"
            className="round-button"
            aria-label="Sản phẩm tiếp theo"
            aria-controls="home-product-track"
            disabled={edges.end}
            onClick={() => move(1)}
          >
            <Icon name="right" />
          </button>
        </div>
      </div>
      {products.length ? (
        <div
          ref={track}
          id="home-product-track"
          className="product-track"
          tabIndex={0}
          role="region"
          aria-label="Sản phẩm nổi bật và mới, cuộn ngang để xem thêm"
        >
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} onOpen={() => onOpen(p)} />
          ))}
        </div>
      ) : (
        <p className="empty">Tiệm đang chuẩn bị những sản phẩm mới. Bạn ghé lại sau nhé!</p>
      )}
    </section>
  )
}
