'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useInView, AnimatePresence } from 'framer-motion';

// ─── i18n ─────────────────────────────────────────────────────────────────────
const content = {
  en: {
    nav: {
      features: 'Features',
      device: 'Device',
      screens: 'Any Screen',
      demo: 'Request Demo',
    },
    hero: {
      badge: 'Digital Scoreboard Platform',
      title: 'Transform Any',
      titleAccent: 'Screen Into a Pro Board',
      subtitle:
        'Creative Score is the real-time, fully configurable digital scoreboard that turns any display into a professional, modern sports experience — no expensive hardware required.',
      cta: 'Request a Free Trial',
      ctaSecondary: 'Explore Features',
    },
    stats: [
      { value: '∞', label: 'Compatible screens' },
      { value: '10+', label: 'Sports supported' },
      { value: '1-click', label: 'Setup & sync' },
    ],
    features: {
      title: 'Everything you need,',
      titleAccent: 'nothing you don\'t',
      subtitle:
        'Creative Score is built for speed. Configure your scoreboard in seconds and manage every match detail in real time.',
      items: [
        {
          img: '/img_web/board_designer.jpg',
          icon: '🎨',
          title: 'Fully Customizable Board',
          desc: 'Design your scoreboard layout, colors, and branding to match any sport or team identity.',
        },
        {
          img: '/img_web/match.jpg',
          icon: '⚡',
          title: 'Real-Time Sync',
          desc: 'Every score, timer, and event updates instantly across all connected displays — zero lag.',
        },
        {
          img: '/img_web/dashboard.jpg',
          icon: '🖥️',
          title: 'Intuitive Admin Dashboard',
          desc: 'Manage matches, teams, and players from a clean, modern interface accessible from any device.',
        },
        {
          img: '/img_web/sports.jpg',
          icon: '🏆',
          title: 'Multi-Sport Ready',
          desc: 'From basketball and soccer to volleyball and beyond — one platform, all sports.',
        },
        {
          img: '/img_web/teams.jpg',
          icon: '👥',
          title: 'Team & Player Management',
          desc: 'Create rosters, track statistics, and manage substitutions with ease.',
        },
        {
          img: '/img_web/matches.jpg',
          icon: '📅',
          title: 'Match Scheduling',
          desc: 'Organize tournaments, schedule matches, and keep your league calendar always up to date.',
        },
      ],
    },
    device: {
      badge: 'Recommended Device',
      title: 'Built for',
      titleAccent: 'Logitech MX Creative',
      subtitle:
        'Pair Creative Score with the Logitech MX Creative and experience instant, tactile control over every aspect of your scoreboard — right from your hand.',
      bullets: [
        'Instant score updates with a single dial turn',
        'Custom button mapping per sport',
        'Works over Bluetooth — no wires on the sideline',
        'Haptic feedback for confident, eyes-free control',
        'Compatible with Windows & macOS',
      ],
      note: 'Creative Score works with any keyboard or touch device. Logitech MX Creative is recommended for the best experience.',
    },
    screens: {
      title: 'Works on',
      titleAccent: 'Any Screen',
      subtitle:
        'Whether you\'re using a classroom projector, a 4K courtside display, or a TV in the gym — Creative Score adapts perfectly to any resolution and aspect ratio.',
      items: [
        { label: 'Courtside LED Walls' },
        { label: 'Projectors' },
        { label: 'Smart TVs' },
        { label: '4K Displays' },
        { label: 'Secondary Monitors' },
        { label: 'Browser-Based' },
      ],
    },
    cta: {
      title: 'Ready to upgrade your venue?',
      subtitle:
        'Request a free trial and see Creative Score in action on your own screen. Our team will get you set up in minutes.',
      button: 'Request a Free Trial',
      email: 'cristian@xerex.tech',
      or: 'Or email us directly at',
    },
    footer: {
      rights: '© 2026 Creative Score. All rights reserved.',
      tagline: 'Professional digital scoreboards for every court.',
    },
  },
  es: {
    nav: {
      features: 'Funciones',
      device: 'Dispositivo',
      screens: 'Cualquier Pantalla',
      demo: 'Solicitar Demo',
    },
    hero: {
      badge: 'Plataforma de Marcadores Digital',
      title: 'Convierte Cualquier',
      titleAccent: 'Pantalla en un Marcador Pro',
      subtitle:
        'Creative Score es el marcador digital en tiempo real, totalmente configurable, que convierte cualquier pantalla en una experiencia deportiva profesional y moderna — sin necesidad de hardware costoso.',
      cta: 'Solicitar Prueba Gratuita',
      ctaSecondary: 'Ver Funciones',
    },
    stats: [
      { value: '∞', label: 'Pantallas compatibles' },
      { value: '10+', label: 'Deportes soportados' },
      { value: '1-click', label: 'Configuración y sincronización' },
    ],
    features: {
      title: 'Todo lo que necesitas,',
      titleAccent: 'sin lo que no',
      subtitle:
        'Creative Score está diseñado para la velocidad. Configura tu marcador en segundos y gestiona cada detalle del partido en tiempo real.',
      items: [
        {
          img: '/img_web/board_designer.jpg',
          icon: '🎨',
          title: 'Tablero Totalmente Configurable',
          desc: 'Diseña el diseño, colores e identidad de tu marcador para adaptarlo a cualquier deporte o equipo.',
        },
        {
          img: '/img_web/match.jpg',
          icon: '⚡',
          title: 'Sincronización en Tiempo Real',
          desc: 'Cada marcador, cronómetro y evento se actualiza al instante en todas las pantallas conectadas — sin retrasos.',
        },
        {
          img: '/img_web/dashboard.jpg',
          icon: '🖥️',
          title: 'Panel de Administración Intuitivo',
          desc: 'Gestiona partidos, equipos y jugadores desde una interfaz moderna y limpia, accesible desde cualquier dispositivo.',
        },
        {
          img: '/img_web/sports.jpg',
          icon: '🏆',
          title: 'Multi-Deporte',
          desc: 'Desde básquet y fútbol hasta vóley y más — una plataforma para todos los deportes.',
        },
        {
          img: '/img_web/teams.jpg',
          icon: '👥',
          title: 'Gestión de Equipos y Jugadores',
          desc: 'Crea plantillas, lleva estadísticas y gestiona sustituciones con facilidad.',
        },
        {
          img: '/img_web/matches.jpg',
          icon: '📅',
          title: 'Programación de Partidos',
          desc: 'Organiza torneos, programa partidos y mantén el calendario de tu liga siempre actualizado.',
        },
      ],
    },
    device: {
      badge: 'Dispositivo Recomendado',
      title: 'Diseñado para',
      titleAccent: 'Logitech MX Creative',
      subtitle:
        'Combina Creative Score con el Logitech MX Creative y experimenta un control táctil instantáneo sobre cada aspecto de tu marcador — directamente desde tu mano.',
      bullets: [
        'Actualización instantánea con un giro del dial',
        'Mapeo de botones personalizado por deporte',
        'Funciona por Bluetooth — sin cables en la cancha',
        'Retroalimentación háptica para un control seguro sin mirar',
        'Compatible con Windows y macOS',
      ],
      note: 'Creative Score funciona con cualquier teclado o dispositivo táctil. Se recomienda Logitech MX Creative para la mejor experiencia.',
    },
    screens: {
      title: 'Funciona en',
      titleAccent: 'Cualquier Pantalla',
      subtitle:
        'Ya sea un proyector en el gimnasio, una pantalla 4K a pie de cancha, o un televisor — Creative Score se adapta perfectamente a cualquier resolución y relación de aspecto.',
      items: [
        { label: 'Paredes LED de Cancha' },
        { label: 'Proyectores' },
        { label: 'Smart TVs' },
        { label: 'Pantallas 4K' },
        { label: 'Monitores Secundarios' },
        { label: 'Basado en Navegador' },
      ],
    },
    cta: {
      title: '¿Listo para mejorar tu instalación?',
      subtitle:
        'Solicita una prueba gratuita y ve Creative Score en acción en tu propia pantalla. Nuestro equipo te configurará en minutos.',
      button: 'Solicitar Prueba Gratuita',
      email: 'cristian@xerex.tech',
      or: 'O escríbenos directamente a',
    },
    footer: {
      rights: '© 2026 Creative Score. Todos los derechos reservados.',
      tagline: 'Marcadores digitales profesionales para cada cancha.',
    },
  },
} as const;

