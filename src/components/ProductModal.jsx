import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { asset, paragraphs, categories, formatPrice, hasVariants, findVariant, unitPriceOf, priceRangeLabel } from '../content.js'
import { useCart } from '../lib/cart.js'

export default function ProductModal({ product, onClose }) {
  const dialogRef = useRef(null)
  const [active, setActive] = useState(0)
  const [pickQty, setPickQty] = useState(1)
  const { getQuantity, add, increment, decrement, remove } = useCart()
  const variants = product.variants || []
  const withVariants = hasVariants(product)
  // Mở từ giỏ hàng thì chọn đúng loại đã thêm, không thì chọn phân loại đầu tiên; sản phẩm không phân loại dùng variantId rỗng.
  const [variantId, setVariantId] = useState(() =>
    findVariant(product, product.variantId) ? product.variantId : variants[0]?.id || '',
  )
  const cartQty = getQuantity(product.slug, variantId)
  const inCart = cartQty > 0
  const priceLabel = withVariants
    ? formatPrice(unitPriceOf(product, variantId)) || priceRangeLabel(product)
    : formatPrice(product.price)
  const category = categories.find((c) => c.id === product.categoryId)
  const attributes = (category?.filters || []).filter((f) => product.attributes?.[f.id])
  const images = [product.cover, ...(product.gallery ?? [])].filter(Boolean)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Bấm ra vùng nền tối (chính là thẻ <dialog>) thì đóng.
  const handleBackdrop = (e) => {
    if (e.target === dialogRef.current) dialogRef.current.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-label={product.title}
      onClose={onClose}
      onClick={handleBackdrop}
    >
      <button
        type="button"
        className="modal-close"
        aria-label="Đóng"
        onClick={() => dialogRef.current.close()}
      >
        <Icon name="close" />
      </button>

      <div className="modal-body">
        <div className="modal-media">
          <div className="modal-stage">
            {images.length > 0 ? (
              <img src={asset(images[active])} alt={product.title} />
            ) : (
              <span className="card-empty" aria-hidden="true">
                一
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="thumbs">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  className={`thumb ${i === active ? 'on' : ''}`}
                  aria-label={`Ảnh ${i + 1}`}
                  aria-current={i === active}
                  onClick={() => setActive(i)}
                >
                  <img src={asset(img)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="modal-info">
          {product.category && <span className="card-cat">{product.category}</span>}
          <h2>{product.title}</h2>
          {priceLabel && <div className="modal-price">{priceLabel}</div>}
          {withVariants && (
            <div className="variant-picker" role="radiogroup" aria-label="Phân loại">
              {variants.map((v) => {
                const inCartQty = getQuantity(product.slug, v.id)
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={v.id === variantId}
                    className={`variant-chip ${v.id === variantId ? 'on' : ''}`}
                    onClick={() => {
                      setVariantId(v.id)
                      setPickQty(1)
                    }}
                  >
                    <span className="variant-chip-label">{v.label}</span>
                    <span className="variant-chip-price">{formatPrice(v.price)}</span>
                    {inCartQty > 0 && <span className="variant-chip-count">Trong giỏ ×{inCartQty}</span>}
                  </button>
                )
              })}
            </div>
          )}
          {product.summary && <p className="modal-summary">{product.summary}</p>}
          {attributes.length > 0 && (
            <dl className="product-attributes">
              {attributes.map((f) => (
                <div key={f.id}>
                  <dt>{f.name}</dt>
                  <dd>{product.attributes[f.id]}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="modal-desc">
            {paragraphs(product.description).map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </div>
          <div className="modal-actions">
            {inCart ? (
              <>
                <span className="in-cart-note">
                  <Icon name="check" size={18} /> Đã trong giỏ:
                </span>
                <div className="qty-stepper" role="group" aria-label={`Số lượng ${product.title}`}>
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label="Giảm số lượng"
                    onClick={() => decrement(product.slug, variantId)}
                  >
                    <Icon name="minus" size={16} />
                  </button>
                  <span className="qty-value" aria-live="polite">
                    {cartQty}
                  </span>
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label="Tăng số lượng"
                    onClick={() => increment(product.slug, variantId)}
                  >
                    <Icon name="plus" size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => remove(product.slug, variantId)}
                >
                  <Icon name="trash" size={18} /> Xóa khỏi giỏ
                </button>
                <a href="#/cart" className="text-link" onClick={() => dialogRef.current?.close()}>
                  Xem giỏ hàng
                </a>
              </>
            ) : (
              <>
                <div className="qty-stepper" role="group" aria-label="Chọn số lượng muốn thêm">
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label="Giảm số lượng"
                    disabled={pickQty <= 1}
                    onClick={() => setPickQty((q) => Math.max(1, q - 1))}
                  >
                    <Icon name="minus" size={16} />
                  </button>
                  <span className="qty-value" aria-live="polite">
                    {pickQty}
                  </span>
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label="Tăng số lượng"
                    onClick={() => setPickQty((q) => q + 1)}
                  >
                    <Icon name="plus" size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    add(product.slug, pickQty, variantId)
                    setPickQty(1)
                  }}
                >
                  <Icon name="cart" size={18} /> Thêm vào giỏ
                </button>
              </>
            )}
            {product.link && (
              <a href={product.link} target="_blank" rel="noreferrer" className="btn btn-outline">
                Xem thêm <Icon name="external" size={18} />
              </a>
            )}
          </div>
        </div>
      </div>
    </dialog>
  )
}
