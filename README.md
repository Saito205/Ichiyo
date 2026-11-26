# Ichiyo – Website trưng bày sản phẩm

React + Vite, deploy bằng GitHub Pages, có trang quản trị riêng (`#/admin`) ghi nội dung thẳng vào repo qua GitHub API.
Nội dung (sản phẩm, ảnh, thông tin) được lưu thành file trong thư mục `content/` và `public/uploads/`
ngay trong repo → không bao giờ mất khi thoát trình duyệt.

## Cách hoạt động
1. Vào `https://saito205.github.io/Ichiyo/admin/` (tự chuyển tới `#/admin`) → đăng nhập GitHub.
2. Thêm / sửa / xoá sản phẩm, danh mục, hướng dẫn, tiền tệ, cài đặt → bấm **Lưu** → trang quản trị tạo 1 commit vào nhánh `main`.
3. GitHub Actions tự build và deploy lại (khoảng 1–2 phút) → web cập nhật.

## Cài đặt (làm 1 lần)

### 1. Đẩy code lên GitHub
```bash
git add .
git commit -m "Website trung bay san pham"
git push
```

### 2. Bật GitHub Pages
Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Sau khi workflow chạy xong, web nằm ở `https://saito205.github.io/Ichiyo/`.
(Repo cần ở chế độ **Public** nếu dùng gói GitHub miễn phí.)

### 3. Tạo cổng đăng nhập GitHub (miễn phí)
GitHub Pages chỉ là hosting tĩnh nên không tự xử lý được đăng nhập GitHub.
Cần 1 Cloudflare Worker nhỏ làm "OAuth proxy":

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
   - Homepage URL: `https://saito205.github.io/Ichiyo/`
   - Authorization callback URL: `https://<ten-worker>.<tai-khoan>.workers.dev/callback`
   - Lưu lại **Client ID** và tạo **Client Secret**.
2. Clone & deploy https://github.com/sterlingwes/decap-proxy lên Cloudflare Workers (tài khoản Cloudflare miễn phí):
   ```bash
   git clone https://github.com/sterlingwes/decap-proxy
   cd decap-proxy && npm install
   npx wrangler deploy
   npx wrangler secret put GITHUB_OAUTH_ID
   npx wrangler secret put GITHUB_OAUTH_SECRET
   ```
   Worker chỉ gửi token cho các website trong biến `ALLOWED_ORIGINS` (mặc định `https://saito205.github.io`).
   Muốn đăng nhập khi chạy thử trên máy, thêm `,http://localhost:5173` vào biến này trong `wrangler.toml` rồi deploy lại.
3. Mở `src/admin/api/config.js`, sửa `PROXY_URL` thành địa chỉ Worker của bạn (và `REPO` / `BRANCH` nếu đổi), rồi commit + push.

Xong! Vào `/admin/` để quản lý nội dung.

## Tính năng cho khách
- Tìm kiếm không dấu, lọc theo danh mục / bộ lọc, sắp xếp (mới nhất, giá, tên).
- Mỗi sản phẩm có link riêng: `…/#/products/<mã-sản-phẩm>` (nút “Sao chép link” trong cửa sổ chi tiết).
- Bấm ảnh lớn để xem toàn màn hình: vuốt đổi ảnh, chạm để phóng to.
- Giỏ hàng: nút “Sao chép đơn hàng” và “Chép & nhắn Facebook/Zalo/…” (hiện khi đã điền link ở Cài đặt).
- Sản phẩm / phân loại “Hết hàng” (tick trong trang quản trị): vẫn xem được nhưng không thêm vào giỏ.

## Chạy thử trên máy
```bash
npm install
npm run dev            # web: http://localhost:5173/  — quản trị: http://localhost:5173/#/admin
npm run lint           # kiểm tra lỗi code
npm run build          # build ra thư mục dist/
```

## Cấu trúc
```
content/                     NỘI DUNG (trang quản trị sửa các file này)
  site.json                  thông tin chung, liên hệ, màu sắc
  catalog.json               danh mục & bộ lọc
  guide.json                 trang hướng dẫn mua hàng
  currency.json              các loại tiền & công thức quy đổi
  products/*.json            mỗi sản phẩm 1 file
public/uploads/              ảnh tải lên từ trang quản trị
public/admin/index.html      chuyển /admin/ sang #/admin
public/generated/            ảnh thu nhỏ, biểu tượng, ảnh chia sẻ — TỰ TẠO lúc dev/build, không commit
scripts/content-assets.js    tạo public/generated/ + thẻ chia sẻ (Open Graph) trong index.html

src/
  main.jsx, Root.jsx         điểm khởi động; Root chọn Cửa hàng hay Quản trị theo URL
  shared/                    DÙNG CHUNG cho cả cửa hàng và quản trị
    content.js               nạp dữ liệu từ content/
    catalog.js               danh mục, bộ lọc, sắp xếp, phân trang
    price.js                 giá tiền & phân loại sản phẩm
    currency.js              bộ tính công thức quy đổi tiền (an toàn, không dùng eval)
    guide.js, theme.js       hướng dẫn mặc định; bảng màu website
    text.js                  bỏ dấu, tạo slug, tách đoạn văn
    useHash.js               theo dõi đường dẫn #/...
    useModalDialog.js        mở <dialog> + khóa cuộn trang
  store/                     CỬA HÀNG (khách xem)
    StoreApp.jsx             khung trang: header, trang hiện tại, footer
    routes.js                danh sách các trang (thêm trang mới ở đây)
    cart.js                  giỏ hàng (lưu trong localStorage)
    useStorefrontTheme.js    áp bảng màu (kể cả bản xem thử từ trang quản trị)
    pages/                   Home, Products, Cart, Currency, Guide
    components/              Header, Footer, ProductCard, ProductModal, ProductCarousel,
                             CatalogFilters, Pagination, QtyStepper, ProductImage, Icon, GuideContent
    styles/                  CSS chia theo khu vực; index.css quy định thứ tự nạp
  admin/                     TRANG QUẢN TRỊ (#/admin, chỉ tải khi cần)
    Admin.jsx                khung trang, đăng nhập, chuyển tab
    useAdminData.js          tải dữ liệu + các thao tác lưu (mỗi lần lưu = 1 commit)
    AdminTopBar.jsx, LoginScreen.jsx
    api/                     config (repo, nhánh, Worker), đăng nhập, GitHub API, xử lý ảnh
    tabs/                    Tổng quan, Sản phẩm (+ ProductEditor), Danh mục, Hướng dẫn,
                             Tiền tệ, Cài đặt (+ ThemeEditor)
    components/              AdminIcon, ImageField, ProductRow
    hooks/useDraft.js        bản nháp form: thay đổi chưa lưu, đang lưu, lỗi
    styles/                  CSS trang quản trị
.github/workflows/deploy.yml tự động build & deploy
```
