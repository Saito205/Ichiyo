import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Icon from './components/Icon.jsx'
import ProductCard from './components/ProductCard.jsx'
import ProductModal from './components/ProductModal.jsx'
import { site, products, categories, asset } from './content.js'

export default function App() {
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (site.name) document.title = site.name
  }, [])

  const keyword = q.trim().toLowerCase()
  const shown = products.filter((p) => {
    if (cat && p.category !== cat) return false
    if (!keyword) return true
    return `${p.title} ${p.summary ?? ''} ${p.category ?? ''}`.toLowerCase().includes(keyword)
  })

  return (
    <>
      <Header />

      <main>
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
              <a href="#san-pham" className="btn">Xem sản phẩm</a>
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

        <section id="san-pham" className="wrap catalog">
          <div className="toolbar">
            <label className="search">
              <Icon name="search" />
              <input
                type="search"
                placeholder="Tìm sản phẩm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Tìm sản phẩm"
              />
            </label>

            {categories.length > 0 && (
              <div className="chips" role="group" aria-label="Lọc theo danh mục">
                <button
                  type="button"
                  className={`chip ${cat === '' ? 'on' : ''}`}
                  aria-pressed={cat === ''}
                  onClick={() => setCat('')}
                >
                  Tất cả
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`chip ${cat === c ? 'on' : ''}`}
                    aria-pressed={cat === c}
                    onClick={() => setCat(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="section-head">
            <h2>Sản phẩm</h2>
            <span className="count">{shown.length} sản phẩm</span>
          </div>

          {shown.length === 0 ? (
            <p className="empty">
              {products.length === 0
                ? 'Chưa có sản phẩm nào. Thêm sản phẩm đầu tiên tại /admin.'
                : 'Không có sản phẩm khớp. Thử từ khóa khác hoặc chọn Tất cả.'}
            </p>
          ) : (
            <div className="grid">
              {shown.map((p) => (
                <ProductCard key={p.slug} product={p} onOpen={() => setSelected(p)} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />

      {selected && (
        <ProductModal key={selected.slug} product={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
