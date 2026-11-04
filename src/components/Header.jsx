import { site } from '../content.js'

export default function Header() {
  return (
    <header className="site-header">
      <a href="#" className="logo" aria-label={site.name || 'Ichiyo'}>
        <span className="logo-mark" aria-hidden="true">一</span>
        <span className="logo-name">{site.name || 'Ichiyo'}</span>
      </a>
    </header>
  )
}
