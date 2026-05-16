'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Cloud, Shield, Zap, Lock, HardDrive, Smartphone } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-[#d7ffb8] text-[#3c3c3c]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-[#e5e5e5] px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#58cc02] flex items-center justify-center shadow-[0_4px_0_#3f8f01]">
              <Cloud size={22} color="white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight text-[#58cc02]">TeleDrive</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-base font-bold text-[#afafaf]">
            <Link href="#fitur" className="hover:text-[#58cc02] transition-colors">Fitur</Link>
            <Link href="#keamanan" className="hover:text-[#58cc02] transition-colors">Keamanan</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-base font-bold text-[#afafaf] hover:text-[#58cc02] transition-colors">
              Masuk
            </Link>
            <Link href="/login?tab=register" className="px-5 py-2.5 rounded-xl bg-[#58cc02] text-white font-bold text-base hover:bg-[#4ab001] shadow-[0_4px_0_#3f8f01] active:shadow-none active:translate-y-[4px] transition-all">
              Mulai Gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-32 pb-20">
        {/* Hero Section */}
        <section className="relative px-6 pt-20 pb-32 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#f7fff0] border-2 border-[#58cc02] text-[#58cc02] text-sm font-bold mb-8 shadow-[0_2px_0_#3f8f01]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58cc02] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#58cc02]"></span>
                </span>
                TeleDrive v2.0 udah live nih!
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-heading font-bold mb-8 tracking-tight text-[#3c3c3c]">
                Cloud storage yang rasanya <br className="hidden md:block" />
                <span className="text-[#58cc02]">lebih ngebut dari disk lokal.</span>
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-lg md:text-xl text-[#777777] font-semibold mb-12 max-w-2xl mx-auto leading-relaxed">
                Simpan file tanpa batas kuota dengan kekuatan jaringan Telegram. Aman, super cepat, dan didesain khusus buat kamu yang suka hal praktis.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login?tab=register" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#58cc02] hover:bg-[#4ab001] text-white font-bold text-xl transition-all shadow-[0_6px_0_#3f8f01] active:translate-y-[6px] active:shadow-none flex items-center justify-center gap-3">
                  Gas Cobain Gratis <ArrowRight size={24} strokeWidth={3} />
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
              <div className="rounded-3xl border-4 border-[#e5e5e5] bg-white p-3 shadow-2xl overflow-hidden">
                <div className="rounded-2xl border-2 border-[#e5e5e5] bg-[#f7f7f7] aspect-[16/9] flex items-center justify-center text-[#afafaf] font-bold text-xl">
                  <div className="text-center">
                    <Cloud size={64} className="mx-auto mb-6 text-[#e5e5e5]" strokeWidth={2.5} />
                    Bakal ada preview dashboard keren di sini nanti.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="fitur" className="px-6 py-24 bg-[#f7f7f7] border-y-2 border-[#e5e5e5]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-[#3c3c3c]">Dibuat khusus buat ngebut & aman</h2>
              <p className="text-[#777777] font-semibold max-w-2xl mx-auto text-xl">Semua yang kamu butuhin buat atur file, tanpa fitur ribet yang gak kepake.</p>
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
                <div key={i} className="p-8 rounded-3xl bg-white border-2 border-[#e5e5e5] hover:border-[#58cc02] transition-colors shadow-[0_4px_0_#e5e5e5] hover:shadow-[0_4px_0_#58cc02] group">
                  <div className="w-16 h-16 rounded-2xl bg-[#f7fff0] border-2 border-[#58cc02] flex items-center justify-center mb-6 shadow-[0_4px_0_#3f8f01]">
                    <f.icon size={32} className="text-[#58cc02]" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-[#3c3c3c]">{f.title}</h3>
                  <p className="text-[#777777] font-medium leading-relaxed text-lg">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 border-t-2 border-[#e5e5e5] bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Cloud size={24} className="text-[#58cc02]" strokeWidth={3} />
            <span className="font-heading font-bold text-xl text-[#58cc02]">TeleDrive</span>
          </div>
          <div className="text-[#afafaf] font-bold text-base">
            © {new Date().getFullYear()} TeleDrive. Project santai by Me.
          </div>
          <div className="flex gap-6 text-base font-bold text-[#afafaf]">
            <a href="#" className="hover:text-[#58cc02] transition-colors">Privasi</a>
            <a href="#" className="hover:text-[#58cc02] transition-colors">Syarat & Ketentuan</a>
            <a href="https://wa.me/6281774954859" target="_blank" rel="noopener noreferrer" className="hover:text-[#58cc02] transition-colors">Kontak (WA)</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
