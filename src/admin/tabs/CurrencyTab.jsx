import { useState } from 'react'
import { compileFormula, convertAmount, formatMoney, parseAmount, validateCurrency } from '../../shared/currency.js'
import useDraft from '../hooks/useDraft.js'

// Kết quả thử của một công thức với số tiền mẫu (hoặc lỗi của công thức).
function FormulaPreview({ formula, sample, decimals }) {
  let text
  let error = ''
  try {
    compileFormula(formula)
    const amount = parseAmount(sample)
    text =
      amount === null
        ? 'Nhập số tiền thử để xem kết quả.'
        : `Kết quả thử: ${formatMoney(convertAmount(amount, { fromVnd: formula }), decimals)}`
  } catch (e) {
    error = e.message
  }
  if (error) {
    return (
      <span className="fx-admin-invalid" role="status">
        {error}
      </span>
    )
  }
  return <span className="fx-admin-preview">{text}</span>
}

// Một chiều quy đổi (VND → X hoặc X → VND): ô công thức + ô số tiền thử.
function DirectionFields({ currency, direction, sample, onSample, onFormula }) {
  const code = currency.code || 'Loại tiền'
  const fromVnd = direction === 'fromVnd'
  return (
    <div className="fx-admin-direction">
      <label className="ad-field">
        <span className="ad-label">Công thức {fromVnd ? `VND → ${code}` : `${code} → VND`}</span>
        <input
          className="ad-input fx-formula-input"
          required
          maxLength={300}
          placeholder={fromVnd ? 'x / 25000' : 'x * 25000'}
          spellCheck={false}
          value={currency[direction]}
          onChange={(e) => onFormula(e.target.value)}
        />
      </label>
      <label className="ad-field">
        <span className="ad-label">Số tiền thử ({fromVnd ? 'VND' : code})</span>
        <input
          className="ad-input"
          inputMode="decimal"
          maxLength={40}
          value={sample}
          onChange={(e) => onSample(e.target.value)}
        />
      </label>
      <FormulaPreview formula={currency[direction]} sample={sample} decimals={fromVnd ? currency.decimals : 0} />
    </div>
  )
}

