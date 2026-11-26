import { useEffect, useState } from 'react'
import { site } from '../shared/content.js'
import useHash from '../shared/useHash.js'
import Footer from './components/Footer.jsx'
import Header from './components/Header.jsx'
import ProductModal from './components/ProductModal.jsx'
import Cart from './pages/Cart.jsx'
import Currency from './pages/Currency.jsx'
import Guide from './pages/Guide.jsx'
import Home from './pages/Home.jsx'
import Products from './pages/Products.jsx'
import { routeFromHash } from './routes.js'
import useStorefrontTheme from './useStorefrontTheme.js'

const pages = { home: Home, products: Products, currency: Currency, guide: Guide, cart: Cart }

// Nội dung một trang + cửa sổ chi tiết sản phẩm (mở được từ mọi trang có sản phẩm).
function PageView({ page }) {
  const [selected, setSelected] = useState(null)
  const Page = pages[page]
  return (
    <>
      <main id="main-content">
        <Page onOpen={setSelected} />
      </main>
      {selected && (
        <ProductModal key={selected.slug} product={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

export default function StoreApp() {
  const route = routeFromHash(useHash())
  const themeStyle = useStorefrontTheme(site.theme)

  useEffect(() => {
    document.title = `${route.label} | ${site.name || 'Ichiyo'}`
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [route])

  return (
    <div className="storefront" style={themeStyle}>
      <Header page={route.key} />
      <PageView key={route.key} page={route.key} />
      <Footer />
    </div>
  )
}
