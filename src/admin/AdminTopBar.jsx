import AdminIcon from './components/AdminIcon.jsx'

// Thanh trên cùng: logo, các tab, link về trang khách, ảnh đại diện và nút đăng xuất.
export default function AdminTopBar({ tabs, tab, onTab, user, saving, canLeave, onLogout }) {
  return (
    <header className="ad-top">
      <div className="ad-top-inner">
        <div className="ad-brand">
          <span className="ad-mark" aria-hidden="true">
            一
          </span>
          <span className="ad-brand-name">Quản trị</span>
        </div>
        <nav className="ad-tabs" aria-label="Mục quản trị">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={saving}
              className={tab === t.id ? 'on' : ''}
              aria-current={tab === t.id ? 'page' : undefined}
              aria-label={t.label}
              title={t.label}
              onClick={() => onTab(t.id)}
            >
              <AdminIcon name={t.icon} size={16} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="ad-user">
          <a
            href="#/"
            className="ad-link"
            onClick={(e) => {
              if (!canLeave()) e.preventDefault()
            }}
          >
            <span className="ad-link-text">Xem trang</span> <AdminIcon name="external" size={15} />
          </a>
          {user && <img src={user.avatar_url} alt={user.login} title={user.login} />}
          <button
            type="button"
            className="ad-icon-btn"
            disabled={saving}
            aria-label="Đăng xuất"
            title="Đăng xuất"
            onClick={onLogout}
          >
            <AdminIcon name="logout" />
          </button>
        </div>
      </div>
    </header>
  )
}
