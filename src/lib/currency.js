// Bộ phân tích số học riêng: không thực thi JavaScript, không dùng eval/Function.
const functions = {
  round: { arity: 1, run: Math.round },
  floor: { arity: 1, run: Math.floor },
  ceil: { arity: 1, run: Math.ceil },
  abs: { arity: 1, run: Math.abs },
  min: { arity: 2, run: Math.min },
  max: { arity: 2, run: Math.max },
}
const finite = (value) => {
  if (!Number.isFinite(value)) throw new Error('Kết quả quá lớn hoặc không hợp lệ.')
  return value
}
function evaluate(node, x) {
  if (node.type === 'number') return node.value
  if (node.type === 'x') return x
  const args = node.args.map((arg) => evaluate(arg, x))
  if (node.type === 'call') return finite(functions[node.op].run(...args))
  if (node.type === 'unary') return node.op === '-' ? -args[0] : args[0]
  const [a, b] = args
  if (node.op === '/' && b === 0) throw new Error('Công thức chia cho 0 với số tiền này.')
  return finite(node.op === '+' ? a + b : node.op === '-' ? a - b : node.op === '*' ? a * b : a / b)
}
export function compileFormula(formula) {
  const source = String(formula ?? '').trim()
  if (!source) throw new Error('Hãy nhập công thức.')
  if (source.length > 300) throw new Error('Công thức tối đa 300 ký tự.')
  const tokens = []
  for (let pos = 0; pos < source.length;) {
    if (/\s/.test(source[pos])) { pos++; continue }
    const match = /^(?:\d+(?:\.\d*)?|\.\d+|[a-zA-Z]+|[+*/(),-])/.exec(source.slice(pos))
    if (!match) throw new Error(`Ký tự không hợp lệ ở vị trí ${pos + 1}. Dùng dấu chấm cho số thập phân.`)
    tokens.push(match[0].toLowerCase())
    pos += match[0].length
  }
  let index = 0
  let hasX = false
  const take = () => tokens[index++]
  const expect = (token) => {
    if (take() !== token) throw new Error(`Thiếu hoặc sai dấu ${token}.`)
  }
  function primary() {
    const token = take()
    if (token === 'x') { hasX = true; return { type: 'x' } }
    if (/^(?:\d|\.)/.test(token || '')) return { type: 'number', value: finite(Number(token)) }
    if (token === '(') { const node = expression(); expect(')'); return node }
    if (Object.hasOwn(functions, token)) {
      expect('(')
      const args = [expression()]
      while (tokens[index] === ',') { take(); args.push(expression()) }
      expect(')')
      if (args.length !== functions[token].arity) throw new Error(`${token} cần ${functions[token].arity} tham số.`)
      return { type: 'call', op: token, args }
    }
    throw new Error('Công thức chỉ nhận số, x, + - * /, ngoặc và round/floor/ceil/abs/min/max.')
  }
  function unary() {
    if (tokens[index] === '+' || tokens[index] === '-') return { type: 'unary', op: take(), args: [unary()] }
    return primary()
  }
  function product() {
    let node = unary()
    while (tokens[index] === '*' || tokens[index] === '/') node = { type: 'binary', op: take(), args: [node, unary()] }
    return node
  }
  function expression() {
    let node = product()
    while (tokens[index] === '+' || tokens[index] === '-') node = { type: 'binary', op: take(), args: [node, product()] }
    return node
  }
  const ast = expression()
  if (index !== tokens.length) throw new Error('Sai cú pháp. Viết phép nhân rõ ràng, ví dụ x * (2 + 3).')
  if (!hasX) throw new Error('Công thức phải có x là số tiền đầu vào.')
  // Kiểm tra cả các nhánh hằng số, bắt x / 0 trước khi lưu.
  function checkConstants(node) {
    if (node.type === 'x') return false
    const children = (node.args || []).map(checkConstants)
    if (node.type === 'binary' && node.op === '/' && children[1] && evaluate(node.args[1], 0) === 0)
      throw new Error('Công thức không được chia cho 0.')
    const constant = children.every(Boolean)
    if (constant) evaluate(node, 0)
    return constant
  }
  checkConstants(ast)
  return (x) => {
    if (!Number.isFinite(x) || x < 0) throw new Error('Số tiền phải là số không âm hợp lệ.')
    const result = evaluate(ast, x)
    if (result < 0) throw new Error('Công thức cho kết quả âm. Hãy kiểm tra số tiền hoặc liên hệ quản trị viên.')
    return Object.is(result, -0) ? 0 : result
  }
}

export function parseAmount(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return null
  // Quy ước Việt Nam: dấu chấm nhóm nghìn; dấu phẩy thập phân.
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{0,8})?$/.test(text))
    throw new Error('Nhập số không âm, ví dụ 100000 hoặc 100.000,50 (dấu phẩy thập phân).')
  const value = Number(text.replace(/\./g, '').replace(',', '.'))
  if (!Number.isFinite(value) || value > 1e15) throw new Error('Số tiền tối đa là 1.000.000.000.000.000.')
  return value
}
export const formatMoney = (amount, decimals = 2) => new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 0, maximumFractionDigits: decimals,
}).format(amount)
export const normalizeCurrency = (raw) => ({
  title: typeof raw?.title === 'string' ? raw.title : 'Quy đổi tiền tệ',
  note: typeof raw?.note === 'string' ? raw.note : 'Áp dụng công thức quy đổi riêng của cửa hàng.',
  currencies: (Array.isArray(raw?.currencies) ? raw.currencies : []).filter((c) => c && typeof c === 'object').map((c, i) => ({
    id: String(c.id || `currency-${i}`), code: String(c.code || '').trim().toUpperCase(),
    name: String(c.name || ''), enabled: c.enabled !== false,
    decimals: Number.isInteger(c.decimals) && c.decimals >= 0 && c.decimals <= 8 ? c.decimals : 2,
    fromVnd: String(c.fromVnd || ''), toVnd: String(c.toVnd || ''),
  })),
})
export function validateCurrency(config) {
  if (!config.title.trim()) throw new Error('Hãy nhập tiêu đề trang.')
  const codes = new Set(['VND'])
  const ids = new Set()
  for (const c of config.currencies) {
    if (!/^[A-Z][A-Z0-9_]{1,11}$/.test(c.code)) throw new Error('Mã tiền gồm 2–12 ký tự: A–Z, 0–9 hoặc _, bắt đầu bằng chữ.')
    if (codes.has(c.code)) throw new Error(`Mã ${c.code} bị trùng hoặc dành riêng cho tiền Việt.`)
    codes.add(c.code)
    if (!c.id || ids.has(c.id)) throw new Error('ID tiền tệ không hợp lệ hoặc bị trùng.')
    ids.add(c.id)
    if (!c.name.trim()) throw new Error(`Hãy nhập tên cho ${c.code}.`)
    if (!Number.isInteger(c.decimals) || c.decimals < 0 || c.decimals > 8) throw new Error('Số chữ số thập phân phải từ 0 đến 8.')
    for (const [key, label] of [['fromVnd', `VND → ${c.code}`], ['toVnd', `${c.code} → VND`]]) {
      try { compileFormula(c[key]) } catch (e) { throw new Error(`${label}: ${e.message}`) }
    }
  }
  return config
}
export function convertAmount(amount, currency, reverse = false) {
  const result = compileFormula(reverse ? currency.toVnd : currency.fromVnd)(amount)
  if (result > 1e15) throw new Error('Kết quả vượt giới hạn 1.000.000.000.000.000. Hãy nhập số tiền nhỏ hơn.')
  return result
}
