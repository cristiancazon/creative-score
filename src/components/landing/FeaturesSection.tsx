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
            className={`glass rounded-2xl overflow-hidden card-hover border-white/5 relative group ${feat.premium ? 'glow border-cyan-500/30' : ''}`}
          >
            {feat.premium && (
              <div className="absolute top-3 right-3 z-20">
                <span className="bg-gradient-to-r from-amber-400 to-orange-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white shadow-lg shadow-orange-500/20">
                  Premium
                </span>
              </div>
            )}
            <div className="relative h-52 overflow-hidden">
              <Image 
                src={feat.img} 
                alt={feat.title} 
                fill 
                className="object-cover group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050a15] via-[#050a15]/20 to-transparent opacity-80" />
              <div className="absolute bottom-4 left-4 text-3xl drop-shadow-lg">{feat.icon}</div>
            </div>
            <div className="p-6 relative">
              {feat.premium && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600" />
              )}
              <h3 className={`font-bold text-xl mb-2 ${feat.premium ? 'text-cyan-300' : 'text-white'}`}>
                {feat.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed antialiased">
                {feat.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