type Lang = keyof typeof content;

// ─── Animation Variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [scrolled, setScrolled] = useState(false);
  const [mxSlide, setMxSlide] = useState(0);
  const t = content[lang];

  const mxImages = [
    '/img_web/controlmx_1.jpg',
    '/img_web/controlmx_2.jpg',
    '/img_web/controlmx_3.jpg',
    '/img_web/controlmx_4.jpg',
  ];

  const logiImages = [
    '/img_web/logi_home_1.png',
    '/img_web/logi_home_2.png',
    '/img_web/logi_away_1.png',
    '/img_web/logi_away_2.png',
  ];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setMxSlide((s) => (s + 1) % mxImages.length), 3000);
    return () => clearInterval(id);
  }, [mxImages.length]);

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
            <a
              href={`mailto:cristian@xerex.tech?subject=Creative Score – Free Trial Request`}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all glow hidden sm:block"
            >
              {t.nav.demo}
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/img_web/boards.jpg"
            alt="Creative Score Board"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="hero-bg absolute inset-0" />
          {/* Radial glow */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(37,99,235,0.18) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-20 text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <span className="glass-blue inline-block text-blue-300 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
              {t.hero.badge}
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{ transitionDelay: '0.1s' }}
            className="text-5xl sm:text-7xl font-black tracking-tight leading-tight mb-6"
          >
            {t.hero.title}{' '}
            <span className="text-gradient">{t.hero.titleAccent}</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{ transitionDelay: '0.2s' }}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{ transitionDelay: '0.3s' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href={`mailto:cristian@xerex.tech?subject=Creative Score – Free Trial Request`}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-full text-base transition-all glow hover:scale-105 active:scale-95"
            >
              {t.hero.cta}
            </a>
            <button
              onClick={() => scrollTo('features')}
              className="glass text-white font-semibold px-8 py-4 rounded-full text-base hover:bg-white/10 transition-all"
            >
              {t.hero.ctaSecondary} →
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ── Stats Bar ── */}
      <Section className="py-10 border-y border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-4">
          {t.stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="text-center">
              <div className="text-3xl sm:text-5xl font-black text-gradient mb-1">{s.value}</div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── Features ── */}
      <Section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            {t.features.title} <span className="text-gradient">{t.features.titleAccent}</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">{t.features.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.items.map((feat) => (
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

      {/* ── Device Section ── */}
      <section id="device" className="py-24 border-y border-white/[0.06]" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.07) 0%, rgba(5,10,21,0) 60%)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <Section>
              <motion.span variants={fadeUp} className="glass-blue inline-block text-blue-300 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
                {t.device.badge}
              </motion.span>
              <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
                {t.device.title} <span className="text-gradient">{t.device.titleAccent}</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-gray-400 text-lg leading-relaxed mb-8">
                {t.device.subtitle}
              </motion.p>
              <motion.ul variants={stagger} className="space-y-3 mb-8">
                {t.device.bullets.map((b) => (
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

      {/* ── Any Screen ── */}
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
            <Image src="/img_web/borad_game.jpg" alt="Creative Score on court" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050a15]/60 to-transparent" />
          </motion.div>

          {/* Screen types grid */}
          <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {t.screens.items.map((item) => (
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
          <Image src="/img_web/login.jpg" alt="Creative Score Admin" fill className="object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050a15] via-transparent to-[#050a15]" />
        </motion.div>
      </Section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(37,99,235,0.2) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Section>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-6xl font-black mb-6">
              {t.cta.title}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg mb-10 leading-relaxed">
              {t.cta.subtitle}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col items-center gap-5">
              <a
                href={`mailto:cristian@xerex.tech?subject=Creative Score – Free Trial Request`}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-5 rounded-full text-lg transition-all glow hover:scale-105 active:scale-95 inline-block"
              >
                {t.cta.button}
              </a>
              <p className="text-gray-500 text-sm">
                {t.cta.or}{' '}
                <a href="mailto:cristian@xerex.tech" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                  {t.cta.email}
                </a>
              </p>
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative h-8 w-32">
            <Image src="/logo_cs.png" alt="Creative Score" fill className="object-contain object-left" />
          </div>
          <p className="text-xs text-gray-600">{t.footer.tagline}</p>
          <p className="text-xs text-gray-700">{t.footer.rights}</p>
        </div>
      </footer>
    </div>
  );
}
