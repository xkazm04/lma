import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, ArrowRight, FileText } from 'lucide-react';
import { THEME } from './shared';

const Badge = ({ children }: { children: React.ReactNode }) => (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border ${THEME.border} bg-white rounded-full`}>
        <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        {children}
    </div>
);

export const Hero = () => (
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
                    Extract insights from loan documents, negotiate terms collaboratively, track compliance deadlines,
                    and manage secondary market trades—all powered by Claude AI.
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
