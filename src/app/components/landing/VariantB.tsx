import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { THEME, MODULES, FEATURES, CAPABILITIES } from './shared';

export const VariantB = () => {
    return (
        <div className="font-mono text-sm">
            {/* Strict Grid Modules */}
            <section className="border-t border-b border-black">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-black">
                    {MODULES.map((module, i) => (
                        <div key={module.name} className="group relative bg-white hover:bg-zinc-50 transition-colors h-full">
                            <div className="p-6 h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-8">
                                        <span className="text-xs uppercase tracking-widest text-zinc-500">0{i + 1}</span>
                                        <module.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">{module.name}</h3>
                                    <p className="text-zinc-600 mb-6 leading-relaxed">{module.details}</p>
                                </div>

                                <div>
                                    <ul className="space-y-2">
                                        {module.highlights.map(h => (
                                            <li key={h} className="flex items-center gap-2 text-xs text-zinc-500">
                                                <span className="w-1 h-1 bg-black rounded-full" />
                                                {h}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Data Density Features */}
            <section className="bg-zinc-100 py-20 px-6">
                <div className="container mx-auto">
                    <div className="grid md:grid-cols-12 gap-12">
                        <div className="md:col-span-4">
                            <h2 className="text-4xl font-bold uppercase tracking-tighter mb-6">System<br />Architecture</h2>
                            <p className="text-zinc-500 mb-8 border-l-2 border-black pl-4">
                                Engineered for high-frequency document processing and real-time covenant analysis.
                            </p>

                            <div className="grid grid-cols-2 gap-px bg-zinc-300 border border-zinc-300">
                                {CAPABILITIES.map(cap => (
                                    <div key={cap.label} className="bg-white p-4">
                                        <div className="text-zinc-400 text-[10px] uppercase mb-1">Capability</div>
                                        <div className="font-bold">{cap.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="md:col-span-8 flex flex-col gap-4">
                            {FEATURES.map((feature, i) => (
                                <div key={i} className="bg-white border border-zinc-300 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center group hover:border-black transition-colors">
                                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center flex-shrink-0">
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-bold uppercase mb-1">{feature.title}</h4>
                                        <p className="text-zinc-500">{feature.description}</p>
                                    </div>
                                    <div className="hidden md:block text-zinc-300 group-hover:text-black transition-colors">
                                        <ArrowRight className="w-6 h-6" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="border-t border-black bg-white">
                <div className="container mx-auto px-6 py-16 flex flex-col items-center justify-center gap-6 text-center">
                    <div className="text-2xl font-bold uppercase">Ready to explore?</div>
                    <Link
                        href="/dashboard"
                        className="px-8 py-4 bg-black text-white hover:bg-zinc-800 transition-colors uppercase font-bold tracking-wider"
                    >
                        Enter Demo
                    </Link>
                </div>
            </div>
        </div>
    );
};
