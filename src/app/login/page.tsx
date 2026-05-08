'use client'

import { useState, useEffect, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, ArrowRight, ShieldCheck, Zap, Lock, Mail, User, Eye, EyeOff } from 'lucide-react'
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
    <main className="min-h-screen flex bg-[#0f172a] text-slate-200 selection:bg-cyan-500/30">
      {/* Left Column - Visual (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#060a16] border-r border-slate-800/60 overflow-hidden flex-col items-center justify-center p-12">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <Link href="/" className="inline-flex items-center gap-3 mb-16 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Cloud size={20} color="white" />
            </div>
            <span className="font-heading font-bold text-2xl text-white tracking-tight">TeleDrive</span>
          </Link>

          <h1 className="font-heading text-4xl leading-tight font-bold text-white mb-6">
            Your files, securely stored on the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Telegram</span> network.
          </h1>
          <p className="text-lg text-slate-400 mb-12 max-w-md">
            Experience unlimited cloud storage that's faster, more secure, and beautifully designed for modern workflows.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
              <ShieldCheck size={24} className="text-cyan-400 mb-3" />
              <h3 className="font-semibold text-white mb-1">End-to-End</h3>
              <p className="text-sm text-slate-400">Military-grade encryption before your files leave your device.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
              <Zap size={24} className="text-purple-400 mb-3" />
              <h3 className="font-semibold text-white mb-1">Lightning Fast</h3>
              <p className="text-sm text-slate-400">Parallel chunked uploads maximize your bandwidth.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-24 xl:px-32 relative">
        <Link href="/" className="lg:hidden absolute top-8 left-6 sm:left-12 flex items-center gap-2">
          <Cloud size={24} className="text-cyan-400" />
          <span className="font-heading font-bold text-xl text-white">TeleDrive</span>
        </Link>

        <div className="w-full max-w-md mx-auto pt-20 lg:pt-0">
          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-800/50 border border-slate-700/50 rounded-xl mb-8 relative">
            <div className="absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] bg-slate-700 rounded-lg transition-transform duration-300 ease-in-out shadow-sm" style={{ transform: tab === 'register' ? 'translateX(100%)' : 'translateX(0)' }} />
            <button
              onClick={() => { setTab('login'); setError('') }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg z-10 transition-colors ${tab === 'login' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setError('') }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg z-10 transition-colors ${tab === 'register' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Create Account
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-heading font-bold text-white mb-2">
              {tab === 'login' ? 'Welcome back' : 'Get started for free'}
            </h2>
            <p className="text-slate-400">
              {tab === 'login' ? 'Enter your details to access your files.' : 'No credit card required. Unlimited storage.'}
            </p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <div className="text-red-400 mt-0.5">⚠️</div>
              <p className="text-red-400 text-sm font-medium">{error}</p>
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
                <div className="space-y-4">
                  {tab === 'register' && (
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                        <User size={18} />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all peer"
                        placeholder="Full Name"
                        id="name"
                      />
                      <label htmlFor="name" className="absolute left-11 -top-2.5 bg-[#0f172a] px-1 text-xs font-medium text-slate-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-cyan-400">
                        Full Name
                      </label>
                    </div>
                  )}

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all peer"
                      placeholder="Email Address"
                      id="email"
                    />
                    <label htmlFor="email" className="absolute left-11 -top-2.5 bg-[#0f172a] px-1 text-xs font-medium text-slate-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-cyan-400">
                      Email Address
                    </label>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-11 pr-12 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all peer"
                      placeholder="Password"
                      id="password"
                    />
                    <label htmlFor="password" className="absolute left-11 -top-2.5 bg-[#0f172a] px-1 text-xs font-medium text-slate-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-cyan-400">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {tab === 'register' && password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1 h-1.5">
                        <div className={`flex-1 rounded-full transition-colors ${strength > 0 ? strength > 25 ? strength > 75 ? 'bg-emerald-500' : 'bg-cyan-400' : 'bg-amber-500' : 'bg-slate-700'}`} />
                        <div className={`flex-1 rounded-full transition-colors ${strength >= 50 ? strength > 75 ? 'bg-emerald-500' : 'bg-cyan-400' : 'bg-slate-700'}`} />
                        <div className={`flex-1 rounded-full transition-colors ${strength >= 75 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                        <div className={`flex-1 rounded-full transition-colors ${strength === 100 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>Password strength</span>
                        <span className={strength > 75 ? 'text-emerald-500' : strength > 25 ? 'text-cyan-400' : 'text-amber-500'}>
                          {strength > 75 ? 'Strong' : strength > 25 ? 'Good' : 'Weak'}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (tab === 'register' && password.length < 6)}
                    className="w-full py-4 mt-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-base transition-all duration-200 shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {tab === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight size={18} />
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
