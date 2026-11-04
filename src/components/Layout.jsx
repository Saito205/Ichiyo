import { useEffect } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { site } from '../content.js'

export default function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    if (site.name) document.title = site.name
  }, [])

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="site-header">
        <nav className="container d-flex align-items-center justify-content-between py-3">
          <Link to="/" className="brand">{site.name || 'Ichiyo'}</Link>
          <ul className="nav gap-1">
            <li><NavLink end to="/" className="nav-link">Trang chủ</NavLink></li>
            <li><NavLink to="/san-pham" className="nav-link">Sản phẩm</NavLink></li>
            <li><NavLink to="/gioi-thieu" className="nav-link">Giới thiệu</NavLink></li>
          </ul>
        </nav>
      </header>

      <main className="flex-grow-1">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container py-4 text-center">{site.footer}</div>
      </footer>
    </div>
  )
}
