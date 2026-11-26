import { useEffect, useState } from 'react'
import { products, site } from '../shared/content.js'
import useHash from '../shared/useHash.js'
import Footer from './components/Footer.jsx'
import Header from './components/Header.jsx'
import ProductModal from './components/ProductModal.jsx'
import Cart from './pages/Cart.jsx'
import Currency from './pages/Currency.jsx'
import Guide from './pages/Guide.jsx'
import Home from './pages/Home.jsx'
import Products from './pages/Products.jsx'
import { productSlugFromHash, routeFromHash } from './routes.js'
import useStorefrontTheme from './useStorefrontTheme.js'

const pages = { home: Home, products: Products, currency: Currency, guide: Guide, cart: Cart }

// Nội dung một trang + cửa sổ chi tiết sản phẩm (mở được từ mọi trang có sản phẩm).
// Mở bằng link riêng (#/products/<mã>) thì sản phẩm lấy từ đường dẫn; đóng lại thì bỏ mã khỏi đường dẫn.
function PageView({ page, linkedSlug, pageHref }) {
  const [picked, setPicked] = useState(null)
  const Page = pages[page]
  const linked = linkedSlug ? products.find((p) => p.slug === linkedSlug) : null
  const selected = linked || picked
  const close = () => (linked ? window.location.replace(pageHref) : setPicked(null))
  return (
    <>
      <main id="main-content">
        <Page onOpen={setPicked} />
      </main>
      {selected && (
        <ProductModal key={selected.slug} product={selected} onClose={close} />
      )}
    </>
  )
}

export default function StoreApp() {
  const hash = useHash()
  const route = routeFromHash(hash)
  const themeStyle = useStorefrontTheme(site.theme)

  useEffect(() => {
    document.title = `${route.label} | ${site.name || 'Ichiyo'}`
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [route])

  return (
    <div className="storefront" style={themeStyle}>
      <Header page={route.key} />
      <PageView key={route.key} page={route.key} linkedSlug={productSlugFromHash(hash)} pageHref={route.href} />
      <Footer />
    </div>
  )
}
