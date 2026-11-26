// Các hàm xử lý chữ dùng chung cho cửa hàng và trang quản trị.

// Bỏ dấu tiếng Việt + chữ thường: dùng để tìm kiếm và so trùng tên ("Bìa Lạnh" ~ "bia lanh").
export const searchText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()

// Chuỗi an toàn cho mã / tên file: "Bìa lạnh 2mm" -> "bia-lanh-2mm".
export const slugify = (value) =>
  searchText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'muc'

// Mã không trùng với danh sách đã có: "bia-lanh", "bia-lanh-2", ...
export function uniqueId(label, taken = []) {
  const base = slugify(label)
  let id = base
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`
  return id
}

// Tách văn bản thành các đoạn (cách nhau bởi một dòng trống).
export const paragraphs = (text) =>
  (text || '')
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean)
