import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' + HashRouter => chạy đúng trên mọi đường dẫn GitHub Pages
// (https://user.github.io/ten-repo/) hoặc tên miền riêng.
export default defineConfig({
  base: './',
  plugins: [react()],
})
