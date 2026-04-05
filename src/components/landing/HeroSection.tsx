'use client';

import { motion } from 'framer-motion';
import { Section, fadeUp } from './Section';

interface HeroSectionProps {
  t: any;
  scrollTo: (id: string) => void;
}

export function HeroSection({ t, scrollTo }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-400/10 blur-[120px] rounded-full -z-10"></div>
      <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[40%] bg-blue-600/10 blur-[100px] rounded-full -z-10"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col items-center gap-4">
            <span className="glass-blue inline-block text-cyan-300 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full">
              {t.hero.badge}
            </span>
            <div className="flex items-center gap-3 glass px-4 py-2 rounded-xl border border-white/10 mb-6">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12-12-5.373-12-12 5.373-12 12-12zm-4.707 14.293l3.293-3.293V18h2v-7l3.293 3.293 1.414-1.414L12 7.586l-5.293 5.293 1.414 1.414z"/>
              </svg>
              <span className="text-[10px] md:text-xs font-bold text-slate-300 tracking-wider">
                {t.hero.logiBadge}
              </span>
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="font-headline text-5xl md:text-8xl font-extrabold tracking-tight leading-[1.1] text-white"
          >
            {t.hero.title} <span className="hero-gradient-text">{t.hero.titleAccent}</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="font-body text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4"
          >
            <button
              onClick={() => scrollTo('contact')}
              className="bg-gradient-to-r from-cyan-400 to-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-cyan-400/30 hover:scale-105 transition-all duration-300"
            >
              {t.hero.cta}
            </button>
            <button
              onClick={() => scrollTo('features')}
              className="glass-card text-white border border-white/10 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-slate-800/40 transition-all duration-300"
            >
              {t.hero.ctaSecondary} →
            </button>
          </motion.div>
        </div>

        {/* Dashboard Preview (Asymmetric Floating Grid) */}
        <motion.div 
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-24 relative max-w-6xl mx-auto"
        >
          <div className="relative z-10 glass-card rounded-2xl p-4 md:p-8 ambient-glow transform rotate-1 hover:rotate-0 transition-transform duration-700">
            <div className="grid grid-cols-12 gap-6 h-[400px]">
              {/* Sidebar Mockup */}
              <div className="col-span-3 space-y-4 border-r border-white/5 pr-4">
                <div className="h-12 w-full bg-slate-950 rounded-xl flex items-center px-4 gap-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <div className="h-2 w-24 bg-slate-700 rounded-full"></div>
                </div>
                <div className="space-y-2 pt-4">
                  <div className="h-10 w-full bg-cyan-400/10 border-l-2 border-cyan-400 rounded-r-lg flex items-center px-4">
                    <div className="h-2 w-20 bg-cyan-400/60 rounded-full"></div>
                  </div>
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-10 w-full bg-transparent rounded-lg flex items-center px-4">
                      <div className="h-2 w-16 bg-slate-800 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Panel Mockup */}
              <div className="col-span-9 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="h-8 w-48 bg-slate-950 rounded-lg"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-slate-800 rounded-full"></div>
                    <div className="h-8 w-8 bg-slate-800 rounded-full"></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 h-56 bg-slate-950 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-4 right-4 h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="space-y-4">
                      <div className="h-4 w-32 bg-slate-800 rounded-full"></div>
                      <div className="flex items-center gap-8 py-6">
                        <div className="text-4xl font-bold text-white">43</div>
                        <div className="h-px flex-1 bg-white/10"></div>
                        <div className="text-4xl font-bold text-cyan-400">28</div>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 w-[65%] shadow-[0_0_10px_#22d3ee]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="h-56 bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center text-cyan-400 text-xl">⚡</div>
                    <div className="h-2 w-20 bg-cyan-400/40 rounded-full"></div>
                  </div>
                </div>
                <div className="h-24 bg-slate-900 rounded-2xl p-6 flex items-center gap-6">
                  <div className="h-12 w-12 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-400">
                    📊
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="h-2 w-1/3 bg-slate-700 rounded-full"></div>
                    <div className="h-3 w-2/3 bg-slate-800 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Float elements */}
          <div className="absolute -top-12 -right-8 glass-card p-6 rounded-2xl ambient-glow hidden lg:block max-w-[200px] transform rotate-6 border border-white/10">
            <span className="text-cyan-400 mb-2 block text-2xl">⚡</span>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Latency</p>
            <p className="text-2xl font-bold text-white">0.02ms</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
