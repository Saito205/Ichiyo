import { products, asset } from '../content.js'
import { useCart } from '../lib/cart.js'
import Icon from '../components/Icon.jsx'

export default function Cart({ onOpen }) {
  const { slugs, remove, clear } = useCart()
  const items = slugs.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean)

  const handleClear = () => {
    if (window.confirm('Xóa tất cả sản phẩm khỏi giỏ?')) clear()
  }

  return (
    <section className="wrap cart-page">
      <div className="page-heading">
        <span className="eyebrow">Danh sách muốn mua</span>
        <h1>Giỏ hàng</h1>
        <p className="page-intro">
          Chọn những món bạn thích, rồi chụp màn hình trang này gửi cho shop một lượt nhé.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <h2>Giỏ hàng đang trống</h2>
          <p>Bấm “Thêm vào giỏ” ở sản phẩm bạn thích để lưu lại đây.</p>
          <a href="#/products" className="btn">
            Xem sản phẩm <Icon name="arrow" size={18} />
          </a>
        </div>
      ) : (
        <>
          <div className="results-heading">
            <p className="count" role="status">
              {items.length} sản phẩm
            </p>
            <button type="button" className="reset-filters" onClick={handleClear}>
              <Icon name="trash" size={16} />
              Xóa tất cả
            </button>
          </div>
          <ol className="cart-list">
            {items.map((p, i) => (
              <li className="cart-item" key={p.slug}>
                <span className="cart-index" aria-hidden="true">
                  {i + 1}
                </span>
                <button
                  type="button"
                  className="cart-thumb"
                  onClick={() => onOpen(p)}
                  aria-label={`Xem chi tiết ${p.title}`}
                >
                  {p.cover ? (
                    <img src={asset(p.cover)} alt="" />
                  ) : (
                    <span className="card-empty" aria-hidden="true">
                      一
                    </span>
                  )}
                </button>
                <div className="cart-info">
                  {p.category && <span className="card-cat">{p.category}</span>}
                  <h2>{p.title}</h2>
                  {p.summary && <p>{p.summary}</p>}
                </div>
                <button
                  type="button"
                  className="cart-remove"
                  onClick={() => remove(p.slug)}
                  aria-label={`Xóa ${p.title} khỏi giỏ`}
                >
                  <Icon name="trash" size={18} />
                  <span>Xóa</span>
                </button>
              </li>
            ))}
          </ol>
          <a href="#/products" className="text-link cart-more">
            <Icon name="plus" size={16} /> Thêm sản phẩm khác
          </a>
        </>
      )}
    </section>
  )
}
