'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Cloud, Shield, Zap, Lock, HardDrive, Smartphone } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#121212', color: '#fafafa' }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 px-6 py-3 transition-all duration-300"
        style={{ background: 'rgba(18,18,18,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #393939' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-[6px] flex items-center justify-center"
              style={{ background: '#006239', border: '1px solid rgba(62,207,142,0.30)' }}
            >
              <Cloud size={15} color="#fafafa" />
            </div>
            <span style={{ color: '#fafafa', fontSize: '14px', fontWeight: 500, letterSpacing: '-0.007px' }}>
              TeleDrive
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8" style={{ color: '#898989', fontSize: '14px' }}>
            <Link href="#fitur" className="transition-colors" style={{ color: '#898989', letterSpacing: '-0.007px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#3ecf8e' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#898989' }}
            >Fitur</Link>
            <Link href="#keamanan" className="transition-colors" style={{ color: '#898989', letterSpacing: '-0.007px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#3ecf8e' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#898989' }}
            >Keamanan</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm transition-colors" style={{ color: '#898989', letterSpacing: '-0.007px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#fafafa' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#898989' }}
            >
              Masuk
            </Link>
            <Link href="/login?tab=register" className="btn-primary">
              Mulai Gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-28 pb-20">
        {/* Hero Section */}
        <section className="relative px-6 pt-16 pb-24 overflow-hidden" style={{ background: '#121212' }}>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-8"
                style={{ background: '#242424', border: '1px solid #393939', color: '#898989', letterSpacing: '-0.007px' }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: '#3ecf8e' }}></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#3ecf8e' }}></span>
                </span>
                TeleDrive v2.0 udah live nih!
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="mb-6"
                style={{ fontSize: 'clamp(2rem, 5vw, 36px)', color: '#fafafa', lineHeight: 1.25, letterSpacing: '-0.007px', fontWeight: 500 }}
              >
                Cloud storage yang rasanya <br className="hidden md:block" />
                <span style={{ color: '#3ecf8e' }}>lebih ngebut dari disk lokal.</span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mb-10 max-w-xl mx-auto"
                style={{ fontSize: '14px', color: '#898989', lineHeight: 1.5, letterSpacing: '-0.007px' }}
              >
                Simpan file tanpa batas kuota dengan kekuatan jaringan Telegram. Aman, super cepat, dan didesain khusus buat kamu yang suka hal praktis.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/login?tab=register" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
                  Gas Cobain Gratis <ArrowRight size={15} />
                </Link>
                <Link href="/login" className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2">
                  Sign In
                </Link>
              </motion.div>
            </motion.div>

            {/* Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, type: 'spring', stiffness: 100 }}
              className="mt-16 relative mx-auto max-w-4xl"
            >
              <div
                className="rounded-[16px] p-2 overflow-hidden"
                style={{ border: '1px solid #393939', background: '#2e2e2e' }}
              >
                <div
                  className="rounded-[10px] aspect-[16/9] flex items-center justify-center"
                  style={{ background: '#121212', border: '1px solid #393939', color: '#898989' }}
                >
                  <div className="text-center">
                    <Cloud size={40} className="mx-auto mb-3" style={{ color: '#393939' }} />
                    <span style={{ fontSize: '13px', letterSpacing: '-0.007px' }}>Bakal ada preview dashboard keren di sini nanti.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section
          id="fitur"
          className="px-6 py-20"
          style={{ background: '#121212', borderTop: '1px solid #393939', borderBottom: '1px solid #393939' }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className="mb-3"
                style={{ fontSize: '24px', color: '#fafafa', fontWeight: 500, lineHeight: 1.33, letterSpacing: '-0.007px' }}
              >
                Dibuat khusus buat ngebut & aman
              </h2>
              <p style={{ color: '#898989', fontSize: '14px', lineHeight: 1.5, letterSpacing: '-0.007px' }}>
                Semua yang kamu butuhin buat atur file, tanpa fitur ribet yang gak kepake.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Zap, title: 'Super Ngebut', desc: 'Upload pakai sistem chunking langsung ke API Telegram. Gak ada lagi acara loading lama.' },
                { icon: Shield, title: 'Enkripsi Berlapis', desc: 'File kamu diamankan sebelum ninggalin devicemu. Cuma kamu yang pegang kuncinya.' },
                { icon: HardDrive, title: 'Storage Unlimited', desc: 'Gak perlu pusing mikirin sisa kuota. Simpan file sebanyak yang kamu mau, selamanya.' },
                { icon: Smartphone, title: 'Bisa di Mana Aja', desc: 'Buka file kamu dari hape, tablet, atau laptop. Tampilannya otomatis nyesuain layar.' },
                { icon: Lock, title: 'Sharing Aman', desc: 'Bagiin file ke teman pakai link khusus yang aman dan terkontrol.' },
                { icon: Cloud, title: 'Upload di Belakang Layar', desc: 'Upload jalan terus biarpun kamu minimize layarnya. Santai aja.' },
              ].map((f, i) => (
                <div
                  key={i}
                  className="p-6 rounded-[16px] transition-colors"
                  style={{ background: '#2e2e2e', border: '1px solid #393939' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#242424' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#2e2e2e' }}
                >
                  <f.icon size={18} style={{ color: '#3ecf8e', marginBottom: 12 }} />
                  <h3 className="mb-2" style={{ color: '#fafafa', fontSize: '14px', fontWeight: 500, letterSpacing: '-0.007px' }}>{f.title}</h3>
                  <p style={{ color: '#898989', fontSize: '13px', lineHeight: 1.5, letterSpacing: '-0.007px' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="px-6 py-8"
        style={{ background: '#121212', borderTop: '1px solid #393939' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Cloud size={14} style={{ color: '#898989' }} />
            <span style={{ color: '#898989', fontSize: '13px', fontWeight: 500, letterSpacing: '-0.007px' }}>TeleDrive</span>
          </div>
          <div style={{ fontSize: '12px', color: '#898989', letterSpacing: '-0.007px' }}>
            © {new Date().getFullYear()} TeleDrive. Project santai by Me.
          </div>
          <div className="flex gap-6" style={{ fontSize: '13px' }}>
            <a href="#" className="transition-colors" style={{ color: '#3ecf8e', letterSpacing: '-0.007px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#00c573' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#3ecf8e' }}
            >Privasi</a>
            <a href="#" className="transition-colors" style={{ color: '#3ecf8e', letterSpacing: '-0.007px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#00c573' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#3ecf8e' }}
            >Syarat & Ketentuan</a>
            <a href="https://wa.me/6281774954859" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: '#3ecf8e', letterSpacing: '-0.007px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#00c573' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#3ecf8e' }}
            >Kontak (WA)</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
