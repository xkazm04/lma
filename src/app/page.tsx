'use client';

import React from 'react';
import { Hero } from './components/landing/Hero';
import { Footer } from './components/landing/Footer';
import { VariantB } from './components/landing/VariantB';
import { THEME } from './components/landing/shared';

export default function Page() {
  return (
    <div className={`min-h-screen ${THEME.fontBody} ${THEME.bg}`}>
      <main>
        <Hero />
        <VariantB />
      </main>

      <Footer />
    </div>
  );
}
