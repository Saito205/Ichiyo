import { useEffect, useState, useSyncExternalStore } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ProductModal from './components/ProductModal.jsx'
import GuideContent from './components/GuideContent.jsx'
import Home from './pages/Home.jsx'
import Products from './pages/Products.jsx'
import Cart from './pages/Cart.jsx'
import Currency from './pages/Currency.jsx'
import useStorefrontTheme from './lib/useStorefrontTheme.js'
import { site, guide } from './content.js'
const subscribe = (callback) => {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
const getPage = () => {
  const path = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0]
  if (path === 'products' || path === 'san-pham') return 'products'
  if (path === 'guide' || path === 'huong-dan') return 'guide'
  if (path === 'currency' || path === 'doi-tien') return 'currency'
  if (path === 'cart' || path === 'gio-hang') return 'cart'
  return 'home'
}
function Page({ page }) {
  const [selected, setSelected] = useState(null)
  return (
    <>
      <main id="main-content">
        {page === 'home' ? (
          <Home onOpen={setSelected} />
        ) : page === 'products' ? (
          <Products onOpen={setSelected} />
        ) : page === 'currency' ? (
          <Currency />
        ) : page === 'cart' ? (
          <Cart onOpen={setSelected} />
        ) : (
          <section className="wrap guide-page">
            <GuideContent guide={guide} />
          </section>
        )}
      </main>
      {selected && (
        <ProductModal key={selected.slug} product={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
export default function App() {
  const page = useSyncExternalStore(subscribe, getPage)
  const themeStyle = useStorefrontTheme(site.theme)
  useEffect(() => {
    const label =
      page === 'products'
        ? 'Sản phẩm'
        : page === 'guide'
          ? 'Hướng dẫn'
          : page === 'currency'
            ? 'Đổi tiền'
          : page === 'cart'
            ? 'Giỏ hàng'
            : 'Home'
    document.title = `${label} | ${site.name || 'Ichiyo'}`
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [page])
  return (
    <div className="storefront" style={themeStyle}>
      <Header page={page} />
      <Page key={page} page={page} />
      <Footer />
    </div>
  )
}
