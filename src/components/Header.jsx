import { useLayoutEffect, useRef } from 'react'
import { site, asset } from '../content.js'
import Icon from './Icon.jsx'
import { useCart } from '../lib/cart.js'
const links = [
  ['home', '#/', 'Home'],
  ['products', '#/products', 'Sản phẩm'],
  ['currency', '#/currency', 'Đổi tiền'],
  ['guide', '#/guide', 'Hướng dẫn'],
]
const cartLink = ['cart', '#/cart', 'Giỏ hàng']
export default function Header({ page = 'home' }) {
  const name = site.name || 'Ichiyo'
  const { count } = useCart()
  const navRef = useRef(null)
  const bubbleRef = useRef(null)
  const placedIndex = useRef(-1)
  const activeIndex = links.findIndex(([key]) => key === page)

  // "Bong bóng" chạy tới nút đang chọn: mép đầu chạy trước, mép sau đuổi theo nên bong bóng bị kéo giãn.
  useLayoutEffect(() => {
    const nav = navRef.current
    const bubble = bubbleRef.current
    if (!nav || !bubble) return undefined

    if (activeIndex === -1) {
      bubble.dataset.hidden = 'true' // đang ở trang khác (vd. Giỏ hàng)
      return undefined
    }

    let frame = 0
    const place = () => {
      const item = nav.querySelectorAll('.nav-item')[activeIndex]
      if (!item) return
      bubble.style.top = `${item.offsetTop}px`
      bubble.style.height = `${item.offsetHeight}px`
      bubble.style.left = `${item.offsetLeft}px`
      bubble.style.right = `${nav.clientWidth - item.offsetLeft - item.offsetWidth}px`
    }
    const placeInstantly = () => {
      bubble.dataset.ready = 'false'
      place()
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        bubble.dataset.ready = 'true'
      })
    }

    bubble.dataset.hidden = 'false'
    if (bubble.dataset.ready !== 'true' || placedIndex.current === -1) {
      placeInstantly() // lần đầu: đặt đúng chỗ, không chạy hiệu ứng
    } else if (placedIndex.current !== activeIndex) {
      bubble.dataset.dir = activeIndex > placedIndex.current ? 'right' : 'left'
      place()
      bubble.classList.remove('go')
      void bubble.offsetWidth // khởi động lại animation
      bubble.classList.add('go')
    }
    placedIndex.current = activeIndex

    let firstCall = true // ResizeObserver luôn báo 1 lần ngay khi bắt đầu quan sát: bỏ qua để không cắt hiệu ứng
    const observer = new ResizeObserver(() => {
      if (firstCall) {
        firstCall = false
        return
      }
      placeInstantly()
    })
    observer.observe(nav)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [activeIndex])
  const renderLink = ([key, href, label]) => (
    <a
      key={key}
      href={href}
      className={`nav-item ${page === key ? 'active' : ''}`}
      aria-current={page === key ? 'page' : undefined}
      aria-label={key === 'cart' && count > 0 ? `${label}, ${count} sản phẩm` : label}
      title={label}
    >
      <Icon name={key} size={24} />
      {key === 'cart' && count > 0 && (
        <span className="nav-badge" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </a>
  )
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <a href="#/" className="logo" aria-label={`${name} — Home`}>
          {site.logo ? (
            <img className="logo-image" src={asset(site.logo)} alt={name} />
          ) : (
            <>
              <span className="logo-mark" aria-hidden="true">
                一
              </span>
              <span className="logo-name">{name}</span>
            </>
          )}
        </a>
        <nav className="site-nav" aria-label="Điều hướng chính" ref={navRef}>
          <span className="nav-bubble" ref={bubbleRef} data-hidden="true" aria-hidden="true" />
          {links.map(renderLink)}
        </nav>
        <div className="header-cart">{renderLink(cartLink)}</div>
      </div>
    </header>
  )
}
