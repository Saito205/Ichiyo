export default function LoginScreen({ onLogin, error }) {
  return (
    <div className="ad-login">
      <div className="ad-card ad-login-card">
        <span className="ad-mark" aria-hidden="true">
          一
        </span>
        <h1>Quản trị nội dung</h1>
        <p>Đăng nhập bằng tài khoản GitHub có quyền ghi vào kho mã của website.</p>
        <button type="button" className="ad-btn" onClick={onLogin}>
          Đăng nhập bằng GitHub
        </button>
        {error && (
          <p className="ad-error" role="alert">
            {error}
          </p>
        )}
        <a href="#/" className="ad-link">
          Về trang chủ
        </a>
      </div>
    </div>
  )
}
