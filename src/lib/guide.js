export const DEFAULT_GUIDE = {
  title: 'Hướng dẫn mua hàng',
  intro: 'Chọn món bạn thích, Ichiyo sẽ cùng bạn chuẩn bị một đơn hàng thật vừa ý.',
  steps: [
    {
      id: 'chon-san-pham',
      title: 'Chọn sản phẩm',
      body: 'Vào trang Sản phẩm, chọn danh mục và sử dụng các bộ lọc để tìm món phù hợp. Bấm vào sản phẩm để xem ảnh và mô tả chi tiết.',
    },
    {
      id: 'lien-he',
      title: 'Liên hệ với Ichiyo',
      body: 'Gửi tên hoặc ảnh sản phẩm, lựa chọn và số lượng bạn cần qua thông tin liên hệ ở cuối trang. Shop sẽ xác nhận giá và tình trạng hàng.',
    },
    {
      id: 'xac-nhan',
      title: 'Xác nhận đơn hàng',
      body: 'Trao đổi với shop về thông tin nhận hàng, phí vận chuyển và phương thức thanh toán. Kiểm tra lại các thông tin trước khi xác nhận đơn.',
    },
    {
      id: 'nhan-hang',
      title: 'Nhận hàng',
      body: 'Kiểm tra sản phẩm khi nhận hàng. Nếu cần hỗ trợ, hãy liên hệ lại với Ichiyo và gửi thông tin đơn hàng.',
    },
  ],
  note: 'Giá, tình trạng sản phẩm, phí vận chuyển và thời gian giao hàng được shop xác nhận khi bạn đặt hàng.',
}
export function normalizeGuide(raw) {
  if (!raw) return DEFAULT_GUIDE
  return {
    ...DEFAULT_GUIDE,
    ...raw,
    steps: Array.isArray(raw.steps) ? raw.steps : DEFAULT_GUIDE.steps,
  }
}
