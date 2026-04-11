'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Section, fadeUp } from './Section';

interface FeaturesSectionProps {
  t: any;
}

export function FeaturesSection({ t }: FeaturesSectionProps) {
  // Configuración de clases según el tamaño "Bento"
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'large': // 2x2
        return 'col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-2 min-h-[400px]';
      case 'wide': // 2x1
        return 'col-span-1 md:col-span-2 lg:col-span-2 min-h-[220px]';
      case 'tall': // 1x2
        return 'col-span-1 lg:row-span-2 min-h-[400px] lg:min-h-auto';
      default: // normal 1x1
        return 'col-span-1 min-h-[220px]';
    }
  };

  return (
    <Section id="features" className="py-32 px-6 max-w-[1400px] mx-auto">
      <motion.div variants={fadeUp} className="text-center mb-20">
        <h2 className="text-4xl sm:text-6xl font-black mb-6 tracking-tight">
          {t.features.title} <span className="text-gradient drop-shadow-[0_0_30px_rgba(37,99,235,0.3)]">{t.features.titleAccent}</span>
        </h2>
        <p className="text-gray-400 text-xl max-w-2xl mx-auto">{t.features.subtitle}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 grid-flow-row-dense">
        {t.features.items.map((feat: any, idx: number) => {
          const isLargeOrWide = feat.size === 'large' || feat.size === 'wide' || feat.size === 'tall';
          const sizeClasses = getSizeClasses(feat.size);
          const premiumClasses = feat.premium ? 'glow border-cyan-500/30' : 'border-white/5';
          
          return (
            <motion.div
              key={feat.title + idx}
              variants={fadeUp}
              className={`glass rounded-3xl overflow-hidden card-hover relative group ${sizeClasses} ${premiumClasses} flex flex-col`}
            >
              {feat.premium && (
                <div className="absolute top-4 right-4 z-20">
                  <span className="bg-gradient-to-r from-amber-400 to-orange-600 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                    Premium
                  </span>
                </div>
              )}

              {/* Contenedor de la imagen */}
              <div className="relative flex-1 min-h-[160px] overflow-hidden bg-[#0a0f1c] w-full">
                <Image 
                  src={feat.img} 
                  alt={feat.title} 
                  fill 
                  className={`object-cover group-hover:scale-110 transition-transform duration-700 ease-out ${isLargeOrWide ? 'opacity-90' : 'opacity-80'}`} 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Gradiente de overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050a15] via-[#050a15]/40 to-transparent pointer-events-none" />
                
                <div className="absolute bottom-5 left-5 text-4xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] z-10 transition-transform duration-300 group-hover:-translate-y-2">
                  {feat.icon}
                </div>
              </div>

              {/* Contenido de texto */}
              <div className="p-6 relative bg-[#050a15] border-t border-white/5">
                {feat.premium && (
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600" />
                )}
                <h3 className={`font-bold ${isLargeOrWide && feat.size !== 'tall' ? 'text-2xl' : 'text-xl'} mb-2 ${feat.premium ? 'text-cyan-300' : 'text-white'}`}>
                  {feat.title}
                </h3>
                <p className={`text-slate-400 leading-relaxed font-normal antialiased ${isLargeOrWide && feat.size !== 'tall' ? 'text-base line-clamp-2' : 'text-sm line-clamp-3'}`}>
                  {feat.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
