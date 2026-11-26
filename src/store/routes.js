// Danh sách các trang của cửa hàng: đường dẫn, tên hiển thị (tiêu đề tab + menu)
// và các đường dẫn cũ vẫn được chấp nhận. Muốn thêm trang: thêm 1 dòng ở đây
// và khai báo component tương ứng trong StoreApp.jsx.
export const routes = [
  { key: 'home', href: '#/', label: 'Trang chủ', paths: [] },
  { key: 'products', href: '#/products', label: 'Sản phẩm', paths: ['products', 'san-pham'] },
  { key: 'currency', href: '#/currency', label: 'Đổi tiền', paths: ['currency', 'doi-tien'] },
  { key: 'guide', href: '#/guide', label: 'Hướng dẫn', paths: ['guide', 'huong-dan'] },
  { key: 'cart', href: '#/cart', label: 'Giỏ hàng', paths: ['cart', 'gio-hang'] },
]

// "#/san-pham?x=1" -> trang "products". Đường dẫn lạ thì về trang chủ.
export function routeFromHash(hash) {
  const path = hash.replace(/^#\/?/, '').split(/[/?]/)[0]
  return routes.find((r) => r.paths.includes(path)) || routes[0]
}

// Link riêng của sản phẩm: "#/products/<mã sản phẩm>" (mở sẵn cửa sổ chi tiết).
export const productHref = (slug) => `#/products/${encodeURIComponent(slug)}`
export function productSlugFromHash(hash) {
  const [path, slug] = hash.replace(/^#\/?/, '').split('?')[0].split('/')
  return (path === 'products' || path === 'san-pham') && slug ? decodeURIComponent(slug) : ''
}
