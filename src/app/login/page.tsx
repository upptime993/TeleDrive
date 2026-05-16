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
      if (params.get('tab') === 'register') {
        setTab('register')
      }
    }
  }, [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Calculate password strength
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

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError(res.error)
    } else {
      router.push('/dashboard')
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Registrasi gagal')
      setLoading(false)
      return
    }

    // Auto login
    await signIn('credentials', { email, password, redirect: false })
    router.push('/dashboard')
    setLoading(false)
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 20 : -20,
      opacity: 0
    })
  }
  const direction = tab === 'login' ? -1 : 1

  return (
    <main className="min-h-screen flex bg-white text-[#3c3c3c] selection:bg-[#d7ffb8]">
      {/* Left Column - Visual (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#f7f7f7] border-r-2 border-[#e5e5e5] overflow-hidden flex-col items-center justify-center p-12">
        <div className="relative z-10 w-full max-w-lg">
          <Link href="/" className="inline-flex items-center gap-3 mb-16 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-2xl bg-[#58cc02] flex items-center justify-center shadow-[0_4px_0_#3f8f01]">
              <Cloud size={24} color="white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-bold text-3xl text-[#58cc02] tracking-tight">TeleDrive</span>
          </Link>

          <h1 className="font-heading text-4xl leading-tight font-bold text-[#3c3c3c] mb-6">
            Your files, securely stored on the <span className="text-[#58cc02]">Telegram</span> network.
          </h1>
          <p className="text-lg text-[#777777] font-semibold mb-12 max-w-md">
            Experience unlimited cloud storage that's faster, more secure, and beautifully designed for modern workflows.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border-2 border-[#e5e5e5] shadow-[0_4px_0_#e5e5e5] hover:border-[#58cc02] transition-colors group">
              <div className="w-12 h-12 rounded-2xl bg-[#f7fff0] border-2 border-[#58cc02] flex items-center justify-center mb-4 shadow-[0_4px_0_#3f8f01]">
                <ShieldCheck size={24} className="text-[#58cc02]" strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-xl text-[#3c3c3c] mb-2">End-to-End</h3>
              <p className="text-sm font-semibold text-[#777777]">Military-grade encryption before your files leave your device.</p>
            </div>
            <div className="p-6 rounded-3xl bg-white border-2 border-[#e5e5e5] shadow-[0_4px_0_#e5e5e5] hover:border-[#58cc02] transition-colors group">
              <div className="w-12 h-12 rounded-2xl bg-[#f7fff0] border-2 border-[#58cc02] flex items-center justify-center mb-4 shadow-[0_4px_0_#3f8f01]">
                <Zap size={24} className="text-[#58cc02]" strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-xl text-[#3c3c3c] mb-2">Lightning Fast</h3>
              <p className="text-sm font-semibold text-[#777777]">Parallel chunked uploads maximize your bandwidth.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-24 xl:px-32 relative">
        <Link href="/" className="lg:hidden absolute top-8 left-6 sm:left-12 flex items-center gap-2">
          <Cloud size={24} className="text-[#58cc02]" strokeWidth={2.5} />
          <span className="font-heading font-bold text-xl text-[#58cc02]">TeleDrive</span>
        </Link>

        <div className="w-full max-w-md mx-auto pt-20 lg:pt-0">
          {/* Tab Switcher */}
          <div className="flex p-1.5 bg-[#f7f7f7] border-2 border-[#e5e5e5] rounded-2xl mb-8 relative">
            <div className="absolute left-1.5 top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white border-2 border-[#e5e5e5] rounded-xl transition-transform duration-300 ease-in-out shadow-[0_2px_0_#e5e5e5]" style={{ transform: tab === 'register' ? 'translateX(100%)' : 'translateX(0)' }} />
            <button
              onClick={() => { setTab('login'); setError('') }}
              className={`flex-1 py-3 text-base font-bold rounded-xl z-10 transition-colors ${tab === 'login' ? 'text-[#58cc02]' : 'text-[#afafaf] hover:text-[#777777]'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setError('') }}
              className={`flex-1 py-3 text-base font-bold rounded-xl z-10 transition-colors ${tab === 'register' ? 'text-[#58cc02]' : 'text-[#afafaf] hover:text-[#777777]'}`}
            >
              Create Account
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-4xl font-heading font-bold text-[#3c3c3c] mb-2">
              {tab === 'login' ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="text-[#777777] font-semibold text-lg">
              {tab === 'login' ? 'Enter your details to access your files.' : 'No credit card required. Unlimited storage.'}
            </p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-2xl bg-[#fff0f5] border-2 border-[#cc348d] flex items-start gap-3 shadow-[0_4px_0_#cc348d]">
              <div className="text-[#cc348d] mt-0.5"><AlertCircle size={20} strokeWidth={2.5}/></div>
              <p className="text-[#cc348d] text-base font-bold">{error}</p>
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
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full absolute top-0"
                onSubmit={tab === 'login' ? handleLogin : handleRegister}
              >
                <div className="space-y-5">
                  {tab === 'register' && (
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#afafaf] group-focus-within:text-[#58cc02] transition-colors">
                        <User size={20} strokeWidth={2.5} />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-[#f7f7f7] border-2 border-[#e5e5e5] rounded-2xl text-[#3c3c3c] font-bold text-base placeholder-transparent focus:outline-none focus:border-[#58cc02] focus:bg-white transition-all peer"
                        placeholder="Full Name"
                        id="name"
                      />
                      <label htmlFor="name" className="absolute left-11 -top-3 bg-white px-1 text-xs font-bold text-[#afafaf] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-[#afafaf] peer-placeholder-shown:top-4 peer-focus:-top-3 peer-focus:text-xs peer-focus:text-[#58cc02]">
                        Full Name
                      </label>
                    </div>
                  )}

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#afafaf] group-focus-within:text-[#58cc02] transition-colors">
                      <Mail size={20} strokeWidth={2.5} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-[#f7f7f7] border-2 border-[#e5e5e5] rounded-2xl text-[#3c3c3c] font-bold text-base placeholder-transparent focus:outline-none focus:border-[#58cc02] focus:bg-white transition-all peer"
                      placeholder="Email Address"
                      id="email"
                    />
                    <label htmlFor="email" className="absolute left-11 -top-3 bg-white px-1 text-xs font-bold text-[#afafaf] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-[#afafaf] peer-placeholder-shown:top-4 peer-focus:-top-3 peer-focus:text-xs peer-focus:text-[#58cc02]">
                      Email Address
                    </label>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#afafaf] group-focus-within:text-[#58cc02] transition-colors">
                      <Lock size={20} strokeWidth={2.5} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-[#f7f7f7] border-2 border-[#e5e5e5] rounded-2xl text-[#3c3c3c] font-bold text-base placeholder-transparent focus:outline-none focus:border-[#58cc02] focus:bg-white transition-all peer"
                      placeholder="Password"
                      id="password"
                    />
                    <label htmlFor="password" className="absolute left-11 -top-3 bg-white px-1 text-xs font-bold text-[#afafaf] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-[#afafaf] peer-placeholder-shown:top-4 peer-focus:-top-3 peer-focus:text-xs peer-focus:text-[#58cc02]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#afafaf] hover:text-[#58cc02] transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                    </button>
                  </div>

                  {tab === 'register' && password.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1.5 h-2">
                        <div className={`flex-1 rounded-full transition-colors ${strength > 0 ? strength > 25 ? strength > 75 ? 'bg-[#58cc02]' : 'bg-[#58cc02]' : 'bg-[#ffc800]' : 'bg-[#e5e5e5]'}`} />
                        <div className={`flex-1 rounded-full transition-colors ${strength >= 50 ? strength > 75 ? 'bg-[#58cc02]' : 'bg-[#58cc02]' : 'bg-[#e5e5e5]'}`} />
                        <div className={`flex-1 rounded-full transition-colors ${strength >= 75 ? 'bg-[#58cc02]' : 'bg-[#e5e5e5]'}`} />
                        <div className={`flex-1 rounded-full transition-colors ${strength === 100 ? 'bg-[#58cc02]' : 'bg-[#e5e5e5]'}`} />
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#afafaf]">Password strength</span>
                        <span className={strength > 75 ? 'text-[#58cc02]' : strength > 25 ? 'text-[#58cc02]' : 'text-[#ffc800]'}>
                          {strength > 75 ? 'Strong' : strength > 25 ? 'Good' : 'Weak'}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (tab === 'register' && password.length < 6)}
                    className="w-full py-4 mt-8 rounded-2xl bg-[#58cc02] hover:bg-[#4ab001] text-white font-bold text-xl transition-all shadow-[0_6px_0_#3f8f01] active:translate-y-[6px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {tab === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight size={24} strokeWidth={3} />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  )
}
