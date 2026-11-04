import { site, paragraphs } from '../content.js'

const links = [
  ['email', 'bi-envelope', (v) => `mailto:${v}`],
  ['phone', 'bi-telephone', (v) => `tel:${v}`],
  ['zalo', 'bi-chat-dots', (v) => v],
  ['facebook', 'bi-facebook', (v) => v],
  ['instagram', 'bi-instagram', (v) => v],
]

export default function About() {
  const c = site.contact ?? {}
  return (
    <div className="container py-5" style={{ maxWidth: 760 }}>
      <h1 className="h2 mb-4">{site.aboutTitle || 'Giới thiệu'}</h1>
      {paragraphs(site.aboutText).map((t, i) => <p key={i}>{t}</p>)}

      <h2 className="h4 mt-5 mb-3">Liên hệ</h2>
      <ul className="list-unstyled contact-list">
        {links.map(([key, icon, href]) =>
          c[key] ? (
            <li key={key}>
              <i className={`bi ${icon} me-2`} />
              <a href={href(c[key])} target="_blank" rel="noreferrer">{c[key]}</a>
            </li>
          ) : null,
        )}
        {c.address && <li><i className="bi bi-geo-alt me-2" />{c.address}</li>}
      </ul>
    </div>
  )
}
