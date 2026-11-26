import { products } from '../../shared/content.js'
import { findVariant, formatPrice, unitPriceOf } from '../../shared/price.js'
import { useCart } from '../cart.js'
import Icon from '../components/Icon.jsx'
import ProductImage from '../components/ProductImage.jsx'
import QtyStepper from '../components/QtyStepper.jsx'

function CartItem({ item, index, onOpen, onMinus, onPlus, onRemove }) {
  const { variant, quantity, unitPrice } = item
  const priceLabel = variant ? formatPrice(unitPrice) : formatPrice(item.price)
  const name = variant ? `${item.title} (${variant.label})` : item.title

  return (
    <li className="cart-item">
      <span className="cart-index" aria-hidden="true">
        {index + 1}
      </span>
      <button
        type="button"
        className="cart-thumb"
        onClick={() => onOpen(item)}
        aria-label={`Xem chi tiết ${item.title}`}
      >
        <ProductImage src={item.cover} />
      </button>
      <div className="cart-info">
        {item.category && <span className="card-cat">{item.category}</span>}
        <h2>{item.title}</h2>
        {variant && (
          <span className="cart-variant">
            Phân loại: <strong>{variant.label}</strong>
          </span>
        )}
        {priceLabel && (
          <div className="cart-item-price">
            <span>{priceLabel}</span>
            {unitPrice > 0 && quantity > 1 && (
              <span className="cart-item-subtotal">
                {' '}
                × {quantity} = <strong>{formatPrice(unitPrice * quantity)}</strong>
              </span>
            )}
          </div>
        )}
        {item.summary && <p>{item.summary}</p>}
      </div>

      <div className="cart-actions">
        <QtyStepper
          value={quantity}
          label={`Số lượng ${name}`}
          onMinus={onMinus}
          onPlus={onPlus}
          minus={{
            label: quantity === 1 ? `Xóa ${name} khỏi giỏ` : `Giảm số lượng ${name}`,
            title: quantity === 1 ? 'Xóa khỏi giỏ' : 'Giảm số lượng',
          }}
          plus={{ label: `Tăng số lượng ${name}`, title: 'Tăng số lượng' }}
        />
        <button
          type="button"
          className="cart-remove"
          onClick={onRemove}
          aria-label={`Xóa ${name} khỏi giỏ`}
        >
          <Icon name="trash" size={18} />
          <span>Xóa</span>
        </button>
      </div>
    </li>
  )
}

export default function Cart({ onOpen }) {
  const { items: cartItems, count, increment, decrement, remove, clear } = useCart()
  // Ghép từng dòng giỏ với thông tin sản phẩm hiện tại.
  const items = cartItems
    .map(({ slug, variantId, quantity }) => {
      const product = products.find((p) => p.slug === slug)
      if (!product) return null
      const variant = findVariant(product, variantId)
      return { ...product, quantity, variantId, variant, unitPrice: unitPriceOf(product, variantId) }
    })
    .filter(Boolean)
  const totalPrice = items.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0)

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
            <button
              type="button"
              className="reset-filters"
              onClick={() => window.confirm('Xóa tất cả sản phẩm khỏi giỏ?') && clear()}
            >
              <Icon name="trash" size={16} />
              Xóa tất cả
            </button>
          </div>
          <ol className="cart-list">
            {items.map((p, i) => (
              <CartItem
                key={`${p.slug}::${p.variantId}`}
                item={p}
                index={i}
                onOpen={onOpen}
                onMinus={() => decrement(p.slug, p.variantId)}
                onPlus={() => increment(p.slug, p.variantId)}
                onRemove={() => remove(p.slug, p.variantId)}
              />
            ))}
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
