import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { asset, paragraphs } from '../content.js'

export default function ProductModal({ product, onClose }) {
  const dialogRef = useRef(null)
  const [active, setActive] = useState(0)
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
      <button type="button" className="modal-close" aria-label="Đóng" onClick={() => dialogRef.current.close()}>
        <Icon name="close" />
      </button>

      <div className="modal-body">
        <div className="modal-media">
          <div className="modal-stage">
            {images.length > 0 ? (
              <img src={asset(images[active])} alt={product.title} />
            ) : (
              <span className="card-empty" aria-hidden="true">一</span>
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
          {product.summary && <p className="modal-summary">{product.summary}</p>}
          <div className="modal-desc">
            {paragraphs(product.description).map((t, i) => <p key={i}>{t}</p>)}
          </div>
          {product.link && (
            <a href={product.link} target="_blank" rel="noreferrer" className="btn">
              Xem thêm <Icon name="external" size={18} />
            </a>
          )}
        </div>
      </div>
    </dialog>
  )
}
