import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDown } from 'lucide-react';
import { THEME, MODULES, FEATURES } from './shared';

export const VariantC = () => {
    return (
        <div className="bg-white overflow-hidden">
            {/* Featured Big Module */}
            <section className="container mx-auto px-6 py-20">
                <div className="flex flex-col lg:flex-row gap-20 items-end">
                    <div className="lg:w-1/2">
                        <div className="text-zinc-400 text-sm mb-4 font-mono tracking-widest uppercase">01 / Featured Module</div>
                        <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.9]">
                            Deal<br /><span className="text-blue-600">Room</span>
                        </h2>
                        <p className="text-2xl text-zinc-600 max-w-md leading-relaxed">
                            A collaborative space where negotiations happen in real-time, not over email threads.
                        </p>
                        <div className="mt-12 flex items-center gap-4">
                            <Link href="/deals" className="group flex items-center gap-2 text-xl font-bold hover:text-blue-600 transition-colors">
                                Launch Deal Room <ArrowUpRight className="w-6 h-6 group-hover:rotate-45 transition-transform" />
                            </Link>
                        </div>
                    </div>
                    <div className="lg:w-1/2">
                        <div className="aspect-square bg-zinc-100 rounded-[3rem] p-12 hover:scale-[0.98] transition-transform duration-700 cursor-pointer">
                            {/* Abstract Visual Rep of Deal Room */}
                            <div className="w-full h-full bg-blue-600 rounded-2xl flex items-center justify-center text-white relative overflow-hidden">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white/20 rounded-full animate-[spin_10s_linear_infinite]" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-4 border-white/40 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                                <span className="text-9xl font-bold opacity-20">DR</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Marquee / Ticker (Simulated) */}
            <div className="py-12 border-t border-b border-zinc-100 overflow-hidden whitespace-nowrap">
                <div className="inline-flex gap-24 animate-[slide_20s_linear_infinite] opacity-50 font-mono uppercase text-sm">
                    {['Smart Extraction', 'Risk Detection', 'Collaboration', 'Analytics', 'Compliance', 'Trading'].map((item, i) => (
                        <span key={i} className="flex items-center gap-4">
                            <span className="w-2 h-2 bg-black rounded-full" />
                            {item}
                        </span>
                    ))}
                    {['Smart Extraction', 'Risk Detection', 'Collaboration', 'Analytics', 'Compliance', 'Trading'].map((item, i) => (
                        <span key={`clone-${i}`} className="flex items-center gap-4">
                            <span className="w-2 h-2 bg-black rounded-full" />
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            {/* Other Modules List */}
            <section className="py-32 bg-zinc-900 text-white">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16">
                        <div>
                            <div className="sticky top-32">
                                <h3 className="text-4xl font-light mb-8 text-zinc-400">Platform <span className="text-white font-bold">Modules</span></h3>
                                <p className="text-xl text-zinc-500 max-w-sm mb-12">
                                    Explore the other fundamental components of the LoanOS ecosystem.
                                </p>
                                <ArrowDown className="w-12 h-12 text-zinc-700 animate-bounce" />
                            </div>
                        </div>
                        <div className="space-y-32">
                            {MODULES.filter(m => m.name !== "Deal Room").map((module, i) => (
                                <div key={module.name} className="group">
                                    <div className="text-zinc-600 font-mono text-sm mb-4">0{i + 2}</div>
                                    <h4 className="text-5xl font-bold mb-6 group-hover:text-blue-500 transition-colors cursor-pointer">{module.name}</h4>
                                    <p className="text-xl text-zinc-400 leading-relaxed max-w-md mb-8">{module.details}</p>
                                    <Link href={module.href} className="inline-flex items-center gap-2 text-lg hover:underline underline-offset-4">
                                        View Details <ArrowUpRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Big Feature Cards */}
            <section className="py-20 container mx-auto px-6">
                <div className="flex flex-wrap gap-4">
                    {FEATURES.map((f, i) => (
                        <div key={i} className={`flex-1 min-w-[300px] p-12 rounded-[2rem] ${i % 2 === 0 ? 'bg-blue-50 text-blue-900' : 'bg-zinc-100 text-zinc-900'}`}>
                            <f.icon className="w-10 h-10 mb-8" />
                            <h4 className="text-2xl font-bold mb-4">{f.title}</h4>
                            <p className="opacity-70 leading-relaxed">{f.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
