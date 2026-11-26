import { useEffect, useRef, useState } from 'react'
import { asset } from '../../shared/content.js'
import Icon from './Icon.jsx'

const ZOOM = 2.5
const clamp = (n) => Math.min(100, Math.max(0, n))

// Xem ảnh toàn màn hình: vuốt / phím mũi tên để đổi ảnh, chạm (hoặc bấm) để phóng to đúng chỗ đó,
// khi đã phóng to thì kéo ngón tay / rê chuột để xem các phần khác. Esc hoặc nút X để đóng.
export default function Lightbox({ images, start = 0, title, onClose }) {
  const [index, setIndex] = useState(start)
  const [zoom, setZoom] = useState(null) // { x, y } tính theo % khung ảnh, null = không phóng to
  const gesture = useRef(null)
  const closeRef = useRef(null)
  const count = images.length

  const go = (step) => {
    setZoom(null)
    setIndex((i) => (i + step + count) % count)
  }

  useEffect(() => closeRef.current?.focus(), [])
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        // Chặn Esc để chỉ đóng phần xem ảnh, không đóng luôn cửa sổ sản phẩm.
        e.preventDefault()
        e.stopPropagation()
        onClose()
      } else if (e.key === 'ArrowLeft' && count > 1) go(-1)
      else if (e.key === 'ArrowRight' && count > 1) go(1)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  const pointAt = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) }
  }
  const handleDown = (e) => {
    gesture.current = { x: e.clientX, y: e.clientY, moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const handleMove = (e) => {
    const g = gesture.current
    if (g && Math.hypot(e.clientX - g.x, e.clientY - g.y) > 8) g.moved = true
    // Đang phóng to: vùng phóng to đi theo ngón tay (hoặc theo chuột khi rê).
    if (zoom && (g || e.pointerType === 'mouse')) setZoom(pointAt(e))
  }
  const handleUp = (e) => {
    const g = gesture.current
    gesture.current = null
    if (!g) return
    const dx = e.clientX - g.x
    if (!zoom && count > 1 && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
    else if (!g.moved) setZoom(zoom ? null : pointAt(e))
  }

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Ảnh ${index + 1}/${count}: ${title}`}>
      <div className="lightbox-bar">
        <span>
          {index + 1} / {count}
        </span>
        <button ref={closeRef} type="button" className="lightbox-btn" aria-label="Đóng xem ảnh" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <div
        className={`lightbox-stage ${zoom ? 'zoomed' : ''}`}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={() => (gesture.current = null)}
      >
        <img
          src={asset(images[index])}
          alt={title}
          draggable={false}
          style={zoom ? { transform: `scale(${ZOOM})`, transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
      </div>
      {count > 1 && (
        <>
          <button type="button" className="lightbox-btn lightbox-prev" aria-label="Ảnh trước" onClick={() => go(-1)}>
            <Icon name="left" />
          </button>
          <button type="button" className="lightbox-btn lightbox-next" aria-label="Ảnh sau" onClick={() => go(1)}>
            <Icon name="right" />
          </button>
        </>
      )}
      <p className="lightbox-hint">
        {zoom ? 'Chạm để thu nhỏ' : count > 1 ? 'Chạm để phóng to · vuốt để xem ảnh khác' : 'Chạm để phóng to'}
      </p>
    </div>
  )
}
