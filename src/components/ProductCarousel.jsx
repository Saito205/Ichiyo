import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { asset, priceRangeLabel } from '../content.js'

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

// Vị trí 3D của một thẻ theo khoảng cách d tới thẻ ở giữa (d là số thực, thay đổi liên tục khi kéo).
// d = 0: thẻ giữa, nổi lên phía trước. d = ±1: thẻ sát bên, xoay vào trong và lùi ra sau.
function place(d, { near, far }) {
  const abs = Math.abs(d)
  const dir = Math.sign(d)
  const x = dir * (abs <= 1 ? abs * near : near + (abs - 1) * far)
  const rotate = -dir * Math.min(abs, 1) * 42
  const depth = -Math.min(abs, 2) * 150
  const scale = 1 - Math.min(abs, 2) * 0.1
  const lift = -(1 - Math.min(abs, 1)) * 18
  const opacity = abs <= 1 ? 1 - abs * 0.2 : Math.max(0, 0.8 - (abs - 1) * 0.53)
  return {
    transform: `translate3d(${x}px, ${lift}px, ${depth}px) rotateY(${rotate}deg) scale(${scale})`,
    opacity,
    zIndex: Math.round(100 - abs * 10),
  }
}

export default function ProductCarousel({ products, onOpen }) {
  const stage = useRef(null)
  const gesture = useRef(null)
  const blockClick = useRef(false)
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [width, setWidth] = useState(1000)
  const count = products.length
  const active = clamp(index, 0, Math.max(0, count - 1))

  // Đo bề rộng khung để thẻ co giãn theo màn hình.
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [count === 0])

  const compact = width < 640
  const cardW = Math.round(clamp(width * (compact ? 0.6 : 0.3), 200, 330))
  const cardH = Math.round(cardW * 1.3)
  const metrics = {
    near: cardW * (compact ? 0.64 : 0.78),
    far: cardW * (compact ? 0.3 : 0.42),
  }

  const go = (next) => setIndex(clamp(next, 0, count - 1))

  const handlePointerDown = (e) => {
    if (count < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return
    gesture.current = {
      id: e.pointerId,
      startX: e.clientX,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0,
      moved: false,
    }
  }

  const handlePointerMove = (e) => {
    const g = gesture.current
    if (!g || g.id !== e.pointerId) return
    const dx = e.clientX - g.startX
    if (!g.moved) {
      if (Math.abs(dx) < 6) return
      g.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragging(true)
    }
    const dt = e.timeStamp - g.lastT
    if (dt > 0) g.velocity = (e.clientX - g.lastX) / dt
    g.lastX = e.clientX
    g.lastT = e.timeStamp
    // Kéo quá hai đầu danh sách thì "nặng tay" hơn như dây thun.
    const atEdge = (active === 0 && dx > 0) || (active === count - 1 && dx < 0)
    setDragX(atEdge ? dx * 0.35 : dx)
  }

  const handlePointerEnd = (e) => {
    const g = gesture.current
    if (!g || g.id !== e.pointerId) return
    gesture.current = null
    if (!g.moved) return
    // Thả tay sau khi kéo không được tính là một cú bấm vào thẻ.
    blockClick.current = true
    setTimeout(() => {
      blockClick.current = false
    }, 0)
    const projected = e.clientX - g.startX + g.velocity * 140
    const steps = Math.sign(-projected) * Math.floor(Math.abs(projected) / metrics.near + 0.7)
    setDragX(0)
    setDragging(false)
    go(active + steps)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(active - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(active + 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      go(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      go(count - 1)
    }
  }

  const handleCard = (i, product) => {
    if (blockClick.current) return
    if (i === active) onOpen(product)
    else go(i)
  }

  const current = products[active]

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
        </div>
      </div>
      {count ? (
        <div
          ref={stage}
          className="cf-stage"
          style={{ '--card-w': `${cardW}px`, '--card-h': `${cardH}px`, height: cardH + 150 }}
        >
          <div
            className={`cf-viewport ${dragging ? 'is-dragging' : ''}`}
            role="region"
            aria-roledescription="carousel"
            aria-label="Sản phẩm nổi bật và mới. Bấm vào thẻ bên cạnh hoặc kéo ngang để chuyển món"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          >
            {products.map((p, i) => {
              const d = i - active + dragX / metrics.near
              const abs = Math.abs(d)
              const isActive = i === active
              const hidden = abs >= 2.6
              const price = priceRangeLabel(p)
              return (
                <button
                  key={p.slug}
                  type="button"
                  className={`cf-card ${isActive ? 'is-active' : ''}`}
                  style={{ ...place(d, metrics), pointerEvents: hidden ? 'none' : undefined }}
                  tabIndex={isActive ? 0 : -1}
                  aria-hidden={hidden || undefined}
                  aria-current={isActive || undefined}
                  aria-label={isActive ? `Xem chi tiết ${p.title}` : `Chuyển tới ${p.title}`}
                  onClick={() => handleCard(i, p)}
                >
                  <span className="cf-media">
                    {p.cover ? (
                      <img src={asset(p.cover)} alt="" draggable={false} />
                    ) : (
                      <span className="card-empty" aria-hidden="true">
                        一
                      </span>
                    )}
                  </span>
                  {p.featured && (
                    <span className="badge">
                      <span className="dot" />
                      Nổi bật
                    </span>
                  )}
                  <span className="cf-info">
                    {p.category && <span className="cf-cat">{p.category}</span>}
                    <span className="cf-title">{p.title}</span>
                    {price && <span className="cf-price">{price}</span>}
                    {p.summary && <span className="cf-summary">{p.summary}</span>}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="cf-bar">
            <button
              type="button"
              className="cf-nav"
              aria-label="Sản phẩm trước"
              disabled={active === 0}
              onClick={() => go(active - 1)}
            >
              <Icon name="left" />
            </button>
            <button
              type="button"
              className="cf-now"
              aria-label={`Xem chi tiết ${current.title}`}
              onClick={() => onOpen(current)}
            >
              <span className="cf-thumb">
                {current.cover ? (
                  <img src={asset(current.cover)} alt="" draggable={false} />
                ) : (
                  <span aria-hidden="true">一</span>
                )}
              </span>
              <span className="cf-now-text">
                <strong>{current.title}</strong>
                <small>
                  {active + 1} / {count}
                </small>
              </span>
            </button>
            <button
              type="button"
              className="cf-nav"
              aria-label="Sản phẩm tiếp theo"
              disabled={active === count - 1}
              onClick={() => go(active + 1)}
            >
              <Icon name="right" />
            </button>
          </div>
          <p className="cf-sr" role="status">
            Sản phẩm {active + 1} trên {count}: {current.title}
          </p>
        </div>
      ) : (
        <p className="empty">Tiệm đang chuẩn bị những sản phẩm mới. Bạn ghé lại sau nhé!</p>
      )}
    </section>
  )
}
