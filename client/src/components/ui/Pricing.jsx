import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "./Button";

const features = [
    "Unlimited collaborative rooms",
    "Real-time code sync (<50ms latency)",
    "AI-powered code hints & reviews",
    "Live code execution",
    "Integrated chat & voice (coming soon)",
    "10+ programming languages",
    "Monaco editor with IntelliSense",
    "Export & share code snippets",
    "No account required"
];

export function Pricing({ onGetStarted }) {
    return (
        <section id="pricing" className="py-24 px-6 container mx-auto">
            <div className="text-center mb-16">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-5xl font-bold mb-6"
                >
                    Simple, transparent pricing
                </motion.h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    No hidden fees. No credit card required. Start coding for free.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-lg mx-auto"
            >
                <div className="relative p-8 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 overflow-hidden">
                    {/* Glow effect */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/20 blur-[80px] pointer-events-none" aria-hidden="true" />

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" aria-hidden="true" />
                        Free Forever
                    </div>

                    {/* Price */}
                    <div className="mb-8">
                        <span className="text-6xl font-bold text-white">$0</span>
                        <span className="text-gray-400 ml-2">/ forever</span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-400 mb-8">
                        Everything you need for collaborative coding. No limits, no catches.
                    </p>

                    {/* Features */}
                    <ul className="space-y-4 mb-8">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                                <span className="text-gray-300">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTA */}
                    <Button
                        size="lg"
                        className="w-full"
                        glow
                        onClick={onGetStarted}
                    >
                        Start Coding Free
                    </Button>

                    <p className="text-center text-sm text-gray-500 mt-4">
                        No credit card required
                    </p>
                </div>
            </motion.div>

            {/* Enterprise callout */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center mt-12"
            >
                <p className="text-gray-400">
                    Need enterprise features like SSO, audit logs, or custom deployments?{" "}
                    <a href="mailto:enterprise@codecollab.dev" className="text-primary hover:underline">
                        Contact us
                    </a>
                </p>
            </motion.div>
        </section>
    );
}
