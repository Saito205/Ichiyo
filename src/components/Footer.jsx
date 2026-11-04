import Icon from './Icon.jsx'
import { site } from '../content.js'

const links = [
  ['email', 'mail', (v) => `mailto:${v}`, (v) => v],
  ['phone', 'phone', (v) => `tel:${v}`, (v) => v],
  ['zalo', 'chat', (v) => v, () => 'Zalo'],
  ['facebook', 'facebook', (v) => v, () => 'Facebook'],
  ['instagram', 'instagram', (v) => v, () => 'Instagram'],
]

export default function Footer() {
  const c = site.contact ?? {}
  const items = links.filter(([key]) => c[key])

  return (
    <footer className="site-footer">
      <div className="wrap">
        {(items.length > 0 || c.address) && (
          <ul className="contacts">
            {items.map(([key, icon, href, label]) => (
              <li key={key}>
                <a href={href(c[key])} target="_blank" rel="noreferrer">
                  <Icon name={icon} size={18} />
                  {label(c[key])}
                </a>
              </li>
            ))}
            {c.address && (
              <li>
                <span className="contact-plain">
                  <Icon name="pin" size={18} />
                  {c.address}
                </span>
              </li>
            )}
          </ul>
        )}
        {site.footer && <p className="copyright">{site.footer}</p>}
      </div>
    </footer>
  )
}
