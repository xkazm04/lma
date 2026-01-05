import React from 'react';
import Link from 'next/link';
import { ArrowRight, LayoutDashboard, FileText } from 'lucide-react';
import { THEME, MODULES, FEATURES, CAPABILITIES } from './shared';

export const VariantA = () => {
    return (
        <div className="space-y-20 pb-20">
            {/* Bento Grid Modules */}
            <section className={`py-12 ${THEME.bgSecondary}`}>
                <div className="container mx-auto px-6">
                    <h2 className={`text-3xl md:text-4xl ${THEME.fontHeading} ${THEME.text} mb-12 text-center`}>
                        The Suite
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]">
                        {MODULES.map((module, i) => (
                            <div
                                key={module.name}
                                className={`
                  group relative p-8 transition-all duration-300 overflow-hidden
                  ${THEME.bg} ${THEME.radius} border border-transparent hover:border-zinc-200
                  ${i === 0 || i === 3 ? 'md:col-span-2' : 'md:col-span-1'}
                  hover:shadow-xl hover:shadow-zinc-200/50
                `}
                            >
                                <div className={`
                    absolute top-0 right-0 p-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700
                    bg-gradient-to-br from-blue-400 to-purple-400
                  `} />
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${module.color} bg-opacity-10`}>
                                            <module.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className={`text-2xl font-bold mb-2 ${THEME.text}`}>{module.name}</h3>
                                        <p className={`${THEME.textSecondary} mb-4 max-w-sm`}>{module.description}</p>
                                        <p className={`text-sm ${THEME.textSecondary} opacity-70`}>{module.details}</p>
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-dashed border-zinc-100 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {module.highlights.slice(0, 2).map(h => (
                                                <span key={h} className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 border border-zinc-100 px-2 py-1 rounded-full">{h}</span>
                                            ))}
                                        </div>
                                        <Link href={module.href} className="flex items-center gap-1 text-sm font-medium text-zinc-900 group-hover:translate-x-1 transition-transform">
                                            Explore <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Glassmorphism Features */}
            <section className="container mx-auto px-6">
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 text-white p-12 lg:p-24 shadow-2xl">
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500 rounded-full blur-[100px] opacity-20" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-500 rounded-full blur-[100px] opacity-20" />

                    <div className="relative z-10 grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Intelligence built in.</h2>
                            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                                Our platform leverages advanced LLMs to process complex legal documents, ensuring you never miss a critical detail in your credit agreements.
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                {CAPABILITIES.map(cap => (
                                    <div key={cap.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                                        <cap.icon className="w-5 h-5 text-blue-400 mb-2" />
                                        <div className="text-sm font-semibold">{cap.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            {FEATURES.map((feature, i) => (
                                <div key={i} className={`p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all cursor-default`}>
                                    <div className="flex items-start gap-4">
                                        <feature.icon className="w-6 h-6 text-purple-400 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-lg mb-1">{feature.title}</h4>
                                            <p className="text-zinc-400 text-sm">{feature.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 text-center">
                <h3 className="text-2xl font-bold mb-6">Start your journey</h3>
                <div className="inline-flex p-1 bg-zinc-100 rounded-full">
                    <Link href="/dashboard" className="px-8 py-3 bg-white shadow-sm rounded-full text-sm font-semibold hover:scale-105 transition-transform">
                        Launch Demo
                    </Link>
                    <Link href="/contact" className="px-8 py-3 text-zinc-500 text-sm font-semibold hover:text-zinc-900 transition-colors">
                        Contact Sales
                    </Link>
                </div>
            </section>
        </div>
    );
};
