import { site, asset } from '../content.js'
import Icon from './Icon.jsx'
const links = [
  ['home', '#/', 'Home'],
  ['products', '#/products', 'Sản phẩm'],
  ['guide', '#/guide', 'Hướng dẫn'],
]
export default function Header({ page = 'home' }) {
  const name = site.name || 'Ichiyo'
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
            >
              <Icon name={key} size={23} />
              <span>{label}</span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
