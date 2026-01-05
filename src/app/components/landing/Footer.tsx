import React from 'react';
import { FileText } from 'lucide-react';
import { THEME } from './shared';

export const Footer = () => (
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
);
