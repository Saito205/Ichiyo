import { products, asset, formatPrice, findVariant, unitPriceOf } from '../content.js'
import { useCart } from '../lib/cart.js'
import Icon from '../components/Icon.jsx'

export default function Cart({ onOpen }) {
  const { items: cartItems, count, increment, decrement, remove, clear } = useCart()
  const items = cartItems
    .map(({ slug, variantId, quantity }) => {
      const product = products.find((p) => p.slug === slug)
      if (!product) return null
      const variant = findVariant(product, variantId)
      return { ...product, quantity, variantId, variant, unitPrice: unitPriceOf(product, variantId) }
    })
    .filter(Boolean)

  const totalPrice = items.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0)

  const handleClear = () => {
    if (window.confirm('Xóa tất cả sản phẩm khỏi giỏ?')) clear()
  }

  return (
    <section className="wrap cart-page">
      <div className="page-heading">
        <span className="eyebrow">Danh sách muốn mua</span>
        <h1>Giỏ hàng</h1>
        <p className="page-intro">
          Chọn những món bạn thích, chỉnh số lượng, rồi chụp màn hình trang này gửi cho shop một lượt nhé.
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
              {items.length} mặt hàng · Tổng cộng {count} món
            </p>
            <button type="button" className="reset-filters" onClick={handleClear}>
              <Icon name="trash" size={16} />
              Xóa tất cả
            </button>
          </div>
          <ol className="cart-list">
            {items.map((p, i) => {
              const unitPrice = p.unitPrice
              const priceLabel = p.variant ? formatPrice(unitPrice) : formatPrice(p.price)
              const subtotal = unitPrice * p.quantity
              const name = p.variant ? `${p.title} (${p.variant.label})` : p.title

              return (
                <li className="cart-item" key={`${p.slug}::${p.variantId}`}>
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
                    {p.variant && (
                      <span className="cart-variant">
                        Phân loại: <strong>{p.variant.label}</strong>
                      </span>
                    )}
                    {priceLabel && (
                      <div className="cart-item-price">
                        <span>{priceLabel}</span>
                        {unitPrice > 0 && p.quantity > 1 && (
                          <span className="cart-item-subtotal">
                            {' '}
                            × {p.quantity} = <strong>{formatPrice(subtotal)}</strong>
                          </span>
                        )}
                      </div>
                    )}
                    {p.summary && <p>{p.summary}</p>}
                  </div>

                  <div className="cart-actions">
                    <div className="qty-stepper" role="group" aria-label={`Số lượng ${name}`}>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => decrement(p.slug, p.variantId)}
                        aria-label={
                          p.quantity === 1 ? `Xóa ${name} khỏi giỏ` : `Giảm số lượng ${name}`
                        }
                        title={p.quantity === 1 ? 'Xóa khỏi giỏ' : 'Giảm số lượng'}
                      >
                        <Icon name="minus" size={16} />
                      </button>
                      <span className="qty-value" aria-live="polite">
                        {p.quantity}
                      </span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => increment(p.slug, p.variantId)}
                        aria-label={`Tăng số lượng ${name}`}
                        title="Tăng số lượng"
                      >
                        <Icon name="plus" size={16} />
                      </button>
                    </div>

                    <button
                      type="button"
                      className="cart-remove"
                      onClick={() => remove(p.slug, p.variantId)}
                      aria-label={`Xóa ${name} khỏi giỏ`}
                    >
                      <Icon name="trash" size={18} />
                      <span>Xóa</span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="cart-footer">
            <a href="#/products" className="text-link cart-more">
              <Icon name="plus" size={16} /> Thêm sản phẩm khác
            </a>
            {totalPrice > 0 && (
              <div className="cart-total" role="status">
                <span>Tạm tính ({count} món):</span>
                <strong>{formatPrice(totalPrice)}</strong>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
