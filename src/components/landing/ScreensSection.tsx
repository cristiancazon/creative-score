'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Section, fadeUp, stagger } from './Section';

interface ScreensSectionProps {
  t: any;
}

export function ScreensSection({ t }: ScreensSectionProps) {
  return (
    <Section id="screens" className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div variants={fadeUp} className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-black mb-4">
          {t.screens.title} <span className="text-gradient">{t.screens.titleAccent}</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">{t.screens.subtitle}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Big board screenshot */}
        <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden glass aspect-video glow">
          <Image src="/img_web/nuevo_dash/canvas_board.jpg" alt="Creative Score on court" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050a15]/60 to-transparent" />
        </motion.div>

        {/* Screen types grid */}
        <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {t.screens.items.map((item: any) => (
            <motion.div
              key={item.label}
              variants={fadeUp}
              className="glass rounded-xl p-4 flex items-center gap-3 card-hover"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 text-lg flex-shrink-0">✓</div>
              <span className="text-sm font-medium text-gray-300">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Login screenshot as secondary visual */}
      <motion.div variants={fadeUp} className="mt-8 relative rounded-2xl overflow-hidden glass aspect-[21/9] hidden lg:block">
        <Image src="/img_web/nuevo_dash/dash_light.jpg" alt="Creative Score Admin" fill className="object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050a15] via-transparent to-[#050a15]" />
      </motion.div>
    </Section>
  );
}
