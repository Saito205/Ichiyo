// Tạo các file ảnh phụ từ nội dung website, chạy tự động mỗi khi `npm run dev` / `npm run build`
// (kể cả khi GitHub Actions build sau mỗi lần lưu ở trang quản trị). Kết quả nằm trong
// public/generated/ (không cần commit, đã có trong .gitignore):
//   thumbs/<tên ảnh>.webp  ảnh thu nhỏ rộng 640px cho thẻ sản phẩm, carousel, giỏ hàng
//   favicon-48.png, icon-192.png, apple-touch-icon.png   biểu tượng tab / màn hình chính, từ logo
//   share.jpg               ảnh 1200×630 hiện khi dán link web lên Facebook / Zalo / Messenger
// Đồng thời gắn tiêu đề, mô tả, thẻ chia sẻ (Open Graph) và biểu tượng vào index.html.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const THUMB_WIDTH = 640
const IMAGE_RE = /\.(webp|jpe?g|png)$/i

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return {}
  }
}
const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const isNewer = (src, out) => fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs
// Đường dẫn trong content ("/uploads/a.webp") -> file trong public/.
const publicFile = (root, p) => (p && !/^(https?:|data:)/.test(p) ? path.join(root, 'public', p.replace(/^\/+/, '')) : '')

async function makeThumbs(root, outDir) {
  const uploads = path.join(root, 'public', 'uploads')
  if (!fs.existsSync(uploads)) return 0
  fs.mkdirSync(outDir, { recursive: true })
  let made = 0
  for (const name of fs.readdirSync(uploads)) {
    if (!IMAGE_RE.test(name)) continue
    const src = path.join(uploads, name)
    const out = path.join(outDir, name.replace(IMAGE_RE, '.webp'))
    if (isNewer(src, out)) continue
    await sharp(src).rotate().resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out)
    made++
  }
  return made
}

async function makeIcons(logo, outDir) {
  if (!logo || !fs.existsSync(logo)) return false
  const square = (size, background) =>
    sharp(logo).resize(size, size, { fit: 'contain', background }).png()
  const clear = { r: 0, g: 0, b: 0, alpha: 0 }
  await square(48, clear).toFile(path.join(outDir, 'favicon-48.png'))
  await square(192, clear).toFile(path.join(outDir, 'icon-192.png'))
  // Màn hình chính iPhone không hỗ trợ nền trong suốt.
  await sharp(logo)
    .resize(150, 150, { fit: 'contain', background: clear })
    .extend({ top: 15, bottom: 15, left: 15, right: 15, background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .png()
    .toFile(path.join(outDir, 'apple-touch-icon.png'))
  return true
}

async function makeShareImage(image, background, outFile) {
  if (!image || !fs.existsSync(image)) return false
  const art = await sharp(image).resize(1100, 560, { fit: 'contain', background }).toBuffer()
  await sharp({ create: { width: 1200, height: 630, channels: 3, background } })
    .composite([{ input: art, gravity: 'center' }])
    .jpeg({ quality: 85 })
    .toFile(outFile)
  return true
}

export default function contentAssets({ siteUrl }) {
  let root = process.cwd()
  let state = { icons: false, share: false }
  const site = () => readJson(path.join(root, 'content', 'site.json'))

  return {
    name: 'ichiyo-content-assets',
    configResolved(config) {
      root = config.root
    },
    async buildStart() {
      const data = site()
      const outDir = path.join(root, 'public', 'generated')
      fs.mkdirSync(outDir, { recursive: true })
      try {
        const thumbs = await makeThumbs(root, path.join(outDir, 'thumbs'))
        const icons = await makeIcons(publicFile(root, data.logo), outDir)
        const share = await makeShareImage(
          publicFile(root, data.heroImage) || publicFile(root, data.logo),
          data.theme?.background || '#ffffff',
          path.join(outDir, 'share.jpg'),
        )
        state = { icons, share }
        if (thumbs) this.info?.(`đã tạo ${thumbs} ảnh thu nhỏ`)
      } catch (e) {
        // Không chặn build: web vẫn chạy bằng ảnh gốc / biểu tượng mặc định.
        this.warn(`Không tạo được ảnh phụ: ${e.message}`)
      }
    },
    transformIndexHtml(html) {
      const data = site()
      const title = data.name || 'Ichiyo'
      const description = data.tagline || data.heroText || 'Trưng bày sản phẩm Ichiyo'
      const tags = [
        `<meta name="description" content="${escapeHtml(description)}" />`,
        `<meta name="theme-color" content="${escapeHtml(data.theme?.primary || '#15804f')}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="${escapeHtml(title)}" />`,
        `<meta property="og:title" content="${escapeHtml(title)}" />`,
        `<meta property="og:description" content="${escapeHtml(description)}" />`,
        `<meta property="og:url" content="${escapeHtml(siteUrl)}" />`,
        `<meta property="og:locale" content="vi_VN" />`,
      ]
      if (state.share) {
        tags.push(
          `<meta property="og:image" content="${escapeHtml(siteUrl)}generated/share.jpg" />`,
          `<meta property="og:image:width" content="1200" />`,
          `<meta property="og:image:height" content="630" />`,
          `<meta name="twitter:card" content="summary_large_image" />`,
        )
      }
      const icons = state.icons
        ? [
            `<link rel="icon" type="image/png" sizes="48x48" href="./generated/favicon-48.png" />`,
            `<link rel="icon" type="image/png" sizes="192x192" href="./generated/icon-192.png" />`,
            `<link rel="apple-touch-icon" href="./generated/apple-touch-icon.png" />`,
          ]
        : [`<link rel="icon" type="image/svg+xml" href="./favicon.svg" />`]
      return html
        .replace(/<title>.*<\/title>/, `<title>${escapeHtml(title)}</title>`)
        .replace(/\s*<meta name="description"[^>]*>/, '')
        .replace(/\s*<link rel="icon"[^>]*>/, '')
        .replace('</head>', `    ${[...icons, ...tags].join('\n    ')}\n  </head>`)
    },
  }
}
