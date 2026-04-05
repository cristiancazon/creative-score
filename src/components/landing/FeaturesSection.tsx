'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Section, fadeUp } from './Section';

interface FeaturesSectionProps {
  t: any;
}

export function FeaturesSection({ t }: FeaturesSectionProps) {
  return (
    <Section id="features" className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div variants={fadeUp} className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-black mb-4">
          {t.features.title} <span className="text-gradient">{t.features.titleAccent}</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">{t.features.subtitle}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {t.features.items.map((feat: any) => (
          <motion.div
            key={feat.title}
            variants={fadeUp}
            className="glass rounded-2xl overflow-hidden card-hover"
          >
            <div className="relative h-44 overflow-hidden">
              <Image src={feat.img} alt={feat.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050a15] via-transparent to-transparent" />
              <div className="absolute top-3 left-3 text-2xl">{feat.icon}</div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg text-white mb-2">{feat.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
