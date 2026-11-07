import { useEffect, useState } from 'react'
import AdminIcon from './AdminIcon.jsx'
import { previewSrc } from './media.js'
import { categoryFor } from '../lib/catalog.js'
import { formatPrice, normalizeVariants, priceRangeLabel } from '../content.js'

// Số chạy từ 0 lên giá trị thật cho cảm giác "hiện dần".
function useCountUp(value, duration = 900) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setN(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return n
}

function Counter({ value }) {
  return <>{useCountUp(value).toLocaleString('vi-VN')}</>
}

const priceText = (data) =>
  data.variants?.length
    ? priceRangeLabel({ variants: normalizeVariants(data.variants) })
    : formatPrice(data.price)

export default function OverviewTab({ products, categories, onGo }) {
  const total = products.length
  const featured = products.filter((p) => p.data.featured).length
  const withVariants = products.filter((p) => p.data.variants?.length > 0).length
  const variantTotal = products.reduce((sum, p) => sum + (p.data.variants?.length || 0), 0)
  const filterTotal = categories.reduce((sum, c) => sum + c.filters.length, 0)
  const pct = total ? Math.round((featured / total) * 100) : 0

  const byCategory = categories.map((c) => ({
    name: c.name,
    count: products.filter((p) => categoryFor(p.data, categories)?.id === c.id).length,
  }))
  const uncategorized = products.filter((p) => !categoryFor(p.data, categories)).length
  if (uncategorized) byCategory.push({ name: 'Chưa phân loại', count: uncategorized })
  const bars = byCategory.sort((a, b) => b.count - a.count).slice(0, 8)
  const max = Math.max(1, ...bars.map((b) => b.count))

  const stamp = (p) => Date.parse(p.data.updatedAt || p.data.createdAt || '') || 0
  const recent = [...products].sort((a, b) => stamp(b) - stamp(a)).slice(0, 5)

  const stats = [
    { icon: 'box', value: total, label: 'Sản phẩm', sub: 'Đang có trên website' },
    { icon: 'tag', value: categories.length, label: 'Danh mục', sub: `${filterTotal} bộ lọc` },
    { icon: 'star', value: featured, label: 'Nổi bật', sub: `${pct}% tổng sản phẩm` },
    {
      icon: 'layers',
      value: variantTotal,
      label: 'Phân loại',
      sub: `${withVariants} sản phẩm nhiều loại`,
    },
  ]

  return (
    <>
      <div className="ov-stats ad-stagger">
        {stats.map((s) => (
          <div className="ad-card ov-stat" key={s.label}>
            <span className="ov-stat-icon">
              <AdminIcon name={s.icon} size={18} />
            </span>
            <div className="ov-stat-value">
              <Counter value={s.value} />
            </div>
            <div className="ov-stat-label">{s.label}</div>
            <div className="ov-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="ov-grid">
        <section className="ad-card ov-panel">
          <header className="ov-panel-head">
            <div>
              <h2>Sản phẩm theo danh mục</h2>
              <p>Danh mục nhiều sản phẩm nhất được tô nổi bật.</p>
            </div>
          </header>
          {bars.length === 0 ? (
            <p className="ov-empty">Chưa có danh mục nào. Hãy tạo ở tab “Danh mục & bộ lọc”.</p>
          ) : (
            <div className="ov-bars">
              {bars.map((b, i) => (
                <div
                  className={`ov-bar ${b.count === max && b.count > 0 ? 'top' : ''}`}
                  key={b.name}
                  style={{ '--i': i, '--h': `${Math.max(6, (b.count / max) * 100)}%` }}
                  title={`${b.name}: ${b.count} sản phẩm`}
                >
                  <span className="ov-bar-value">{b.count}</span>
                  <span className="ov-bar-track">
                    <span className="ov-bar-fill" />
                  </span>
                  <span className="ov-bar-label">{b.name}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="ad-card ov-panel">
          <header className="ov-panel-head">
            <div>
              <h2>Tỉ lệ nổi bật</h2>
              <p>Sản phẩm được ghim lên đầu trang chủ.</p>
            </div>
          </header>
          <div className="ov-ring-wrap">
            <svg className="ov-ring" viewBox="0 0 120 120" role="img" aria-label={`${pct}% sản phẩm nổi bật`}>
              <defs>
                <linearGradient id="ov-ring-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7df0b3" />
                  <stop offset="100%" stopColor="#15804f" />
                </linearGradient>
              </defs>
              <circle className="ov-ring-bg" cx="60" cy="60" r="50" pathLength="100" />
              <circle
                className="ov-ring-fg"
                cx="60"
                cy="60"
                r="50"
                pathLength="100"
                strokeDasharray={`${pct} 100`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="ov-ring-center">
              <strong>
                <Counter value={pct} />%
              </strong>
              <span>nổi bật</span>
            </div>
          </div>
          <div className="ov-legend">
            <div>
              <strong>{featured}</strong>
              <span>Nổi bật</span>
            </div>
            <div>
              <strong>{total - featured}</strong>
              <span>Thường</span>
            </div>
            <div>
              <strong>{withVariants}</strong>
              <span>Nhiều loại</span>
            </div>
          </div>
        </section>
      </div>

      <section className="ad-card ov-panel ov-recent">
        <header className="ov-panel-head">
          <div>
            <h2>Cập nhật gần đây</h2>
            <p>5 sản phẩm được thêm hoặc sửa mới nhất.</p>
          </div>
          <button type="button" className="ad-btn ghost" onClick={() => onGo('products')}>
            Xem tất cả <AdminIcon name="arrow" size={16} />
          </button>
        </header>
        {recent.length === 0 ? (
          <p className="ov-empty">Chưa có sản phẩm. Vào tab “Sản phẩm” để thêm sản phẩm đầu tiên.</p>
        ) : (
          <ul className="ov-rows ad-stagger">
            {recent.map((p) => {
              const price = priceText(p.data)
              return (
                <li key={p.slug}>
                  <button type="button" className="ov-row" onClick={() => onGo('products')}>
                    <span className="ad-item-img">
                      {p.data.cover ? (
                        <img src={previewSrc(p.data.cover)} alt="" loading="lazy" />
                      ) : (
                        <span aria-hidden="true">一</span>
                      )}
                    </span>
                    <span className="ad-item-info">
                      <strong>{p.data.title}</strong>
                      <small>
                        {p.data.category || 'Chưa có danh mục'}
                        {price ? ` · ${price}` : ''}
                      </small>
                    </span>
                    {p.data.variants?.length > 0 && (
                      <span className="ad-tag soft">{p.data.variants.length} phân loại</span>
                    )}
                    {p.data.featured && <span className="ad-tag">Nổi bật</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
