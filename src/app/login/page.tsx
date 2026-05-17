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

  const strengthColor = strength > 75 ? '#ffffff' : strength > 25 ? '#acafb9' : '#5e616e'
  const strengthLabel = strength > 75 ? 'Strong' : strength > 25 ? 'Good' : 'Weak'

  return (
    <main className="min-h-screen flex" style={{ background: '#000000', color: '#e2e3e9' }}>
      {/* Left Column */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: '#030304', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="relative z-10 w-full max-w-lg">
          <Link href="/" className="inline-flex items-center gap-3 mb-16 transition-opacity hover:opacity-70">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center"
              style={{ background: '#1c1d22', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <Cloud size={22} color="#ffffff" />
            </div>
            <span className="font-display" style={{ color: '#ffffff', fontSize: '22px', fontWeight: 500, letterSpacing: '0.01em' }}>TeleDrive</span>
          </Link>

          <h1
            className="font-display mb-6"
            style={{ fontSize: '48px', lineHeight: 1.13, fontWeight: 500, color: '#ffffff', letterSpacing: '0.01em' }}
          >
            Your files, securely stored on the{' '}
            {/* Golden gradient — decorative (2 of 3 allowed uses) */}
            <span
              style={{
                background: 'linear-gradient(103deg, rgb(174,147,87), rgb(255,240,204) 40%, rgb(174,147,87) 70%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Telegram
            </span>{' '}
            network.
          </h1>
          <p style={{ fontSize: '16px', color: '#acafb9', lineHeight: 1.38, marginBottom: '3rem', maxWidth: '28rem' }}>
            Experience unlimited cloud storage that's faster, more secure, and beautifully designed for modern workflows.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div
              className="p-5 rounded-[10px] transition-colors"
              style={{ background: '#121317', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <ShieldCheck size={20} style={{ color: '#acafb9', marginBottom: 12 }} />
              <h3 className="font-semibold mb-1" style={{ color: '#ffffff', fontSize: '14px' }}>End-to-End</h3>
              <p style={{ fontSize: '13px', color: '#5e616e', lineHeight: 1.43 }}>Military-grade encryption before your files leave your device.</p>
            </div>
            <div
              className="p-5 rounded-[10px] transition-colors"
              style={{ background: '#121317', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <Zap size={20} style={{ color: '#acafb9', marginBottom: 12 }} />
              <h3 className="font-semibold mb-1" style={{ color: '#ffffff', fontSize: '14px' }}>Lightning Fast</h3>
              <p style={{ fontSize: '13px', color: '#5e616e', lineHeight: 1.43 }}>Parallel chunked uploads maximize your bandwidth.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column — Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-24 xl:px-32 relative">
        <Link href="/" className="lg:hidden absolute top-8 left-6 sm:left-12 flex items-center gap-2">
          <Cloud size={20} style={{ color: '#5e616e' }} />
          <span className="font-display" style={{ color: '#ffffff', fontSize: '18px', fontWeight: 500 }}>TeleDrive</span>
        </Link>

        <div className="w-full max-w-md mx-auto pt-20 lg:pt-0">
          {/* Tab Switcher */}
          <div
            className="flex p-1 rounded-full mb-8 relative"
            style={{ background: '#121317', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div
              className="absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-in-out"
              style={{
                background: '#ffffff',
                transform: tab === 'register' ? 'translateX(100%)' : 'translateX(0)',
              }}
            />
            <button
              onClick={() => { setTab('login'); setError('') }}
              className="flex-1 py-2.5 text-sm rounded-full z-10 transition-colors"
              style={{ color: tab === 'login' ? '#08080a' : '#5e616e', fontWeight: tab === 'login' ? 600 : 400 }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setError('') }}
              className="flex-1 py-2.5 text-sm rounded-full z-10 transition-colors"
              style={{ color: tab === 'register' ? '#08080a' : '#5e616e', fontWeight: tab === 'register' ? 600 : 400 }}
            >
              Create Account
            </button>
          </div>

          <div className="mb-8">
            <h2
              className="font-display mb-2"
              style={{ fontSize: '32px', color: '#ffffff', fontWeight: 500, letterSpacing: '0.01em', lineHeight: 1.25 }}
            >
              {tab === 'login' ? 'Welcome back' : 'Get started for free'}
            </h2>
            <p style={{ color: '#5e616e', fontSize: '14px', lineHeight: 1.43 }}>
              {tab === 'login' ? 'Enter your details to access your files.' : 'No credit card required. Unlimited storage.'}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-[10px] flex items-start gap-3"
              style={{ background: '#1c1d22', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <AlertCircle size={16} style={{ color: '#acafb9', marginTop: 1, flexShrink: 0 }} />
              <p style={{ color: '#acafb9', fontSize: '13px' }}>{error}</p>
            </motion.div>
          )}

          <div className="relative overflow-hidden min-h-[300px]">
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
                <div className="space-y-4">
                  {tab === 'register' && (
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors" style={{ color: '#5e616e' }}>
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="input"
                        placeholder="Full Name"
                        style={{ paddingLeft: 44 }}
                        id="name"
                      />
                    </div>
                  )}

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors" style={{ color: '#5e616e' }}>
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input"
                      placeholder="Email Address"
                      style={{ paddingLeft: 44 }}
                      id="email"
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors" style={{ color: '#5e616e' }}>
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input"
                      placeholder="Password"
                      style={{ paddingLeft: 44, paddingRight: 44 }}
                      id="password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-5 flex items-center transition-colors"
                      style={{ color: '#5e616e' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#5e616e' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {tab === 'register' && password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1.5 h-1">
                        <div className="flex-1 rounded-full transition-colors" style={{ background: strength > 0 ? strengthColor : '#1c1d22' }} />
                        <div className="flex-1 rounded-full transition-colors" style={{ background: strength >= 50 ? strengthColor : '#1c1d22' }} />
                        <div className="flex-1 rounded-full transition-colors" style={{ background: strength >= 75 ? strengthColor : '#1c1d22' }} />
                        <div className="flex-1 rounded-full transition-colors" style={{ background: strength === 100 ? strengthColor : '#1c1d22' }} />
                      </div>
                      <div className="flex justify-between" style={{ fontSize: '12px' }}>
                        <span style={{ color: '#5e616e' }}>Password strength</span>
                        <span style={{ color: strengthColor }}>{strengthLabel}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (tab === 'register' && password.length < 6)}
                    className="btn-primary w-full py-3.5 mt-6 text-base flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(8,8,10,0.3)', borderTopColor: '#08080a' }} />
                    ) : (
                      <>
                        {tab === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                  <p className="text-center mt-4" style={{ fontSize: '13px', color: '#5e616e' }}>
                    {tab === 'login' ? (
                      <>Belum punya akun?{' '}
                        <button type="button" onClick={() => { setTab('register'); setError('') }}
                          className="underline transition-colors" style={{ color: '#acafb9', background: 'none', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#acafb9' }}
                        >Daftar</button>
                      </>
                    ) : (
                      <>Sudah punya akun?{' '}
                        <button type="button" onClick={() => { setTab('login'); setError('') }}
                          className="underline transition-colors" style={{ color: '#acafb9', background: 'none', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#acafb9' }}
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
