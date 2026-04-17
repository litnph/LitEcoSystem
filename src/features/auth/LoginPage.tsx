import { useState, type FormEvent } from 'react'
import { useAuth } from '../../app/auth/useAuth'

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.')
      return
    }
    setLoading(true)
    setError(null)
    const result = await login(username, password)
    if (!result.ok) {
      setError(result.error ?? 'Đăng nhập thất bại.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F9F6F2]">
      {/* Left panel — branding */}
      <div className="hidden flex-col justify-between border-r border-[#E4D9CE] bg-[#F3EEE7] p-12 lg:flex lg:w-1/2">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#62492E]">
            <span className="text-lg font-bold text-white">L</span>
          </div>
          <span className="text-xl font-bold text-[#2C2215]">LitEcoSystem</span>
        </div>

        {/* Tagline */}
        <div>
          <h1 className="text-4xl font-bold leading-tight text-[#2C2215]">
            Quản lý tài chính
            <br />
            <span className="text-[#9E8E7C]">cá nhân tối giản</span>
          </h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-[#6B5B48]">
            Theo dõi thu chi, quản lý trả góp, nợ vay và kỳ sao kê thẻ tín dụng
            — tất cả trong một nơi.
          </p>

          {/* Feature list */}
          <ul className="mt-8 space-y-3">
            {[
              'Theo dõi thu / chi theo danh mục',
              'Quản lý kỳ sao kê thẻ BNPL',
              'Ghi nhận trả góp & nợ vay',
              'Chi hộ & thu hồi công nợ',
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-3 text-sm text-[#5C4E3C]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EDE6DC] text-[#7A5E3E]">
                  ✓
                </span>
                {feat}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-[#BFB0A0]">© 2026 LitEcoSystem · Dữ liệu lưu cục bộ trên trình duyệt</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#62492E]">
              <span className="text-base font-bold text-white">L</span>
            </div>
            <span className="text-lg font-bold text-[#2C2215]">LitEcoSystem</span>
          </div>

          <div className="card p-5 sm:p-8">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-[#2C2215]">Đăng nhập</h2>
              <p className="mt-1 text-sm text-[#6B5B48]">Chào mừng trở lại! Nhập thông tin để tiếp tục.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="form-field">
                <label className="form-label">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(null) }}
                  placeholder="admin hoặc demo"
                  autoComplete="username"
                  autoFocus
                  className="form-input"
                />
              </div>

              {/* Password */}
              <div className="form-field">
                <label className="form-label">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null) }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="form-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BFB0A0] transition hover:text-[#3E3025]"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2 w-full py-3"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

          </div>

          <p className="mt-4 text-center text-xs text-[#9E8E7C]">
            Dữ liệu được lưu cục bộ trên trình duyệt của bạn.
          </p>
        </div>
      </div>
    </div>
  )
}
