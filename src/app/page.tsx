'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Cloud, Shield, Zap, Lock, HardDrive, Smartphone } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-cyan-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0 border-white/5 px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Cloud size={18} color="white" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-white">TeleDrive</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link href="#fitur" className="hover:text-white transition-colors">Fitur</Link>
            <Link href="#keamanan" className="hover:text-white transition-colors">Keamanan</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Masuk
            </Link>
            <Link href="/login?tab=register" className="btn btn-primary px-5 py-2">
              Mulai Gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-32 pb-20">
        {/* Hero Section */}
        <section className="relative px-6 pt-20 pb-32 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-cyan-400 text-sm font-medium mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                TeleDrive v2.0 udah live nih!
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold mb-8 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500">
                Cloud storage yang rasanya <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">lebih ngebut dari disk lokal.</span>
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Simpan file tanpa batas kuota dengan kekuatan jaringan Telegram. Aman, super cepat, dan didesain khusus buat kamu yang suka hal praktis.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login?tab=register" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)] hover:shadow-[0_0_60px_-15px_rgba(6,182,212,0.6)] flex items-center justify-center gap-2">
                  Gas Cobain Gratis <ArrowRight size={20} />
                </Link>
              </motion.div>
            </motion.div>

            {/* Dashboard Mockup */}
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 100 }}
              className="mt-20 relative mx-auto max-w-5xl"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />
              <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-2 shadow-2xl backdrop-blur-xl overflow-hidden">
                <div className="rounded-xl border border-slate-800 bg-[#060a16] aspect-[16/9] flex items-center justify-center text-slate-600 font-medium">
                  <div className="text-center">
                    <Cloud size={48} className="mx-auto mb-4 opacity-20" />
                    Bakal ada preview dashboard keren di sini nanti.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="fitur" className="px-6 py-24 bg-slate-900/50 border-y border-slate-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Dibuat khusus buat ngebut & aman</h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">Semua yang kamu butuhin buat atur file, tanpa fitur ribet yang gak kepake.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: "Super Ngebut", desc: "Upload pakai sistem chunking langsung ke API Telegram. Gak ada lagi acara loading lama." },
                { icon: Shield, title: "Enkripsi Berlapis", desc: "File kamu diamankan sebelum ninggalin devicemu. Cuma kamu yang pegang kuncinya." },
                { icon: HardDrive, title: "Storage Unlimited", desc: "Gak perlu pusing mikirin sisa kuota. Simpan file sebanyak yang kamu mau, selamanya." },
                { icon: Smartphone, title: "Bisa di Mana Aja", desc: "Buka file kamu dari hape, tablet, atau laptop. Tampilannya otomatis nyesuain layar." },
                { icon: Lock, title: "Sharing Aman", desc: "Bagiin file ke teman pakai link khusus yang aman dan terkontrol." },
                { icon: Cloud, title: "Upload di Belakang Layar", desc: "Upload jalan terus biarpun kamu minimize layarnya. Santai aja." },
              ].map((f, i) => (
                <div key={i} className="p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6">
                    <f.icon size={24} className="text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-slate-800/50 bg-[#060a16]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Cloud size={20} className="text-cyan-400" />
            <span className="font-heading font-bold text-lg text-white">TeleDrive</span>
          </div>
          <div className="text-slate-500 text-sm">
            © {new Date().getFullYear()} TeleDrive. Project santai by Me.
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privasi</a>
            <a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a>
            <a href="https://wa.me/6281774954859" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Kontak (WA)</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
