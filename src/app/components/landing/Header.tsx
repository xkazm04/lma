import React from 'react';
import Link from 'next/link';
import { FileText, LayoutDashboard } from 'lucide-react';
import { THEME, MODULES } from './shared';

export const Header = () => (
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
                {MODULES.map((module) => (
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
                <Link
                    href="/dashboard"
                    className={`inline-flex px-4 py-2 text-sm font-semibold ${THEME.primary} ${THEME.primaryFg} ${THEME.radius} transition-opacity hover:opacity-90`}
                >
                    Enter Demo
                </Link>
            </div>
        </div>
    </header>
);
