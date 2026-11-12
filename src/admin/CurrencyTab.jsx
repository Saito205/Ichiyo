import { useState } from 'react'
import { compileFormula, convertAmount, formatMoney, parseAmount, validateCurrency } from '../lib/currency.js'
import useUnsavedChanges from './useUnsavedChanges.js'
import './currency-admin.css'

function FormulaPreview({ formula, sample, decimals }) {
  try {
    compileFormula(formula)
    const amount = parseAmount(sample)
    return <span className="fx-admin-preview">{amount === null ? 'Nhập số tiền thử để xem kết quả.' : `Kết quả thử: ${formatMoney(convertAmount(amount, { fromVnd: formula }), decimals)}`}</span>
  } catch (e) {
    return <span className="fx-admin-invalid" role="status">{e.message}</span>
  }
}
export default function CurrencyTab({ config, onSave, onDirtyChange }) {
  const [form, setForm] = useState(() => structuredClone(config))
  const [baseline, setBaseline] = useState(() => JSON.stringify(config))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [samples, setSamples] = useState({})
  const dirty = JSON.stringify(form) !== baseline
  useUnsavedChanges(dirty, onDirtyChange)
  const update = (id, key, value) => setForm((prev) => ({ ...prev,
    currencies: prev.currencies.map((c) => c.id === id ? { ...c, [key]: value } : c),
  }))
  const add = () => setForm((prev) => ({ ...prev, currencies: [...prev.currencies, {
    id: crypto.randomUUID(), code: '', name: '', enabled: true, decimals: 2, fromVnd: '', toVnd: '',
  }] }))
  const remove = (currency) => {
    if (window.confirm(`Xóa loại tiền ${currency.code || 'chưa đặt tên'}? Thay đổi chỉ được áp dụng khi bấm Lưu tiền tệ.`))
      setForm((prev) => ({ ...prev, currencies: prev.currencies.filter((c) => c.id !== currency.id) }))
  }
  const save = async (event) => {
    event.preventDefault()
    if (busy) return
    setError('')
    try {
      const next = { ...form, title: form.title.trim(), note: form.note.trim(), currencies: form.currencies.map((c) => ({
        ...c, name: c.name.trim(), code: c.code.trim().toUpperCase(), fromVnd: c.fromVnd.trim(), toVnd: c.toVnd.trim(),
      })) }
      validateCurrency(next)
      setBusy(true)
      await onSave(next)
      setForm(next)
      setBaseline(JSON.stringify(next))
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return (
    <form onSubmit={save} className="fx-admin">
      <fieldset disabled={busy} className="admin-fieldset">
        <div className="admin-section-heading">
          <div><h2>Tiền tệ & công thức</h2><p>Tự đặt cách quy đổi giữa VND và từng loại tiền.</p></div>
          <button type="button" className="ad-btn" onClick={add}>+ Thêm loại tiền</button>
        </div>
        <div className="ad-card fx-admin-settings">
          <label className="ad-field"><span className="ad-label">Tiêu đề trang</span>
            <input className="ad-input" required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="ad-field"><span className="ad-label">Lưu ý hiển thị cho người dùng</span>
            <textarea className="ad-input" rows={2} maxLength={1000} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
          <details className="fx-formula-help" open>
            <summary>Cách viết công thức</summary>
            <p><code>x</code> là số tiền nhập vào ở từng chiều. Hỗ trợ <code>+ - * / ( )</code> và <code>round, floor, ceil, abs, min, max</code>.</p>
            <p>Ví dụ giả định: VND → USD dùng <code>(x - 5000) / 25000</code>; USD → VND dùng <code>x * 25000 + 5000</code>. Hai công thức được lưu độc lập.</p>
            <p>Phí 2%: <code>x * 0.98</code>. Làm tròn xuống: <code>floor(x / 25000)</code>. Chặn kết quả âm: <code>max(0, (x - 5000) / 25000)</code>.</p>
            <p>Trong công thức dùng số <strong>không có dấu phân cách nghìn</strong> và dấu chấm thập phân: <code>25000</code>, <code>0.98</code>. Dấu phẩy chỉ ngăn tham số của min/max.</p>
            <p>VND được làm tròn đến số nguyên. Kết quả âm, chia cho 0 và vượt giới hạn sẽ hiện lỗi khi quy đổi.</p>
          </details>
        </div>
        {!form.currencies.length && <div className="ad-empty">Chưa có loại tiền nào. Bấm “Thêm loại tiền” để bắt đầu.</div>}
        {form.currencies.map((c, i) => (
          <section className="ad-card fx-admin-card" key={c.id} aria-label={`Loại tiền ${i + 1}`}>
            <div className="fx-admin-row">
              <h3>{c.code || `Loại tiền ${i + 1}`}</h3>
              <div className="fx-admin-actions">
                <label><input type="checkbox" checked={c.enabled} onChange={(e) => update(c.id, 'enabled', e.target.checked)} /> Hiển thị trên website</label>
                <button type="button" className="ad-btn ghost" onClick={() => remove(c)}>Xóa loại tiền</button>
              </div>
            </div>
            <div className="fx-admin-meta">
              <label className="ad-field"><span className="ad-label">Mã tiền</span>
                <input className="ad-input" required maxLength={12} placeholder="USD, CNY, XU…" value={c.code} onChange={(e) => update(c.id, 'code', e.target.value.toUpperCase())} /></label>
              <label className="ad-field"><span className="ad-label">Tên loại tiền</span>
                <input className="ad-input" required maxLength={80} placeholder="Ví dụ: Đô la Mỹ" value={c.name} onChange={(e) => update(c.id, 'name', e.target.value)} /></label>
              <label className="ad-field"><span className="ad-label">Chữ số thập phân</span>
                <select className="ad-input" value={c.decimals} onChange={(e) => update(c.id, 'decimals', Number(e.target.value))}>
                  {Array.from({ length: 9 }, (_, n) => <option key={n} value={n}>{n} chữ số</option>)}
                </select></label>
            </div>
            <div className="fx-admin-directions">
              {[['fromVnd', `VND → ${c.code || 'Loại tiền'}`, '100000', c.decimals], ['toVnd', `${c.code || 'Loại tiền'} → VND`, '10', 0]].map(([key, label, initial, decimals]) => {
                const sampleKey = `${c.id}:${key}`
                const sample = samples[sampleKey] ?? initial
                return <div className="fx-admin-direction" key={key}>
                  <label className="ad-field"><span className="ad-label">Công thức {label}</span>
                    <input className="ad-input fx-formula-input" required maxLength={300} placeholder={key === 'fromVnd' ? 'x / 25000' : 'x * 25000'} spellCheck={false}
                      value={c[key]} onChange={(e) => update(c.id, key, e.target.value)} /></label>
                  <label className="ad-field"><span className="ad-label">Số tiền thử ({key === 'fromVnd' ? 'VND' : c.code || 'Loại tiền'})</span>
                    <input className="ad-input" inputMode="decimal" maxLength={40} value={sample} onChange={(e) => setSamples({ ...samples, [sampleKey]: e.target.value })} /></label>
                  <FormulaPreview formula={c[key]} sample={sample} decimals={decimals} />
                </div>
              })}
            </div>
          </section>
        ))}
        {error && <p className="ad-error admin-form-error" role="alert">{error}</p>}
        <div className="admin-save-bar">
          <span className="ad-hint">{dirty ? 'Có thay đổi chưa lưu. ' : ''}Sau khi lưu, chờ website triển khai xong để khách thấy thay đổi.</span>
          <button className="ad-btn" type="submit" disabled={!dirty || busy}>{busy ? 'Đang lưu…' : 'Lưu tiền tệ'}</button>
        </div>
      </fieldset>
    </form>
  )
}
