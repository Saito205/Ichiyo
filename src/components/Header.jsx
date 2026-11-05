import { site, asset } from '../content.js'
import Icon from './Icon.jsx'
import { useCart } from '../lib/cart.js'
const links = [
  ['home', '#/', 'Home'],
  ['products', '#/products', 'Sản phẩm'],
  ['guide', '#/guide', 'Hướng dẫn'],
  ['cart', '#/cart', 'Giỏ hàng'],
]
export default function Header({ page = 'home' }) {
  const name = site.name || 'Ichiyo'
  const { count } = useCart()
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
        <nav className="site-nav" aria-label="Điều hướng chính">
          {links.map(([key, href, label]) => (
            <a
              key={key}
              href={href}
              className={`nav-item ${page === key ? 'active' : ''}`}
              aria-current={page === key ? 'page' : undefined}
              aria-label={key === 'cart' && count > 0 ? `${label}, ${count} sản phẩm` : undefined}
            >
              <Icon name={key} size={23} />
              {key === 'cart' && count > 0 && (
                <span className="nav-badge" aria-hidden="true">
                  {count > 99 ? '99+' : count}
                </span>
              )}
              <span>{label}</span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
