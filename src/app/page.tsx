'use client';

import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  FileText,
  Globe,
  Check
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

const ButtonPrimary = ({ text, icon: Icon }: { text: string, icon?: any }) => (
  <button className={`
    group relative inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-200
    ${THEME.primary} ${THEME.primaryFg} ${THEME.radius}
    hover:scale-[1.02] active:scale-[0.98]
  `}>
    <span>{text}</span>
    {Icon && <Icon className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
  </button>
);

const ButtonSecondary = ({ text }: { text: string }) => (
  <button className={`
    inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-200
    bg-white border hover:bg-zinc-50
    ${THEME.text} ${THEME.border} ${THEME.radius} 
  `}>
    <span>{text}</span>
  </button>
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
        <span className={`text-lg font-bold tracking-tight ${THEME.fontHeading} ${THEME.text}`}>LoanMaster</span>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        {['Product', 'Solutions', 'Customers', 'Pricing'].map((item) => (
          <a key={item} href="#" className={`text-sm font-medium ${THEME.textSecondary} hover:${THEME.text} transition-colors`}>
            {item}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <a href="#" className={`text-sm font-medium ${THEME.text} hover:opacity-70`}>Sign in</a>
        <button className={`hidden sm:inline-flex px-4 py-2 text-sm font-semibold ${THEME.primary} ${THEME.primaryFg} ${THEME.text} ${THEME.radius} transition-opacity hover:opacity-90`}>
          Get Started
        </button>
      </div>
    </div>
  </header>
);

const Hero = () => (
  <section className={`relative pt-32 pb-24 overflow-hidden ${THEME.bg}`}>
    {/* Grid Background Effect */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

    <div className="container mx-auto px-6 relative z-10">
      <div className="flex flex-col lg:flex-row items-center gap-16">

        {/* Text Content */}
        <div className="flex-1 max-w-2xl space-y-8">
          <Badge>v2.0 Now Available</Badge>

          <h1 className={`text-5xl lg:text-7xl ${THEME.fontHeading} ${THEME.text} leading-[1.1]`}>
            Loan processing <br />
            <span className="text-zinc-400">reimagined.</span>
          </h1>

          <p className={`text-lg lg:text-xl leading-relaxed ${THEME.textSecondary} max-w-lg`}>
            Stop wrestling with PDFs and email threads. Orchestrate your entire lending workflow in one workspace.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <ButtonPrimary text="Start Building" icon={ArrowRight} />
            <ButtonSecondary text="View Documentation" />
          </div>

          <div className="pt-8 flex items-center gap-8">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600`}>
                  U{i}
                </div>
              ))}
            </div>
            <div className={`text-sm ${THEME.textSecondary}`}>
              <span className={`font-bold ${THEME.text}`}>1,000+</span> teams streamlining operations
            </div>
          </div>
        </div>

        {/* Visual Content */}
        <div className="flex-1 w-full perspective-[1000px]">
          <div className={`
              relative w-full aspect-[4/3] ${THEME.shadow} ${THEME.radius} overflow-hidden
              bg-white border border-zinc-200
              transition-transform duration-700 hover:rotate-y-[-2deg] hover:rotate-x-[2deg]
           `}>
            {/* Mock Interface */}
            <div className="absolute inset-0 flex flex-col">
              {/* Window Header */}
              <div className={`h-10 border-b flex items-center px-4 gap-2 ${THEME.border}`}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                </div>
              </div>
              {/* App Content */}
              <div className="flex-1 p-6 flex gap-6">
                {/* Sidebar */}
                <div className="w-48 hidden md:block space-y-2">
                  {['Inbox', 'Applications', 'Approvals', 'Archived'].map((item, i) => (
                    <div key={item} className={`px-3 py-2 text-sm rounded-md ${i === 1 ? THEME.bgSecondary : 'hover:bg-black/5'} ${i === 1 ? THEME.text : THEME.textSecondary}`}>
                      {item}
                    </div>
                  ))}
                </div>
                {/* Main Area */}
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className={`text-lg font-bold ${THEME.text}`}>Application #8821</h3>
                    <span className={`px-2 py-1 text-xs rounded-full bg-green-100 text-green-700`}>Approved</span>
                  </div>

                  <div className={`p-4 rounded-lg border ${THEME.border} bg-slate-50`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600`}>
                        JD
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${THEME.text}`}>John Doe</div>
                        <div className="text-xs text-slate-400">Submitted 2 hours ago</div>
                      </div>
                    </div>
                    <div className={`h-2 w-full bg-slate-100 rounded-full overflow-hidden`}>
                      <div className="h-full w-[70%] bg-blue-500 rounded-full" />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                      <span>Risk Score Analysis</span>
                      <span>70% Complete</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                      <div key={i} className={`h-24 rounded-lg border border-dashed ${THEME.border} flex items-center justify-center text-slate-400`}>
                        <FileText className="w-6 h-6 opacity-30" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements for emphasis */}
            <div className={`
                 absolute -right-6 bottom-12 p-4 rounded-xl shadow-lg border backdrop-blur-md
                 bg-zinc-900 text-white border-zinc-700
               `}>
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-xs opacity-70">Credit Check</div>
                  <div className="font-bold text-sm">Passed</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </section>
);

const Features = () => (
  <section className={`py-24 ${THEME.bgSecondary} relative overflow-hidden`}>
    <div className="container mx-auto px-6">
      <div className="max-w-3xl mb-16">
        <h2 className={`text-3xl md:text-5xl ${THEME.fontHeading} ${THEME.text} mb-6`}>
          Built for speed. <br />
          <span className="opacity-40">Designed for reliability.</span>
        </h2>
        <p className={`text-lg ${THEME.textSecondary}`}>
          Every feature is crafted to remove friction from your lending operations.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: 'Instant Analysis', desc: 'AI-powered document scanning extracts data in seconds, not hours.', icon: Zap },
          { title: 'Bank-Grade Security', desc: 'Enterprise-ready infrastructure with SOC2 compliance built-in.', icon: ShieldCheck },
          { title: 'Global Coverage', desc: 'Support for documents and compliance across 40+ jurisdictions.', icon: Globe },
        ].map((f, i) => (
          <div
            key={i}
            className={`
                   group p-8 transition-all duration-300
                   ${THEME.bg} ${THEME.border}
                   border hover:border-zinc-400
                   ${THEME.radius}
                `}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors ${THEME.bgSecondary} group-hover:bg-opacity-80`}>
              <f.icon className={`w-6 h-6 ${THEME.accentSolid}`} />
            </div>
            <h3 className={`text-xl font-bold mb-3 ${THEME.text}`}>{f.title}</h3>
            <p className={`${THEME.textSecondary} leading-relaxed`}>{f.desc}</p>
          </div>
        ))}
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
        <Features />

        {/* Simple CTA Section */}
        <section className={`py-24 ${THEME.bg} border-t ${THEME.border}`}>
          <div className="container mx-auto px-6 text-center">
            <h2 className={`text-3xl md:text-5xl font-bold mb-8 ${THEME.text}`}>Ready to modernize?</h2>
            <div className="flex justify-center">
              <ButtonPrimary text="Start your free trial" />
            </div>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className={`py-12 ${THEME.bgSecondary} border-t ${THEME.border}`}>
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className={`font-bold ${THEME.text}`}>LoanMaster Inc.</div>
          <div className={`text-sm ${THEME.textSecondary}`}>© 2024 All rights reserved.</div>
        </div>
      </footer>

    </div>
  );
}
