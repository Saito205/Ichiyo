import { site, asset } from '../content.js'

export default function Header() {
  const name = site.name || 'Ichiyo'
  return (
    <header className="site-header">
      <a href="#" className="logo" aria-label={name}>
        {site.logo ? (
          <img src={asset(site.logo)} alt={name} style={{ display: 'block', height: 40, width: 'auto' }} />
        ) : (
          <>
            <span className="logo-mark" aria-hidden="true">一</span>
            <span className="logo-name">{name}</span>
          </>
        )}
      </a>
    </header>
  )
}
