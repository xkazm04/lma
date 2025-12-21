'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  Handshake,
  ClipboardCheck,
  ArrowLeftRight,
  Leaf,
  LayoutDashboard,
  Brain,
  Shield,
  Zap,
} from 'lucide-react';

// --- CONFIGURATION (NEXUS THEME) ---
const THEME = {
  bg: 'bg-white',
  bgSecondary: 'bg-[#F4F4F5]',
  text: 'text-[#18181B]',
  textSecondary: 'text-[#71717A]',
  primary: 'bg-[#18181B] hover:bg-[#27272A]',
  primaryFg: 'text-white',
  border: 'border-[#E4E4E7]',
  accentSolid: 'text-blue-600',
  radius: 'rounded-md',
  fontHeading: 'font-sans tracking-tight',
  fontBody: 'font-sans',
  shadow: 'shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
};

// --- MODULE CONFIGURATION ---
const modules = [
  {
    name: 'Document Hub',
    href: '/documents',
    icon: FileText,
    description: 'AI-powered document analysis',
    details: 'Upload loan agreements, extract covenants, obligations, and key terms automatically using Claude AI.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    name: 'Deal Room',
    href: '/deals',
    icon: Handshake,
    description: 'Negotiate terms collaboratively',
    details: 'Multi-party term negotiation with proposals, comments, and real-time collaboration.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    name: 'Compliance',
    href: '/compliance',
    icon: ClipboardCheck,
    description: 'Track obligations & covenants',
    details: 'Monitor reporting deadlines, covenant tests, and manage waivers with calendar views.',
    color: 'bg-green-50 text-green-600',
  },
  {
    name: 'Trade DD',
    href: '/trading',
    icon: ArrowLeftRight,
    description: 'Due diligence automation',
    details: 'Streamline secondary loan trades with automated checklists and settlement tracking.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    name: 'ESG Dashboard',
    href: '/esg',
    icon: Leaf,
    description: 'Sustainability performance',
    details: 'Track KPIs, targets, ratings, and use of proceeds for sustainability-linked loans.',
    color: 'bg-emerald-50 text-emerald-600',
  },
];

const features = [
  {
    title: 'AI-Powered Extraction',
    description: 'Claude AI extracts covenants, obligations, and key terms from complex loan documents in seconds.',
    icon: Brain,
  },
  {
    title: 'Real-Time Collaboration',
    description: 'Multi-party negotiation with proposals, comments, and instant notifications.',
    icon: Zap,
  },
  {
    title: 'Enterprise Security',
    description: 'Bank-grade security with Supabase authentication and row-level security policies.',
    icon: Shield,
  },
];

// --- SHARED COMPONENTS ---

const Badge = ({ children }: { children: React.ReactNode }) => (
  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border ${THEME.border} bg-white rounded-full`}>
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
    </span>
    {children}
  </div>
);

// --- SECTIONS ---

const Header = () => (
  <header className={`
    fixed top-0 left-0 right-0 z-40 transition-all duration-300
    bg-opacity-90 border-b ${THEME.border} ${THEME.bg}
  `}>
    <div className="container mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${THEME.primary}`}>
          <FileText className={`w-5 h-5 ${THEME.primaryFg}`} />
        </div>
        <span className={`text-lg font-bold tracking-tight ${THEME.fontHeading} ${THEME.text}`}>LoanOS</span>
      </div>

      <nav className="hidden md:flex items-center gap-6">
        {modules.slice(0, 4).map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className={`text-sm font-medium ${THEME.textSecondary} hover:${THEME.text} transition-colors`}
          >
            {module.name}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <Link href="/login" className={`text-sm font-medium ${THEME.text} hover:opacity-70`}>
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className={`hidden sm:inline-flex px-4 py-2 text-sm font-semibold ${THEME.primary} ${THEME.primaryFg} ${THEME.radius} transition-opacity hover:opacity-90`}
        >
          Open Demo
        </Link>
      </div>
    </div>
  </header>
);

