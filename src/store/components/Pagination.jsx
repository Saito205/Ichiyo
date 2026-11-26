import Icon from './Icon.jsx'

// Dãy số trang: luôn có trang đầu, trang cuối và 1 trang quanh trang hiện tại.
// Ví dụ trang 5/9: 1 … 4 5 6 … 9
function pageNumbers(current, total) {
  const keep = new Set([1, total, current - 1, current, current + 1])
  const list = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  return list.flatMap((n, i) => (i > 0 && n - list[i - 1] > 1 ? ['…', n] : [n]))
}

export default function Pagination({ current, pageCount, onChange }) {
  if (pageCount <= 1) return null
  return (
    <nav className="pagination" aria-label="Phân trang">
      <button
        type="button"
        disabled={current === 1}
        aria-label="Trang trước"
        onClick={() => onChange(current - 1)}
      >
        <Icon name="left" size={18} />
      </button>
      {pageNumbers(current, pageCount).map((n, i) =>
        n === '…' ? (
          <span key={`gap-${i}`} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            className={n === current ? 'current' : ''}
            aria-current={n === current ? 'page' : undefined}
            aria-label={`Trang ${n}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={current === pageCount}
        aria-label="Trang sau"
        onClick={() => onChange(current + 1)}
      >
        <Icon name="right" size={18} />
      </button>
    </nav>
  )
}