function CurrencyCard({ currency: c, index, samples, setSample, update, onRemove }) {
  return (
    <section className="ad-card fx-admin-card" aria-label={`Loại tiền ${index + 1}`}>
      <div className="fx-admin-row">
        <h3>{c.code || `Loại tiền ${index + 1}`}</h3>
        <div className="fx-admin-actions">
          <label>
            <input type="checkbox" checked={c.enabled} onChange={(e) => update('enabled', e.target.checked)} />{' '}
            Hiển thị trên website
          </label>
          <button type="button" className="ad-btn ghost" onClick={onRemove}>
            Xóa loại tiền
          </button>
        </div>
      </div>
      <div className="fx-admin-meta">
        <label className="ad-field">
          <span className="ad-label">Mã tiền</span>
          <input
            className="ad-input"
            required
            maxLength={12}
            placeholder="USD, CNY, XU…"
            value={c.code}
            onChange={(e) => update('code', e.target.value.toUpperCase())}
          />
        </label>
        <label className="ad-field">
          <span className="ad-label">Tên loại tiền</span>
          <input
            className="ad-input"
            required
            maxLength={80}
            placeholder="Ví dụ: Đô la Mỹ"
            value={c.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </label>
        <label className="ad-field">
          <span className="ad-label">Chữ số thập phân</span>
          <select className="ad-input" value={c.decimals} onChange={(e) => update('decimals', Number(e.target.value))}>
            {Array.from({ length: 9 }, (_, n) => (
              <option key={n} value={n}>
                {n} chữ số
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="fx-admin-directions">
        {[
          ['fromVnd', '100000'],
          ['toVnd', '10'],
        ].map(([direction, initialSample]) => (
          <DirectionFields
            key={direction}
            currency={c}
            direction={direction}
            sample={samples[`${c.id}:${direction}`] ?? initialSample}
            onSample={(value) => setSample(`${c.id}:${direction}`, value)}
            onFormula={(value) => update(direction, value)}
          />
        ))}
      </div>
    </section>
  )
}

const trimCurrency = (form) => ({
  ...form,
  title: form.title.trim(),
  note: form.note.trim(),
  currencies: form.currencies.map((c) => ({
    ...c,
    name: c.name.trim(),
    code: c.code.trim().toUpperCase(),
    fromVnd: c.fromVnd.trim(),
    toVnd: c.toVnd.trim(),
  })),
})

export default function CurrencyTab({ config, onSave, onDirtyChange }) {
  const { draft, setDraft, dirty, busy, error, setError, save, field } = useDraft(() => structuredClone(config), {
    onDirtyChange,
  })
  const [samples, setSamples] = useState({}) // số tiền thử, không lưu vào file

  const update = (id, key, value) =>
    setDraft((prev) => ({
      ...prev,
      currencies: prev.currencies.map((c) => (c.id === id ? { ...c, [key]: value } : c)),
    }))
  const add = () =>
    setDraft((prev) => ({
      ...prev,
      currencies: [
        ...prev.currencies,
        { id: crypto.randomUUID(), code: '', name: '', enabled: true, decimals: 2, fromVnd: '', toVnd: '' },
      ],
    }))
  const remove = (currency) => {
    const message = `Xóa loại tiền ${currency.code || 'chưa đặt tên'}? Thay đổi chỉ được áp dụng khi bấm Lưu tiền tệ.`
    if (window.confirm(message))
      setDraft((prev) => ({ ...prev, currencies: prev.currencies.filter((c) => c.id !== currency.id) }))
  }

  const submit = (event) => {
    event.preventDefault()
    if (busy) return
    let next
    try {
      next = validateCurrency(trimCurrency(draft))
    } catch (e) {
      return setError(e.message)
    }
    save(async () => {
      await onSave(next)
      return next
    })
  }

  return (
    <form onSubmit={submit} className="fx-admin">
      <fieldset disabled={busy} className="admin-fieldset">
        <div className="admin-section-heading">
          <div>
            <h2>Tiền tệ & công thức</h2>
            <p>Tự đặt cách quy đổi giữa VND và từng loại tiền.</p>
          </div>
          <button type="button" className="ad-btn" onClick={add}>
            + Thêm loại tiền
          </button>
        </div>
        <div className="ad-card fx-admin-settings">
          <label className="ad-field">
            <span className="ad-label">Tiêu đề trang</span>
            <input className="ad-input" required maxLength={120} {...field('title')} />
          </label>
          <label className="ad-field">
            <span className="ad-label">Lưu ý hiển thị cho người dùng</span>
            <textarea className="ad-input" rows={2} maxLength={1000} {...field('note')} />
          </label>
          <details className="fx-formula-help" open>
            <summary>Cách viết công thức</summary>
            <p>
              <code>x</code> là số tiền nhập vào ở từng chiều. Hỗ trợ <code>+ - * / ( )</code> và{' '}
              <code>round, floor, ceil, abs, min, max</code>.
            </p>
            <p>
              Ví dụ giả định: VND → USD dùng <code>(x - 5000) / 25000</code>; USD → VND dùng{' '}
              <code>x * 25000 + 5000</code>. Hai công thức được lưu độc lập.
            </p>
            <p>
              Phí 2%: <code>x * 0.98</code>. Làm tròn xuống: <code>floor(x / 25000)</code>. Chặn kết
              quả âm: <code>max(0, (x - 5000) / 25000)</code>.
            </p>
            <p>
              Trong công thức dùng số <strong>không có dấu phân cách nghìn</strong> và dấu chấm thập
              phân: <code>25000</code>, <code>0.98</code>. Dấu phẩy chỉ ngăn tham số của min/max.
            </p>
            <p>
              VND được làm tròn đến số nguyên. Kết quả âm, chia cho 0 và vượt giới hạn sẽ hiện lỗi
              khi quy đổi.
            </p>
          </details>
        </div>
        {!draft.currencies.length && (
          <div className="ad-empty">Chưa có loại tiền nào. Bấm “Thêm loại tiền” để bắt đầu.</div>
        )}
        {draft.currencies.map((c, i) => (
          <CurrencyCard
            key={c.id}
            currency={c}
            index={i}
            samples={samples}
            setSample={(key, value) => setSamples((s) => ({ ...s, [key]: value }))}
            update={(key, value) => update(c.id, key, value)}
            onRemove={() => remove(c)}
          />
        ))}
        {error && (
          <p className="ad-error admin-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="admin-save-bar">
          <span className="ad-hint">
            {dirty ? 'Có thay đổi chưa lưu. ' : ''}Sau khi lưu, chờ website triển khai xong để khách
            thấy thay đổi.
          </span>
          <button className="ad-btn" type="submit" disabled={!dirty || busy}>
            {busy ? 'Đang lưu…' : 'Lưu tiền tệ'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}
