import { motion } from "framer-motion";
import { Sparkles, Link2, Users } from "lucide-react";

const steps = [
    {
        icon: Sparkles,
        title: "Create a Room",
        description: "Click 'Start Coding' to instantly spin up a collaborative coding environment. No signup required.",
        code: "$ codecollab init\n> Room created: code-x7k9m2"
    },
    {
        icon: Link2,
        title: "Share the Link",
        description: "Copy the room link and share it with your team. They can join with one click.",
        code: "https://codecollab.dev/room/code-x7k9m2"
    },
    {
        icon: Users,
        title: "Code Together",
        description: "See each other's cursors in real-time, chat, and use AI hints to solve problems faster.",
        code: "// 3 developers connected\n// AI: Consider using map() here"
    }
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 px-6 container mx-auto">
            <div className="text-center mb-16">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-5xl font-bold mb-6"
                >
                    Start collaborating in seconds
                </motion.h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    No complex setup. No downloads. Just share a link and start coding together.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connection line */}
                <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden="true" />

                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2 }}
                        className="relative"
                    >
                        {/* Step number */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/30 text-primary font-bold text-lg mb-6 mx-auto relative z-10">
                            {index + 1}
                        </div>

                        <div className="text-center">
                            <step.icon className="w-8 h-8 text-primary mx-auto mb-4" aria-hidden="true" />
                            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                            <p className="text-gray-400 mb-6">{step.description}</p>

                            {/* Code preview */}
                            <div className="bg-black/40 rounded-lg border border-white/5 p-4 text-left font-mono text-sm text-gray-300">
                                <pre className="whitespace-pre-wrap">{step.code}</pre>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
