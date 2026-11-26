import { useLayoutEffect, useRef } from 'react'
import { asset, currency, site } from '../../shared/content.js'
import { useCart } from '../cart.js'
import { routes } from '../routes.js'
import Icon from './Icon.jsx'

// Chưa bật loại tiền nào thì ẩn mục Đổi tiền khỏi menu (tránh khách vào trang trống).
const hasCurrency = currency.currencies.some((c) => c.enabled)
const navRoutes = routes.filter((r) => r.key !== 'cart' && (r.key !== 'currency' || hasCurrency))
const cartRoute = routes.find((r) => r.key === 'cart')

// "Bong bóng" chạy tới nút đang chọn: mép đầu chạy trước, mép sau đuổi theo nên bong bóng bị kéo giãn.
function useNavBubble(activeIndex) {
  const navRef = useRef(null)
  const bubbleRef = useRef(null)
  const placedIndex = useRef(-1)

  useLayoutEffect(() => {
    const nav = navRef.current
    const bubble = bubbleRef.current
    if (!nav || !bubble) return undefined

    if (activeIndex === -1) {
      bubble.dataset.hidden = 'true' // đang ở trang khác (vd. Giỏ hàng)
      return undefined
    }

    let frame = 0
    // Bong bóng nằm đúng sau vòng tròn icon (không che nhãn chữ bên dưới).
    const place = () => {
      const icon = nav.querySelectorAll('.nav-item')[activeIndex]?.querySelector('.nav-icon')
      if (!icon) return
      const box = nav.getBoundingClientRect()
      const r = icon.getBoundingClientRect()
      bubble.style.top = `${r.top - box.top}px`
      bubble.style.height = `${r.height}px`
      bubble.style.left = `${r.left - box.left}px`
      bubble.style.right = `${box.right - r.right}px`
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
      if (firstCall) firstCall = false
      else placeInstantly()
    })
    observer.observe(nav)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [activeIndex])

  return { navRef, bubbleRef }
}

function NavLink({ route, page, count = 0, showLabel = true }) {
  const active = page === route.key
  return (
    <a
      href={route.href}
      className={`nav-item ${active ? 'active' : ''}`}
      aria-current={active ? 'page' : undefined}
      aria-label={count > 0 ? `${route.label}, ${count} sản phẩm` : route.label}
      title={route.label}
    >
      <span className="nav-icon">
        <Icon name={route.key} size={24} />
        {count > 0 && (
          <span className="nav-badge" aria-hidden="true">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
      {showLabel && (
        <span className="nav-label" aria-hidden="true">
          {route.label}
        </span>
      )}
    </a>
  )
}

export default function Header({ page = 'home' }) {
  const name = site.name || 'Ichiyo'
  const { count } = useCart()
  const { navRef, bubbleRef } = useNavBubble(navRoutes.findIndex((r) => r.key === page))

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <a href="#/" className="logo" aria-label={`${name} — Trang chủ`}>
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
          {navRoutes.map((r) => (
            <NavLink key={r.key} route={r} page={page} />
          ))}
        </nav>
        <div className="header-cart">
          <NavLink route={cartRoute} page={page} count={count} showLabel={false} />
        </div>
      </div>
    </header>
  )
}
