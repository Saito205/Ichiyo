import { site } from '../../shared/content.js'
import { safeUrl } from '../../shared/url.js'
import Icon from './Icon.jsx'

// [khóa trong site.contact, icon, tạo đường link, chữ hiển thị]
const links = [
  ['email', 'mail', (v) => `mailto:${v.trim()}`, (v) => v],
  ['phone', 'phone', (v) => `tel:${v.replace(/[^\d+]/g, '')}`, (v) => v],
  ['zalo', 'chat', safeUrl, () => 'Zalo'],
  ['facebook', 'facebook', safeUrl, () => 'Facebook'],
  ['instagram', 'instagram', safeUrl, () => 'Instagram'],
  ['tiktok', 'tiktok', safeUrl, () => 'TikTok'],
]

export default function Footer() {
  const c = site.contact ?? {}
  // Bỏ các liên hệ trống hoặc liên kết không hợp lệ.
  const items = links
    .filter(([key]) => c[key]?.trim())
    .map(([key, icon, href, label]) => ({ key, icon, href: href(c[key]), label: label(c[key]) }))
    .filter((item) => item.href)

  return (
    <footer className="site-footer">
      <div className="wrap">
        {(items.length > 0 || c.address) && (
          <ul className="contacts">
            {items.map((item) => (
              <li key={item.key}>
                <a href={item.href} target="_blank" rel="noreferrer">
                  <Icon name={item.icon} size={18} />
                  {item.label}
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
