'use client';

import { motion } from 'framer-motion';
import { Section, fadeUp } from './Section';

interface ContactSectionProps {
  t: any;
}

export function ContactSection({ t }: ContactSectionProps) {
  return (
    <section id="contact" className="py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 70%)' }} />
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <Section>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-6xl font-black mb-6">
            {t.cta.title}
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-lg mb-12 leading-relaxed">
            {t.cta.subtitle}
          </motion.p>
          
          <motion.div variants={fadeUp} className="space-y-8">
            <div className="flex flex-col items-center gap-6">
              <p className="text-cyan-400 text-xs font-bold uppercase tracking-[0.2em]">
                {t.cta.or}
              </p>
              <a
                href={`mailto:cristian@xerex.tech?subject=Creative Score – Free Trial Request`}
                className="group relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative glass border border-cyan-500/30 px-8 py-5 rounded-2xl flex items-center gap-4 hover:border-cyan-400 transition-all card-hover group-hover:scale-105">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    ✉
                  </div>
                  <span className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                    {t.cta.email}
                  </span>
                </div>
              </a>
            </div>

            <div className="pt-8">
              <a
                href={`mailto:cristian@xerex.tech?subject=Creative Score – Free Trial Request`}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-12 py-5 rounded-full text-lg transition-all glow hover:scale-105 active:scale-95 inline-block"
              >
                {t.cta.button}
              </a>
            </div>
          </motion.div>
        </Section>
      </div>
    </section>
  );
}