const Hero = () => (
  <section className={`relative pt-32 pb-20 overflow-hidden ${THEME.bg}`}>
    {/* Grid Background Effect */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

    <div className="container mx-auto px-6 relative z-10">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <Badge>AI-Powered Loan Management</Badge>

        <h1 className={`text-5xl lg:text-6xl ${THEME.fontHeading} ${THEME.text} leading-[1.1]`}>
          Loan lifecycle <br />
          <span className="text-zinc-400">intelligence platform.</span>
        </h1>

        <p className={`text-lg lg:text-xl leading-relaxed ${THEME.textSecondary} max-w-2xl mx-auto`}>
          Extract insights from loan documents, negotiate terms collaboratively, track compliance,
          manage trades, and monitor ESG performance—all powered by AI.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Link
            href="/dashboard"
            className={`
              group inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-200
              ${THEME.primary} ${THEME.primaryFg} ${THEME.radius}
              hover:scale-[1.02] active:scale-[0.98]
            `}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Explore Dashboard</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/documents"
            className={`
              inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-200
              bg-white border hover:bg-zinc-50
              ${THEME.text} ${THEME.border} ${THEME.radius}
            `}
          >
            <FileText className="w-4 h-4" />
            <span>Try Document Analysis</span>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const ModulesSection = () => (
  <section className={`py-20 ${THEME.bgSecondary}`}>
    <div className="container mx-auto px-6">
      <div className="max-w-3xl mb-12">
        <h2 className={`text-3xl md:text-4xl ${THEME.fontHeading} ${THEME.text} mb-4`}>
          Five integrated modules.
        </h2>
        <p className={`text-lg ${THEME.textSecondary}`}>
          Everything you need to manage the complete loan lifecycle from origination to trading.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className={`
              group p-6 transition-all duration-300
              ${THEME.bg} ${THEME.border}
              border hover:border-zinc-400 hover:shadow-md
              ${THEME.radius}
            `}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${module.color}`}>
              <module.icon className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${THEME.text} group-hover:text-blue-600 transition-colors`}>
              {module.name}
            </h3>
            <p className={`text-sm font-medium mb-2 ${THEME.textSecondary}`}>
              {module.description}
            </p>
            <p className={`text-sm ${THEME.textSecondary} leading-relaxed`}>
              {module.details}
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Open module</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

const FeaturesSection = () => (
  <section className={`py-20 ${THEME.bg}`}>
    <div className="container mx-auto px-6">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h2 className={`text-3xl md:text-4xl ${THEME.fontHeading} ${THEME.text} mb-4`}>
          Built for modern lending.
        </h2>
        <p className={`text-lg ${THEME.textSecondary}`}>
          Powered by Claude AI for intelligent document understanding and analysis.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, i) => (
          <div key={i} className="text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${THEME.bgSecondary}`}>
              <feature.icon className={`w-7 h-7 ${THEME.accentSolid}`} />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${THEME.text}`}>{feature.title}</h3>
            <p className={`${THEME.textSecondary} leading-relaxed`}>{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const QuickAccessSection = () => (
  <section className={`py-16 ${THEME.bgSecondary} border-t ${THEME.border}`}>
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${THEME.text}`}>Ready to explore?</h2>
          <p className={`${THEME.textSecondary}`}>
            Jump directly into any module—no sign-in required for the demo.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {modules.map((module) => (
            <Link
              key={module.name}
              href={module.href}
              className={`
                inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                bg-white border hover:bg-zinc-50 transition-colors
                ${THEME.text} ${THEME.border} ${THEME.radius}
              `}
            >
              <module.icon className="w-4 h-4" />
              <span>{module.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// --- PAGE ---

export default function Page() {
  return (
    <div className={`min-h-screen ${THEME.fontBody} ${THEME.bg}`}>
      <Header />
      <main>
        <Hero />
        <ModulesSection />
        <FeaturesSection />
        <QuickAccessSection />
      </main>

      {/* Footer */}
      <footer className={`py-8 ${THEME.bg} border-t ${THEME.border}`}>
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 flex items-center justify-center rounded ${THEME.primary}`}>
              <FileText className={`w-4 h-4 ${THEME.primaryFg}`} />
            </div>
            <span className={`font-bold ${THEME.text}`}>LoanOS</span>
          </div>
          <p className={`text-sm ${THEME.textSecondary}`}>
            AI-powered loan lifecycle management platform
          </p>
        </div>
      </footer>
    </div>
  );
}
