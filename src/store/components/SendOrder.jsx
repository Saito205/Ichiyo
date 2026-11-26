import { useEffect, useRef, useState } from 'react'
import { copyText } from '../../shared/clipboard.js'
import { site } from '../../shared/content.js'
import { formatPrice } from '../../shared/price.js'
import { safeUrl } from '../../shared/url.js'
import Icon from './Icon.jsx'

// Các kênh nhắn tin của tiệm (lấy từ Cài đặt → Liên hệ); kênh nào trống thì không hiện.
const channels = [
  ['facebook', 'Facebook', 'facebook'],
  ['zalo', 'Zalo', 'chat'],
  ['instagram', 'Instagram', 'instagram'],
  ['tiktok', 'TikTok', 'tiktok'],
]

// Đơn hàng dạng chữ để khách dán vào tin nhắn gửi tiệm.
function orderText(items, count, totalPrice) {
  const lines = items.map((p, i) => {
    const name = p.variant ? `${p.title} (${p.variant.label})` : p.title
    const price = p.unitPrice > 0 ? ` = ${formatPrice(p.unitPrice * p.quantity)}` : ''
    return `${i + 1}. ${name} × ${p.quantity}${price}${p.soldOut ? ' (đang hết hàng)' : ''}`
  })
  const total = totalPrice > 0 ? ` · Tạm tính: ${formatPrice(totalPrice)}` : ''
  return [`Đơn hàng gửi ${site.name || 'Ichiyo'}:`, ...lines, `Tổng: ${count} món${total}`].join('\n')
}

// Khối "gửi đơn": nút sao chép đơn + nút chép rồi mở khung chat của tiệm.
export default function SendOrder({ items, count, totalPrice }) {
  const [message, setMessage] = useState('')
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  const links = channels
    .map(([key, label, icon]) => ({ key, label, icon, href: safeUrl(site.contact?.[key]) }))
    .filter((c) => c.href)

  const copy = () => {
    copyText(orderText(items, count, totalPrice)).then((ok) => {
      clearTimeout(timer.current)
      setMessage(
        ok
          ? 'Đã sao chép đơn hàng! Dán (giữ ô chat → Dán) vào tin nhắn gửi tiệm nhé.'
          : 'Không sao chép được. Bạn hãy chụp màn hình giỏ hàng gửi tiệm nhé.',
      )
      timer.current = setTimeout(() => setMessage(''), 8000)
    })
  }

  return (
    <div className="send-order">
      <div className="send-order-text">
        <h2>Gửi đơn cho tiệm</h2>
        <p>Bấm sao chép rồi dán vào tin nhắn gửi tiệm. Tiệm sẽ xác nhận giá, phí ship và cách thanh toán.</p>
      </div>
      <div className="send-order-actions">
        <button type="button" className="btn" onClick={copy}>
          <Icon name="copy" size={18} /> Sao chép đơn hàng
        </button>
        {links.map((c) => (
          // Chép đơn ngay khi bấm, rồi mở khung chat ở tab mới.
          <a key={c.key} href={c.href} target="_blank" rel="noreferrer" className="btn btn-outline" onClick={copy}>
            <Icon name={c.icon} size={18} /> Chép & nhắn {c.label}
          </a>
        ))}
      </div>
      <p className="send-order-status" role="status">
        {message}
      </p>
    </div>
  )
}
