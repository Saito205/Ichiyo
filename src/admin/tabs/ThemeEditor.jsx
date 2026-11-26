import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  contrastRatio,
  defaultTheme,
  normalizeHex,
  normalizeTheme,
  themeFields,
  themePresets,
  themeVariables,
} from '../../shared/theme.js'

const groups = [...new Set(themeFields.map((f) => f.group))]
const previewRoutes = [
  ['', 'Trang chủ'],
  ['products', 'Sản phẩm'],
  ['guide', 'Hướng dẫn'],
  ['cart', 'Giỏ hàng'],
  ['currency', 'Đổi tiền'],
]

// Bản thu nhỏ của website với bảng màu đang chọn.
function ThemeSample({ theme, siteName }) {
  return (
    <div className="theme-sample" style={themeVariables(theme)}>
      <div className="theme-sample-header">
        <strong>{siteName || 'Ichiyo'}</strong>
        <span>Sản phẩm · Đổi tiền</span>
      </div>
      <div className="theme-sample-body">
        <span className="theme-sample-tag">Màu riêng của cửa hàng</span>
        <h3>Chào mừng bạn ghé tiệm</h3>
        <p>Đây là màu chữ phụ và nền của website.</p>
        <div className="theme-sample-card">
          <div className="theme-sample-art">一</div>
          <strong>Sản phẩm minh họa</strong>
          <span className="theme-sample-price">150.000 ₫</span>
          <p>Nội dung chính hiển thị tại đây.</p>
        </div>
        <button type="button" className="theme-sample-button">
          Nút chính · rê chuột để thử
        </button>
        <div className="theme-sample-error">Mẫu thông báo lỗi</div>
      </div>
      <div className="theme-sample-footer">Liên hệ cửa hàng · Chữ cuối trang</div>
    </div>
  )
}

// Xem thử toàn trang trong iframe: gửi bảng màu nháp sang trang cửa hàng (xem store/useStorefrontTheme.js).
function FullPreview({ theme }) {
  const [route, setRoute] = useState('')
  const frame = useRef(null)
  const sendPreview = useCallback(
    () => frame.current?.contentWindow?.postMessage({ type: 'ichiyo-theme-preview', theme }, window.location.origin),
    [theme],
  )
  useEffect(() => {
    sendPreview()
    const ready = (e) => {
      if (
        e.origin === window.location.origin &&
        e.source === frame.current?.contentWindow &&
        e.data?.type === 'ichiyo-theme-ready'
      )
        sendPreview()
    }
    window.addEventListener('message', ready)
    return () => window.removeEventListener('message', ready)
  }, [sendPreview, route])

  return (
    <div className="theme-full-preview">
      <div className="theme-preview-toolbar">
        <strong>Bản xem thử · chưa lưu</strong>
        <label>
          Trang xem thử
          <select value={route} onChange={(e) => setRoute(e.target.value)}>
            {previewRoutes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <iframe
        ref={frame}
        title="Xem thử màu website"
        src={`${import.meta.env.BASE_URL}?theme-preview=1#/${route}`}
        onLoad={sendPreview}
      />
    </div>
  )
}

export default function ThemeEditor({ value, onChange, siteName }) {
  const [fullPreview, setFullPreview] = useState(false)
  const theme = useMemo(() => normalizeTheme(value), [value])
  const setColor = (key, color) => onChange({ ...value, [key]: color })
  const invalid = themeFields.filter((f) => !normalizeHex(value?.[f.key]))
  const lowContrast = [
    ['Chữ trên nút', theme.onPrimary, theme.primary],
    ['Nội dung chính', theme.text, theme.background],
    ['Nội dung phụ', theme.muted, theme.background],
    ['Giá tiền & liên kết', theme.primary, theme.background],
    ['Chữ cuối trang', theme.footerText, theme.footer],
  ].filter(([, a, b]) => contrastRatio(a, b) < 4.5)
  const resetColors = () => {
    if (window.confirm('Đưa toàn bộ màu về mặc định xanh Ichiyo? Thay đổi chỉ được lưu khi bấm Lưu cài đặt.'))
      onChange({ ...defaultTheme })
  }

  return (
    <section className="theme-editor" aria-labelledby="theme-editor-title">
      <div className="theme-heading">
        <div>
          <h2 id="theme-editor-title">Màu sắc website</h2>
          <p>Chọn màu bằng bảng màu hoặc nhập mã HEX. Bấm “Lưu cài đặt” bên dưới để áp dụng.</p>
        </div>
        <button type="button" className="ad-btn ghost" onClick={resetColors}>
          Khôi phục màu mặc định
        </button>
      </div>

      <div className="theme-presets" aria-label="Bảng màu gợi ý">
        {themePresets.map((preset) => (
          <button
            type="button"
            key={preset.name}
            className="theme-preset"
            onClick={() => onChange({ ...preset.colors })}
          >
            <span className="theme-swatches" aria-hidden="true">
              {['primary', 'accent', 'soft', 'footer'].map((k) => (
                <i key={k} style={{ background: preset.colors[k] }} />
              ))}
            </span>
            {preset.name}
          </button>
        ))}
      </div>

      <div className="theme-layout">
        <div className="theme-controls">
          {groups.map((group) => (
            <details key={group} open className="theme-group">
              <summary>{group}</summary>
              {themeFields
                .filter((f) => f.group === group)
                .map((f) => {
                  const valid = !!normalizeHex(value?.[f.key])
                  return (
                    <div className="theme-color-row" key={f.key}>
                      <label htmlFor={`theme-${f.key}`}>{f.label}</label>
                      <div className="theme-color-inputs">
                        <input
                          type="color"
                          aria-label={`Chọn ${f.label.toLowerCase()}`}
                          value={theme[f.key]}
                          onChange={(e) => setColor(f.key, e.target.value)}
                        />
                        <input
                          id={`theme-${f.key}`}
                          className="ad-input theme-hex"
                          value={value?.[f.key] ?? ''}
                          maxLength={7}
                          spellCheck={false}
                          autoComplete="off"
                          aria-invalid={!valid}
                          aria-describedby={valid ? undefined : 'theme-errors'}
                          onChange={(e) => setColor(f.key, e.target.value)}
                        />
                      </div>
                    </div>
                  )
                })}
            </details>
          ))}
        </div>
        <div className="theme-preview-column">
          <p className="theme-preview-label">XEM TRƯỚC MÀU SẮC</p>
          <ThemeSample theme={theme} siteName={siteName} />
          {lowContrast.length > 0 && (
            <p className="theme-contrast" role="status">
              Có thể khó đọc: {lowContrast.map(([label]) => label).join(', ')}. Bạn có thể tăng độ khác
              biệt giữa màu chữ và nền.
            </p>
          )}
          <p className="ad-hint">
            Áp dụng cho các trang khách hàng, gồm cả Đổi tiền. Màu ảnh/logo gốc giữ nguyên; giao diện
            admin giữ màu riêng để luôn dễ thao tác.
          </p>
          <button type="button" className="ad-btn ghost" onClick={() => setFullPreview((v) => !v)}>
            {fullPreview ? 'Đóng xem thử toàn trang' : 'Xem thử toàn trang'}
          </button>
        </div>
      </div>

      {invalid.length > 0 && (
        <p className="theme-validation" id="theme-errors" role="alert">
          Mã màu chưa hợp lệ: {invalid.map((f) => f.label).join(', ')}. Dùng #RRGGBB hoặc #RGB; màu sai
          đang tạm hiển thị bằng màu mặc định.
        </p>
      )}
      {fullPreview && <FullPreview theme={theme} />}
    </section>
  )
}
