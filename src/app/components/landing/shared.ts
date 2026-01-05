import {
    FileText,
    Handshake,
    ClipboardCheck,
    ArrowLeftRight,
    Brain,
    Compass,
    Shield,
    GitCompare,
    Calendar,
    BarChart3,
    CheckCircle,
} from 'lucide-react';

// --- CONFIGURATION (NEXUS THEME) ---
export const THEME = {
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
export const MODULES = [
    {
        name: 'Document Hub',
        href: '/documents',
        icon: FileText,
        description: 'AI-powered document analysis',
        details: 'Upload credit agreements, extract key terms, compare versions, and detect risks automatically.',
        highlights: ['Smart extraction', 'Version comparison', 'Risk detection'],
        color: 'bg-blue-50 text-blue-600',
    },
    {
        name: 'Deal Room',
        href: '/deals',
        icon: Handshake,
        description: 'Collaborative term negotiation',
        details: 'Multi-party negotiation workspace with proposals, comments, and deal pipeline tracking.',
        highlights: ['Real-time collaboration', 'Smart inbox triage', 'Multiple views'],
        color: 'bg-purple-50 text-purple-600',
    },
    {
        name: 'Compliance',
        href: '/compliance',
        icon: ClipboardCheck,
        description: 'Obligation & covenant tracking',
        details: 'Monitor deadlines, track covenant tests, and predict potential breaches before they occur.',
        highlights: ['Deadline calendar', 'Covenant monitoring', 'Predictive alerts'],
        color: 'bg-green-50 text-green-600',
    },
    {
        name: 'Trading',
        href: '/trading',
        icon: ArrowLeftRight,
        description: 'Secondary market due diligence',
        details: 'Streamline loan trades with automated DD checklists, settlement tracking, and position management.',
        highlights: ['DD automation', 'Settlement tracking', 'P&L monitoring'],
        color: 'bg-orange-50 text-orange-600',
    },
];

export const FEATURES = [
    {
        title: 'AI-Powered Extraction',
        description: 'Claude AI extracts covenants, obligations, and key terms from complex loan documents automatically.',
        icon: Brain,
    },
    {
        title: 'Explore Mode',
        description: 'Built-in guided exploration helps users discover features and understand each module.',
        icon: Compass,
    },
    {
        title: 'Enterprise Ready',
        description: 'Bank-grade security with Supabase authentication and row-level security policies.',
        icon: Shield,
    },
];

export const CAPABILITIES = [
    { icon: GitCompare, label: 'Document Comparison', description: 'Side-by-side diff analysis' },
    { icon: Calendar, label: 'Deadline Calendar', description: 'Never miss obligations' },
    { icon: BarChart3, label: 'Portfolio Analytics', description: 'Health scoring & trends' },
    { icon: CheckCircle, label: 'DD Checklists', description: 'Automated verification' },
];
