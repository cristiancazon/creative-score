'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// ─── Modular Sections ───
import { content, Lang } from '@/components/landing/constants';
import { HeroSection } from '@/components/landing/HeroSection';
import { StatsBar } from '@/components/landing/StatsBar';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { DeviceSection } from '@/components/landing/DeviceSection';
import { ScreensSection } from '@/components/landing/ScreensSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [scrolled, setScrolled] = useState(false);
  const t = content[lang];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050a15] text-white font-sans overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); }
        .glass-blue { background: rgba(37,99,235,0.12); backdrop-filter: blur(16px); border: 1px solid rgba(37,99,235,0.25); }
        .text-gradient { background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glow { box-shadow: 0 0 60px rgba(37,99,235,0.35); }
        .hero-gradient-text { background: linear-gradient(135deg, #99f7ff 0%, #00f1fe 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .glass-card { background: rgba(25, 37, 64, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(64, 72, 93, 0.2); }
        .ambient-glow { box-shadow: 0 20px 40px rgba(0, 241, 254, 0.08); }
        .hero-bg { background: linear-gradient(180deg, rgba(5,10,21,0) 0%, rgba(5,10,21,0.6) 50%, #050a15 100%); }
        .card-hover { transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-6px); border-color: rgba(96,165,250,0.4); box-shadow: 0 20px 60px rgba(37,99,235,0.2); }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #050a15; } ::-webkit-scrollbar-thumb { background: #1e40af; border-radius: 3px; }
      `}</style>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-white/10' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="relative h-10 w-40">
            <Image src="/logo_cs.png" alt="Creative Score" fill className="object-contain object-left" priority />
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[
              ['features', t.nav.features],
              ['device', t.nav.device],
              ['screens', t.nav.screens],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
              className="glass text-xs font-semibold px-3 py-1.5 rounded-full text-blue-300 hover:bg-blue-500/20 transition-all"
            >
              {lang === 'en' ? 'ES' : 'EN'}
            </button>
            <button 
              onClick={() => window.location.href = '/login'}
              className="text-slate-300 hover:text-cyan-300 transition-all font-medium px-4 py-2 rounded-xl hover:bg-cyan-400/10 scale-95 active:scale-100 hidden sm:block"
            >
              Login
            </button>
            <button
              onClick={() => scrollTo('contact')}
              className="bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all glow hidden sm:block"
            >
              {t.nav.demo}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Composer Sections ── */}
      <HeroSection t={t} scrollTo={scrollTo} />
      <StatsBar t={t} />
      <FeaturesSection t={t} />
      <DeviceSection t={t} />
      <ScreensSection t={t} />
      <ContactSection t={t} />
      <Footer t={t} />

    </div>
  );
}
