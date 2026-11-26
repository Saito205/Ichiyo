// Đọc / ghi nội dung website trực tiếp vào repo GitHub (mỗi lần lưu = 1 commit).
import { BRANCH, REPO } from './config.js'

const API = 'https://api.github.com'
let token = ''
export const setAuthToken = (t) => {
  token = t || ''
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(path, { method = 'GET', body, raw = false } = {}) {
  const res = await fetch(API + path, {
    method,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let msg = res.statusText
    try {
      msg = (await res.json()).message || msg
    } catch {
      /* bỏ qua */
    }
    if (/fast forward/i.test(msg)) msg = 'Repo vừa có thay đổi mới. Hãy tải lại trang rồi lưu lại.'
    throw new ApiError(msg, res.status)
  }
  return raw ? res.text() : res.json()
}

const repo = (p = '') => `/repos/${REPO}${p}`
export const getRepo = () => request(repo())
export const getUser = () => request('/user')

// Đọc 1 file JSON trong repo. Có `fallback` thì trả về nó khi file chưa tồn tại (404).
async function readJson(path, fallback) {
  try {
    return JSON.parse(await request(repo(`/contents/${path}?ref=${BRANCH}`), { raw: true }))
  } catch (e) {
    if (e.status === 404 && fallback !== undefined) return fallback
    throw e
  }
}

export const loadSite = () => readJson('content/site.json', {})
export const loadCatalog = () => readJson('content/catalog.json', null)
export const loadGuide = () => readJson('content/guide.json', null)
export const loadCurrency = () => readJson('content/currency.json', null)

export async function loadProducts() {
  let items
  try {
    items = await request(repo(`/contents/content/products?ref=${BRANCH}`))
  } catch (e) {
    if (e.status === 404) return []
    throw e
  }
  const files = items.filter((i) => i.type === 'file' && i.name.endsWith('.json'))
  return Promise.all(
    files.map(async (f) => ({ slug: f.name.replace(/\.json$/, ''), data: await readJson(f.path) })),
  )
}

// File JSON để đưa vào commitFiles: định dạng 2 dấu cách + xuống dòng cuối file.
export const jsonFile = (path, data) => ({ path, text: JSON.stringify(data, null, 2) + '\n' })

function bytesToBase64(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000)
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  return btoa(s)
}
const blobToBase64 = async (blob) => bytesToBase64(new Uint8Array(await blob.arrayBuffer()))
const textToBase64 = (t) => bytesToBase64(new TextEncoder().encode(t))

// Gộp nhiều file (ảnh + json) thành đúng 1 commit => website chỉ build lại 1 lần.
// files: { path, text } | { path, blob } | { path, remove: true }
export async function commitFiles(message, files) {
  const ref = await request(repo(`/git/ref/heads/${BRANCH}`))
  const parent = ref.object.sha
  const commit = await request(repo(`/git/commits/${parent}`))
  const tree = await Promise.all(
    files.map(async (f) => {
      if (f.remove) return { path: f.path, mode: '100644', type: 'blob', sha: null }
      const content = f.blob ? await blobToBase64(f.blob) : textToBase64(f.text)
      const blob = await request(repo('/git/blobs'), {
        method: 'POST',
        body: { content, encoding: 'base64' },
      })
      return { path: f.path, mode: '100644', type: 'blob', sha: blob.sha }
    }),
  )
  const newTree = await request(repo('/git/trees'), {
    method: 'POST',
    body: { base_tree: commit.tree.sha, tree },
  })
  const created = await request(repo('/git/commits'), {
    method: 'POST',
    body: { message, tree: newTree.sha, parents: [parent] },
  })
  await request(repo(`/git/refs/heads/${BRANCH}`), { method: 'PATCH', body: { sha: created.sha } })
}
