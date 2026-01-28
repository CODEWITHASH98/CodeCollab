import { motion } from "framer-motion";
import { Code, Terminal, Laptop, BookOpen } from "lucide-react";

const useCases = [
    {
        icon: Code,
        title: "Pair Programming",
        description: "Work through complex problems together with real-time collaboration and shared cursors.",
        gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
        icon: Terminal,
        title: "Technical Interviews",
        description: "Conduct live coding interviews with instant execution and AI-assisted evaluation.",
        gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
        icon: Laptop,
        title: "Code Reviews",
        description: "Walk through PRs together, make live edits, and explain changes in real-time.",
        gradient: "from-orange-500/20 to-red-500/20"
    },
    {
        icon: BookOpen,
        title: "Teaching & Mentoring",
        description: "Demonstrate concepts with live code. Students can follow along and experiment.",
        gradient: "from-green-500/20 to-emerald-500/20"
    }
];

export function UseCases() {
    return (
        <section className="py-24 px-6 bg-white/[0.01]">
            <div className="container mx-auto">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold mb-6"
                    >
                        Built for every coding scenario
                    </motion.h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Whether you're interviewing, teaching, or shipping features, CodeCollab adapts to your workflow.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {useCases.map((useCase, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/30 transition-all duration-300 overflow-hidden"
                        >
                            {/* Background gradient */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                                aria-hidden="true"
                            />

                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:border-primary/30 transition-colors">
                                    <useCase.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                                </div>

                                <h3 className="text-lg font-semibold mb-2 text-white">
                                    {useCase.title}
                                </h3>

                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {useCase.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
