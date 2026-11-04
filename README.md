# Ichiyo – Website trưng bày sản phẩm

React + Vite, deploy bằng GitHub Pages, quản trị nội dung bằng Decap CMS.
Nội dung (sản phẩm, ảnh, thông tin) được lưu thành file trong thư mục `content/` và `public/uploads/`
ngay trong repo → không bao giờ mất khi thoát trình duyệt.

## Cách hoạt động
1. Vào `https://saito205.github.io/T-p-h-a-Ichiyo/admin/` → đăng nhập GitHub.
2. Thêm / sửa / xoá sản phẩm → bấm **Publish** → Decap tạo 1 commit vào nhánh `main`.
3. GitHub Actions tự build và deploy lại (khoảng 1–2 phút) → web cập nhật.

## Cài đặt (làm 1 lần)

### 1. Đẩy code lên GitHub
Dán toàn bộ file trong zip vào thư mục repo (ghi đè), rồi:
```bash
git add .
git commit -m "Website trung bay san pham + Decap CMS"
git push
```
(Tuỳ chọn) xoá file thừa của template cũ: `src/App.css`, `src/assets/`, `public/icons.svg`.

### 2. Bật GitHub Pages
Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Sau khi workflow chạy xong, web nằm ở `https://saito205.github.io/T-p-h-a-Ichiyo/`.
(Repo cần ở chế độ **Public** nếu dùng gói GitHub miễn phí.)

### 3. Tạo cổng đăng nhập cho CMS (miễn phí)
GitHub Pages chỉ là hosting tĩnh nên không tự xử lý được đăng nhập GitHub của Decap.
Cần 1 Cloudflare Worker nhỏ làm "OAuth proxy":

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
   - Homepage URL: `https://saito205.github.io/T-p-h-a-Ichiyo/`
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
3. Mở `public/admin/config.yml`, sửa dòng `base_url:` thành địa chỉ Worker của bạn, rồi commit + push.

Xong! Vào `/admin/` để quản lý nội dung.

## Chạy thử trên máy
```bash
npm install
npm run dev            # web: http://localhost:5173/
npx decap-server       # (cửa sổ khác) để dùng /admin/ cục bộ không cần đăng nhập
```

## Cấu trúc
```
content/site.json            thông tin chung, liên hệ
content/products/*.json      mỗi sản phẩm 1 file
public/uploads/              ảnh upload qua CMS
public/admin/                Decap CMS (index.html + config.yml)
src/                         giao diện React
.github/workflows/deploy.yml tự động build & deploy
```
