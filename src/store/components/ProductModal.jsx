import { useEffect, useRef, useState } from 'react'
import { copyText } from '../../shared/clipboard.js'
import { categories } from '../../shared/content.js'
import {
  findVariant,
  formatPrice,
  hasVariants,
  isSoldOut,
  priceRangeLabel,
  unitPriceOf,
} from '../../shared/price.js'
import { paragraphs } from '../../shared/text.js'
import { safeUrl } from '../../shared/url.js'
import useModalDialog from '../../shared/useModalDialog.js'
import { useCart } from '../cart.js'
import { productHref } from '../routes.js'
import Icon from './Icon.jsx'
import Lightbox from './Lightbox.jsx'
import ProductImage from './ProductImage.jsx'
import QtyStepper from './QtyStepper.jsx'

function Gallery({ product }) {
  const [active, setActive] = useState(0)
  const [viewing, setViewing] = useState(false)
  const images = [product.cover, ...(product.gallery ?? [])].filter(Boolean)
  return (
    <div className="modal-media">
      <div className="modal-stage">
        {images.length ? (
          <button type="button" className="modal-stage-btn" aria-label="Xem ảnh lớn" onClick={() => setViewing(true)}>
            <ProductImage src={images[active]} alt={product.title} />
            <span className="stage-zoom" aria-hidden="true">
              <Icon name="zoom" size={18} />
            </span>
          </button>
        ) : (
          <ProductImage src="" />
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
              <ProductImage src={img} thumb />
            </button>
          ))}
        </div>
      )}
      {viewing && <Lightbox images={images} start={active} title={product.title} onClose={() => setViewing(false)} />}
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
            className={`variant-chip ${v.id === value ? 'on' : ''} ${v.soldOut ? 'sold-out' : ''}`}
            onClick={() => onChange(v.id)}
          >
            <span className="variant-chip-label">{v.label}</span>
            <span className="variant-chip-price">{v.soldOut ? 'Hết hàng' : formatPrice(v.price)}</span>
            {inCartQty > 0 && <span className="variant-chip-count">Trong giỏ ×{inCartQty}</span>}
          </button>
        )
      })}
    </div>
  )
}

// Nút chép link riêng của sản phẩm để gửi cho bạn bè / khách.
function CopyLinkButton({ slug }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = () => {
    const url = `${window.location.origin}${window.location.pathname}${productHref(slug)}`
    copyText(url).then((ok) => {
      if (!ok) return
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2500)
    })
  }
  return (
    <button type="button" className="text-link share-link" onClick={copy}>
      <Icon name={copied ? 'check' : 'link'} size={18} /> {copied ? 'Đã chép link' : 'Sao chép link'}
    </button>
  )
}

// Phân loại mặc định: loại khách đã thêm vào giỏ (khi mở từ giỏ hàng), nếu không thì loại còn hàng đầu tiên.
function initialVariant(product) {
  if (findVariant(product, product.variantId)) return product.variantId
  const variants = product.variants || []
  return (variants.find((v) => !v.soldOut) || variants[0])?.id || ''
}

export default function ProductModal({ product, onClose }) {
  const dialogRef = useModalDialog()
  const close = () => dialogRef.current?.close()
  const [pickQty, setPickQty] = useState(1)
  const { getQuantity, add, increment, decrement, remove } = useCart()
  const withVariants = hasVariants(product)
  const [variantId, setVariantId] = useState(() => initialVariant(product))
  const cartQty = getQuantity(product.slug, variantId)
  const soldOut = isSoldOut(product, variantId)
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

          {soldOut && (
            <p className="sold-out-note" role="status">
              {withVariants && !product.soldOut ? 'Phân loại này đã hết hàng.' : 'Sản phẩm này đã hết hàng.'}{' '}
              Bạn có thể nhắn tiệm để hỏi khi nào có hàng lại nhé.
            </p>
          )}

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
                  plus={{ label: 'Tăng số lượng', disabled: soldOut }}
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
              !soldOut && (
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
              )
            )}
            {link && (
              <a href={link} target="_blank" rel="noreferrer" className="btn btn-outline">
                Xem thêm <Icon name="external" size={18} />
              </a>
            )}
            <CopyLinkButton slug={product.slug} />
          </div>
        </div>
      </div>
    </dialog>
  )
}
