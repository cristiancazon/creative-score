'use client';

import Image from 'next/image';

interface FooterProps {
  t: any;
}

export function Footer({ t }: FooterProps) {
  return (
    <footer className="border-t border-white/[0.06] py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative h-8 w-32">
          <Image src="/logo_cs.png" alt="Creative Score" fill className="object-contain object-left" />
        </div>
        <p className="text-xs text-gray-600">{t.footer.tagline}</p>
        <p className="text-xs text-gray-700">{t.footer.rights}</p>
      </div>
    </footer>
  );
}
