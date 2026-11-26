import Icon from './Icon.jsx'

// Bộ chọn số lượng [-] 3 [+], dùng ở thẻ sản phẩm (variant="card"), cửa sổ chi tiết và giỏ hàng.
// minus / plus: { label, title, disabled } cho từng nút.
export default function QtyStepper({ value, label, onMinus, onPlus, minus = {}, plus = {}, variant }) {
  const cls = variant === 'card'
    ? { group: 'card-qty', btn: 'card-qty-btn', value: 'card-qty-value' }
    : { group: 'qty-stepper', btn: 'qty-btn', value: 'qty-value' }
  return (
    <div className={cls.group} role="group" aria-label={label}>
      <button
        type="button"
        className={cls.btn}
        aria-label={minus.label}
        title={minus.title}
        disabled={minus.disabled}
        onClick={onMinus}
      >
        <Icon name="minus" size={16} />
      </button>
      <span className={cls.value} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={cls.btn}
        aria-label={plus.label}
        title={plus.title}
        disabled={plus.disabled}
        onClick={onPlus}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}
