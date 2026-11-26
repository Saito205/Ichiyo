import { useState } from 'react'
import { categories } from '../../shared/content.js'
import { findVariant, formatPrice, hasVariants, priceRangeLabel, unitPriceOf } from '../../shared/price.js'
import { paragraphs } from '../../shared/text.js'
import { safeUrl } from '../../shared/url.js'
import useModalDialog from '../../shared/useModalDialog.js'
import { useCart } from '../cart.js'
import Icon from './Icon.jsx'
import ProductImage from './ProductImage.jsx'
import QtyStepper from './QtyStepper.jsx'

function Gallery({ product }) {
  const [active, setActive] = useState(0)
  const images = [product.cover, ...(product.gallery ?? [])].filter(Boolean)
  return (
    <div className="modal-media">
      <div className="modal-stage">
        <ProductImage src={images[active]} alt={product.title} />
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
              <ProductImage src={img} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function VariantPicker({ product, value, onChange, getQuantity }) {
  return (
    <div className="variant-picker" role="radiogroup" aria-label="Phân loại">
      {product.variants.map((v) => {
        const inCartQty = getQuantity(product.slug, v.id)
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={v.id === value}
            className={`variant-chip ${v.id === value ? 'on' : ''}`}
            onClick={() => onChange(v.id)}
          >
            <span className="variant-chip-label">{v.label}</span>
            <span className="variant-chip-price">{formatPrice(v.price)}</span>
            {inCartQty > 0 && <span className="variant-chip-count">Trong giỏ ×{inCartQty}</span>}
          </button>
        )
      })}
    </div>
  )
}

export default function ProductModal({ product, onClose }) {
  const dialogRef = useModalDialog()
  const close = () => dialogRef.current?.close()
  const [pickQty, setPickQty] = useState(1)
  const { getQuantity, add, increment, decrement, remove } = useCart()
  const withVariants = hasVariants(product)
  // Mở từ giỏ hàng thì chọn đúng loại đã thêm, không thì chọn phân loại đầu tiên;
  // sản phẩm không phân loại dùng variantId rỗng.
  const [variantId, setVariantId] = useState(() =>
    findVariant(product, product.variantId) ? product.variantId : product.variants?.[0]?.id || '',
  )
  const cartQty = getQuantity(product.slug, variantId)
  const priceLabel = withVariants
    ? formatPrice(unitPriceOf(product, variantId)) || priceRangeLabel(product)
    : formatPrice(product.price)
  const category = categories.find((c) => c.id === product.categoryId)
  const link = safeUrl(product.link)
  const attributes = (category?.filters || []).filter((f) => product.attributes?.[f.id])

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-label={product.title}
      onClose={onClose}
      // Bấm ra vùng nền tối (chính là thẻ <dialog>) thì đóng.
      onClick={(e) => e.target === dialogRef.current && close()}
    >
      <button type="button" className="modal-close" aria-label="Đóng" onClick={close}>
        <Icon name="close" />
      </button>

      <div className="modal-body">
        <Gallery product={product} />

        <div className="modal-info">
          {product.category && <span className="card-cat">{product.category}</span>}
          <h2>{product.title}</h2>
          {priceLabel && <div className="modal-price">{priceLabel}</div>}
          {withVariants && (
            <VariantPicker
              product={product}
              value={variantId}
              getQuantity={getQuantity}
              onChange={(id) => {
                setVariantId(id)
                setPickQty(1)
              }}
            />
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
            {cartQty > 0 ? (
              <>
                <span className="in-cart-note">
                  <Icon name="check" size={18} /> Đã trong giỏ:
                </span>
                <QtyStepper
                  value={cartQty}
                  label={`Số lượng ${product.title}`}
                  onMinus={() => decrement(product.slug, variantId)}
                  onPlus={() => increment(product.slug, variantId)}
                  minus={{ label: 'Giảm số lượng' }}
                  plus={{ label: 'Tăng số lượng' }}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => remove(product.slug, variantId)}
                >
                  <Icon name="trash" size={18} /> Xóa khỏi giỏ
                </button>
                <a href="#/cart" className="text-link" onClick={close}>
                  Xem giỏ hàng
                </a>
              </>
            ) : (
              <>
                <QtyStepper
                  value={pickQty}
                  label="Chọn số lượng muốn thêm"
                  onMinus={() => setPickQty((q) => Math.max(1, q - 1))}
                  onPlus={() => setPickQty((q) => q + 1)}
                  minus={{ label: 'Giảm số lượng', disabled: pickQty <= 1 }}
                  plus={{ label: 'Tăng số lượng' }}
                />
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
            {link && (
              <a href={link} target="_blank" rel="noreferrer" className="btn btn-outline">
                Xem thêm <Icon name="external" size={18} />
              </a>
            )}
          </div>
        </div>
      </div>
    </dialog>
  )
}
