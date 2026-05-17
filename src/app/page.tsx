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
    <div className="min-h-screen flex flex-col" style={{ background: '#000000', color: '#e2e3e9' }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300"
        style={{ background: '#030304', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center"
              style={{ background: '#1c1d22', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <Cloud size={18} color="#ffffff" />
            </div>
            <span
              className="font-display"
              style={{ color: '#ffffff', fontSize: '18px', fontWeight: 500, letterSpacing: '0.01em' }}
            >
              TeleDrive
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm" style={{ color: '#5e616e' }}>
            <Link href="#fitur" className="transition-colors" style={{ color: '#5e616e' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#5e616e' }}
            >Fitur</Link>
            <Link href="#keamanan" className="transition-colors" style={{ color: '#5e616e' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#5e616e' }}
            >Keamanan</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm transition-colors" style={{ color: '#5e616e' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#5e616e' }}
            >
              Masuk
            </Link>
            <Link href="/login?tab=register" className="btn-primary text-sm px-6 py-2.5">
              Mulai Gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-32 pb-20">
        {/* Hero Section */}
        <section className="relative px-6 pt-20 pb-32 overflow-hidden" style={{ background: '#000000' }}>
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-10"
                style={{ background: '#121317', border: '1px solid rgba(255,255,255,0.05)', color: '#acafb9' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: '#acafb9' }}></span>
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#acafb9' }}></span>
                </span>
                TeleDrive v2.0 udah live nih!
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="font-display mb-8"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 52px)', color: '#ffffff', lineHeight: 1.13, letterSpacing: '0.01em', fontWeight: 500 }}
              >
                Cloud storage yang rasanya <br className="hidden md:block" />
                {/* Golden gradient — decorative accent (1 of 3 allowed uses) */}
                <span
                  style={{
                    background: 'linear-gradient(103deg, rgb(174,147,87), rgb(255,240,204) 40%, rgb(174,147,87) 70%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  lebih ngebut dari disk lokal.
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mb-12 max-w-2xl mx-auto"
                style={{ fontSize: '16px', color: '#acafb9', lineHeight: 1.38, letterSpacing: '-0.02px' }}
              >
                Simpan file tanpa batas kuota dengan kekuatan jaringan Telegram. Aman, super cepat, dan didesain khusus buat kamu yang suka hal praktis.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login?tab=register" className="btn-primary w-full sm:w-auto px-8 py-3.5 text-base flex items-center justify-center gap-2">
                  Gas Cobain Gratis <ArrowRight size={18} />
                </Link>
              </motion.div>
            </motion.div>

            {/* Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, type: 'spring', stiffness: 100 }}
              className="mt-20 relative mx-auto max-w-5xl"
            >
              <div
                className="rounded-[10px] p-2 overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.05)', background: '#030304' }}
              >
                <div
                  className="rounded-[10px] aspect-[16/9] flex items-center justify-center"
                  style={{ background: '#08080a', border: '1px solid rgba(255,255,255,0.05)', color: '#5e616e' }}
                >
                  <div className="text-center">
                    <Cloud size={48} className="mx-auto mb-4" style={{ color: '#1c1d22' }} />
                    <span style={{ fontSize: '14px' }}>Bakal ada preview dashboard keren di sini nanti.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section
          id="fitur"
          className="px-6 py-24"
          style={{ background: '#030304', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2
                className="font-display mb-4"
                style={{ fontSize: '32px', color: '#ffffff', fontWeight: 500, letterSpacing: '0.01em', lineHeight: 1.25 }}
              >
                Dibuat khusus buat ngebut & aman
              </h2>
              <p style={{ color: '#acafb9', fontSize: '16px', lineHeight: 1.38 }}>
                Semua yang kamu butuhin buat atur file, tanpa fitur ribet yang gak kepake.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
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
                  className="p-8 rounded-[10px] transition-colors"
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#121317' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-6"
                    style={{ background: '#1c1d22', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <f.icon size={20} style={{ color: '#acafb9' }} />
                  </div>
                  <h3 className="text-base font-semibold mb-3" style={{ color: '#ffffff' }}>{f.title}</h3>
                  <p style={{ color: '#e2e3e9', fontSize: '14px', lineHeight: 1.43 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="px-6 py-12"
        style={{ background: '#000000', borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Cloud size={18} style={{ color: '#5e616e' }} />
            <span className="font-display" style={{ color: '#5e616e', fontSize: '16px', fontWeight: 500 }}>TeleDrive</span>
          </div>
          <div style={{ fontSize: '13px', color: '#5e616e' }}>
            © {new Date().getFullYear()} TeleDrive. Project santai by Me.
          </div>
          <div className="flex gap-6 text-sm" style={{ color: '#5e616e' }}>
            <a href="#" className="transition-colors"
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#5e616e' }}
            >Privasi</a>
            <a href="#" className="transition-colors"
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#5e616e' }}
            >Syarat & Ketentuan</a>
            <a href="https://wa.me/6281774954859" target="_blank" rel="noopener noreferrer" className="transition-colors"
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#5e616e' }}
            >Kontak (WA)</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
