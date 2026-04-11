'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Section, fadeUp, stagger } from './Section';

interface DeviceSectionProps {
  t: any;
}

const mxImages = [
  '/img_web/nuevo_dash/nuevas_img/creative_console_img.jpeg',
  '/img_web/nuevo_dash/controlmx1.jpg',
  '/img_web/nuevo_dash/controlmx2.jpg',
  '/img_web/nuevo_dash/controlmx3.jpg',
  '/img_web/nuevo_dash/canvas_board.jpg',
];

const logiImages = [
  '/img_web/nuevo_dash/logi_home_1.png',
  '/img_web/nuevo_dash/logi_home_2.png',
  '/img_web/nuevo_dash/logi_away_1.png',
  '/img_web/nuevo_dash/logi_away_2.png',
];

export function DeviceSection({ t }: DeviceSectionProps) {
  const [mxSlide, setMxSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setMxSlide((s) => (s + 1) % mxImages.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="device" className="py-24 border-y border-white/[0.06]" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.07) 0%, rgba(5,10,21,0) 60%)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <Section>
            <div className="flex flex-col gap-8 mb-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative w-24 h-24 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <Image src="/img_web/nuevo_dash/nuevas_img/Logitech-Symbol.png" alt="Logitech" fill className="object-contain" />
                </div>
                <div className="flex flex-col gap-2">
                  <motion.span variants={fadeUp} className="glass-blue inline-block text-blue-300 text-xs font-black tracking-[0.2em] uppercase px-5 py-2.5 rounded-full border border-blue-500/30 w-fit">
                    {t.hero.logiBadge.replace('🖥️ ', '')}
                  </motion.span>
                  <span className="text-blue-400/80 text-[10px] font-bold uppercase tracking-widest pl-1">Official Hardware Optimization</span>
                </div>
              </div>
              
              <div className="space-y-2 text-center sm:text-left">
                <motion.h2 variants={fadeUp} className="text-5xl sm:text-7xl font-black mb-6 leading-[0.9] tracking-tighter">
                  {t.device.title} <br />
                  <span className="text-gradient drop-shadow-[0_0_30px_rgba(37,99,235,0.3)]">{t.device.titleAccent}</span>
                </motion.h2>
              </div>
            </div>

            <motion.p variants={fadeUp} className="text-gray-400 text-xl leading-relaxed mb-10 max-w-xl">
              {t.device.subtitle}
            </motion.p>
            <motion.ul variants={stagger} className="space-y-3 mb-8">
              {t.device.bullets.map((b: string) => (
                <motion.li key={b} variants={fadeUp} className="flex items-start gap-3 text-gray-300 text-sm">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-400 text-xs">✓</span>
                  {b}
                </motion.li>
              ))}
            </motion.ul>
            <motion.p variants={fadeUp} className="text-xs text-gray-600 italic">
              {t.device.note}
            </motion.p>
          </Section>

          {/* Image carousel */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden aspect-video glass glow">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mxSlide}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={mxImages[mxSlide]}
                    alt={`Logitech MX Creative ${mxSlide + 1}`}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
              {/* Dot indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {mxImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setMxSlide(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === mxSlide ? 'bg-blue-400 w-6' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            </div>

            {/* Logi images grid below */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {logiImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setMxSlide(i % mxImages.length)}
                  className="relative aspect-square rounded-lg overflow-hidden glass card-hover"
                >
                  <Image src={img} alt={`Logitech ${i + 1}`} fill className="object-cover opacity-80 hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
