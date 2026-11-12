import { useState } from 'react'
import { currency as publishedCurrency } from '../content.js'
import { convertAmount, formatMoney, parseAmount } from '../lib/currency.js'
import Icon from '../components/Icon.jsx'
import './currency.css'

export default function Currency({ config = publishedCurrency }) {
  const available = config.currencies.filter((c) => c.enabled)
  const [selected, setSelected] = useState(available[0]?.id || '')
  const [reverse, setReverse] = useState(false)
  const [input, setInput] = useState('')
  const current = available.find((c) => c.id === selected) || available[0]
  const from = reverse ? current?.code : 'VND'
  const to = reverse ? 'VND' : current?.code
  let result = ''
  let error = ''
  try {
    const amount = parseAmount(input)
    if (amount !== null && current) result = formatMoney(convertAmount(amount, current, reverse), reverse ? 0 : current.decimals)
  } catch (e) { error = e.message }
  return (
    <section className="wrap fx-page">
      <div className="fx-heading">
        <span className="fx-eyebrow">CÔNG CỤ CỦA CỬA HÀNG</span>
        <h1>{config.title}</h1>
        <p>Nhập số tiền, nhận kết quả ngay. Chuyển đổi hai chiều với công thức riêng.</p>
      </div>
      {!current ? (
        <div className="fx-empty" role="status">Chưa có loại tiền đang hoạt động. Vui lòng quay lại sau.</div>
      ) : (
        <div className="fx-panel">
          <div className="fx-toolbar">
            <label className="fx-select-label" htmlFor="fx-currency">Loại tiền quy đổi
              <select id="fx-currency" value={current.id} onChange={(e) => setSelected(e.target.value)}>
                {available.map((c) => <option value={c.id} key={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </label>
            <span className="fx-live"><span className="dot" /> Tự động tính khi nhập</span>
          </div>
          <div className="fx-fields">
            <div className="fx-field">
              <label htmlFor="fx-amount">Số tiền cần đổi</label>
              <div className={`fx-money ${error ? 'fx-invalid' : ''}`}>
                <input id="fx-amount" inputMode="decimal" autoComplete="off" spellCheck={false} maxLength={40}
                  placeholder="0" value={input} onChange={(e) => setInput(e.target.value)}
                  aria-invalid={!!error} aria-describedby={error ? 'fx-error fx-help' : 'fx-help'} />
                <span className="fx-unit">{from}</span>
              </div>
              <span className="fx-caption">{reverse ? current.name : 'Việt Nam đồng'}</span>
            </div>
            <button className="fx-swap" type="button" onClick={() => { setReverse((v) => !v); setInput(result || input) }}
              title="Đảo chiều quy đổi" aria-label="Đảo chiều quy đổi"><Icon name="currency" size={24} /></button>
            <div className="fx-field fx-result">
              <label htmlFor="fx-result">Số tiền quy đổi</label>
              <div className="fx-money">
                <input id="fx-result" value={error ? '' : result} readOnly placeholder="—" aria-describedby="fx-rounding" />
                <span className="fx-unit">{to}</span>
              </div>
              <span className="fx-caption">{reverse ? 'Việt Nam đồng' : current.name}</span>
            </div>
          </div>
          <div className="fx-bottom">
            <p id="fx-help">Ví dụ: <strong>100000</strong> hoặc <strong>100.000,50</strong>. Dùng dấu phẩy cho phần thập phân.</p>
            <button type="button" className="fx-clear" onClick={() => setInput('')}>Xóa số tiền</button>
          </div>
          <div aria-live="polite" aria-atomic="true">
            {error ? <p id="fx-error" className="fx-error" role="alert">{error}</p> : result !== '' &&
              <p className="fx-summary">{input} {from} <span>→</span> <strong>{result} {to}</strong></p>}
          </div>
          <p id="fx-rounding" className="fx-rounding">Kết quả được làm tròn đến {reverse ? 0 : current.decimals} chữ số thập phân. Mỗi chiều áp dụng công thức riêng.</p>
        </div>
      )}
      {config.note && <aside className="fx-note"><Icon name="info" size={20} /><p>{config.note}</p></aside>}
    </section>
  )
}
