import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import contentAssets from './scripts/content-assets.js'

// Địa chỉ web thật (dùng cho link ảnh khi chia sẻ lên Facebook / Zalo). Đổi nếu dùng tên miền riêng.
const SITE_URL = 'https://saito205.github.io/Ichiyo/'

// Chính sách bảo mật nội dung (CSP): trình duyệt chỉ chạy script của chính website,
// chỉ gọi API GitHub, chỉ tải font Google. Chặn mã lạ nếu có nội dung độc hại lọt vào.
// GitHub Pages không cho đặt header nên CSP được gắn bằng thẻ <meta> lúc build.
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.github.com",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const cspPlugin = {
  name: 'ichiyo-csp',
  apply: 'build', // chế độ dev của Vite cần script nội tuyến nên chỉ bật khi build
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' },
  ],
}

// base './' + đường dẫn dạng "#/..." (xem src/shared/useHash.js) => chạy đúng trên mọi đường dẫn GitHub Pages
// (https://user.github.io/ten-repo/) hoặc tên miền riêng.
export default defineConfig({
  base: './',
  plugins: [react(), cspPlugin, contentAssets({ siteUrl: SITE_URL })],
})
