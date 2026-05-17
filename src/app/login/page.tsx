'use client'

import { useState, useEffect, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, ArrowRight, ShieldCheck, Zap, Lock, Mail, User, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>('login')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('tab') === 'register') setTab('register')
    }
  }, [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const getPasswordStrength = () => {
    if (!password) return 0
    let score = 0
    if (password.length > 6) score += 25
    if (password.length > 10) score += 25
    if (/[A-Z]/.test(password)) score += 25
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 25
    return score
  }
  const strength = getPasswordStrength()

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) setError(res.error)
    else router.push('/dashboard')
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (password.length < 6) { setError('Password must be at least 6 characters long'); setLoading(false); return }
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Registrasi gagal'); setLoading(false); return }
    await signIn('credentials', { email, password, redirect: false })
    router.push('/dashboard')
    setLoading(false)
  }

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 20 : -20, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 20 : -20, opacity: 0 }),
  }
  const direction = tab === 'login' ? -1 : 1

  const strengthColor = strength > 75 ? '#3ecf8e' : strength > 25 ? '#b4b4b4' : '#4d4d4d'
  const strengthLabel = strength > 75 ? 'Strong' : strength > 25 ? 'Good' : 'Weak'

  return (
    <main className="min-h-screen flex" style={{ background: '#121212', color: '#fafafa' }}>
      {/* Left Column */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: '#000000', borderRight: '1px solid #393939' }}
      >
        <div className="relative z-10 w-full max-w-lg">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-14 transition-opacity hover:opacity-70">
            <div
              className="w-8 h-8 rounded-[6px] flex items-center justify-center"
              style={{ background: '#006239', border: '1px solid rgba(62,207,142,0.30)' }}
            >
              <Cloud size={16} color="#fafafa" />
            </div>
            <span style={{ color: '#fafafa', fontSize: '16px', fontWeight: 500, letterSpacing: '-0.007px' }}>TeleDrive</span>
          </Link>

          <h1
            className="mb-4"
            style={{ fontSize: '36px', lineHeight: 1.25, fontWeight: 500, color: '#fafafa', letterSpacing: '-0.007px' }}
          >
            Your files, securely stored on the{' '}
            <span style={{ color: '#3ecf8e' }}>Telegram</span>{' '}
            network.
          </h1>
          <p style={{ fontSize: '14px', color: '#898989', lineHeight: 1.5, letterSpacing: '-0.007px', marginBottom: '2.5rem', maxWidth: '28rem' }}>
            Experience unlimited cloud storage that's faster, more secure, and beautifully designed for modern workflows.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-4 rounded-[16px]"
              style={{ background: '#2e2e2e', border: '1px solid #393939' }}
            >
              <ShieldCheck size={16} style={{ color: '#3ecf8e', marginBottom: 10 }} />
              <h3 className="mb-1" style={{ color: '#fafafa', fontSize: '13px', fontWeight: 500, letterSpacing: '-0.007px' }}>End-to-End</h3>
              <p style={{ fontSize: '12px', color: '#898989', lineHeight: 1.5, letterSpacing: '-0.007px' }}>Military-grade encryption before your files leave your device.</p>
            </div>
            <div
              className="p-4 rounded-[16px]"
              style={{ background: '#2e2e2e', border: '1px solid #393939' }}
            >
              <Zap size={16} style={{ color: '#3ecf8e', marginBottom: 10 }} />
              <h3 className="mb-1" style={{ color: '#fafafa', fontSize: '13px', fontWeight: 500, letterSpacing: '-0.007px' }}>Lightning Fast</h3>
              <p style={{ fontSize: '12px', color: '#898989', lineHeight: 1.5, letterSpacing: '-0.007px' }}>Parallel chunked uploads maximize your bandwidth.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column — Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-24 xl:px-32 relative">
        <Link href="/" className="lg:hidden absolute top-8 left-6 sm:left-12 flex items-center gap-2">
          <Cloud size={16} style={{ color: '#898989' }} />
          <span style={{ color: '#fafafa', fontSize: '14px', fontWeight: 500, letterSpacing: '-0.007px' }}>TeleDrive</span>
        </Link>

        <div className="w-full max-w-sm mx-auto pt-20 lg:pt-0">
          {/* Tab Switcher */}
          <div
            className="flex p-1 rounded-[6px] mb-8 relative"
            style={{ background: '#242424', border: '1px solid #393939' }}
          >
            <div
              className="absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] rounded-[6px] transition-transform duration-300 ease-in-out"
              style={{
                background: '#2e2e2e',
                transform: tab === 'register' ? 'translateX(100%)' : 'translateX(0)',
              }}
            />
            <button
              onClick={() => { setTab('login'); setError('') }}
              className="flex-1 py-2 text-sm rounded-[6px] z-10 transition-colors"
              style={{ color: tab === 'login' ? '#fafafa' : '#898989', fontWeight: tab === 'login' ? 500 : 400, letterSpacing: '-0.007px' }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setError('') }}
              className="flex-1 py-2 text-sm rounded-[6px] z-10 transition-colors"
              style={{ color: tab === 'register' ? '#fafafa' : '#898989', fontWeight: tab === 'register' ? 500 : 400, letterSpacing: '-0.007px' }}
            >
              Create Account
            </button>
          </div>

          <div className="mb-6">
            <h2
              className="mb-1"
              style={{ fontSize: '24px', color: '#fafafa', fontWeight: 500, lineHeight: 1.33, letterSpacing: '-0.007px' }}
            >
              {tab === 'login' ? 'Welcome back' : 'Get started for free'}
            </h2>
            <p style={{ color: '#898989', fontSize: '13px', lineHeight: 1.5, letterSpacing: '-0.007px' }}>
              {tab === 'login' ? 'Enter your details to access your files.' : 'No credit card required. Unlimited storage.'}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 rounded-[6px] flex items-start gap-3"
              style={{ background: 'rgba(31,75,55,0.20)', border: '1px solid #393939' }}
            >
              <AlertCircle size={14} style={{ color: '#898989', marginTop: 1, flexShrink: 0 }} />
              <p style={{ color: '#898989', fontSize: '13px', letterSpacing: '-0.007px' }}>{error}</p>
            </motion.div>
          )}

          <div className="relative overflow-hidden min-h-[280px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.form
                key={tab}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full absolute top-0"
                onSubmit={tab === 'login' ? handleLogin : handleRegister}
              >
                <div className="space-y-3">
                  {tab === 'register' && (
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors" style={{ color: '#898989' }}>
                        <User size={14} />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="input"
                        placeholder="Full Name"
                        style={{ paddingLeft: 36 }}
                        id="name"
                      />
                    </div>
                  )}

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors" style={{ color: '#898989' }}>
                      <Mail size={14} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input"
                      placeholder="Email Address"
                      style={{ paddingLeft: 36 }}
                      id="email"
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors" style={{ color: '#898989' }}>
                      <Lock size={14} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input"
                      placeholder="Password"
                      style={{ paddingLeft: 36, paddingRight: 36 }}
                      id="password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors"
                      style={{ color: '#898989' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#898989' }}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {tab === 'register' && password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1.5 h-1">
                        <div className="flex-1 rounded-full transition-colors" style={{ background: strength > 0 ? strengthColor : '#393939' }} />
                        <div className="flex-1 rounded-full transition-colors" style={{ background: strength >= 50 ? strengthColor : '#393939' }} />
                        <div className="flex-1 rounded-full transition-colors" style={{ background: strength >= 75 ? strengthColor : '#393939' }} />
                        <div className="flex-1 rounded-full transition-colors" style={{ background: strength === 100 ? strengthColor : '#393939' }} />
                      </div>
                      <div className="flex justify-between" style={{ fontSize: '11px', letterSpacing: '-0.007px' }}>
                        <span style={{ color: '#898989' }}>Password strength</span>
                        <span style={{ color: strengthColor }}>{strengthLabel}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (tab === 'register' && password.length < 6)}
                    className="btn-primary w-full py-2.5 mt-4 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(250,250,250,0.3)', borderTopColor: '#fafafa' }} />
                    ) : (
                      <>
                        {tab === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>

                  <p className="text-center mt-3" style={{ fontSize: '12px', color: '#898989', letterSpacing: '-0.007px' }}>
                    {tab === 'login' ? (
                      <>Belum punya akun?{' '}
                        <button type="button" onClick={() => { setTab('register'); setError('') }}
                          className="transition-colors" style={{ color: '#3ecf8e', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '-0.007px' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#00c573' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#3ecf8e' }}
                        >Daftar</button>
                      </>
                    ) : (
                      <>Sudah punya akun?{' '}
                        <button type="button" onClick={() => { setTab('login'); setError('') }}
                          className="transition-colors" style={{ color: '#3ecf8e', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '-0.007px' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#00c573' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#3ecf8e' }}
                        >Login</button>
                      </>
                    )}
                  </p>
                </div>
              </motion.form>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  )
}
