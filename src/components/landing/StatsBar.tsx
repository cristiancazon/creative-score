'use client';

import { motion } from 'framer-motion';
import { Section, fadeUp } from './Section';

interface StatsBarProps {
  t: any;
}

export function StatsBar({ t }: StatsBarProps) {
  return (
    <Section className="py-10 border-y border-white/[0.06]">
      <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-4">
        {t.stats.map((s: any) => (
          <motion.div key={s.label} variants={fadeUp} className="text-center">
            <div className="text-3xl sm:text-5xl font-black text-gradient mb-1">{s.value}</div>
            <div className="text-xs sm:text-sm text-gray-500 font-medium">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
