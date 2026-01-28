import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
    {
        name: "Sarah Chen",
        role: "Senior Engineer @ Stripe",
        avatar: "SC",
        content: "CodeCollab transformed our pair programming sessions. The sub-50ms latency makes it feel like we're sitting next to each other.",
        stars: 5
    },
    {
        name: "Marcus Johnson",
        role: "Tech Lead @ Shopify",
        avatar: "MJ",
        content: "We use it for all our technical interviews now. Candidates love the clean interface, and we love seeing their code in real-time.",
        stars: 5
    },
    {
        name: "Priya Sharma",
        role: "Full Stack Developer",
        avatar: "PS",
        content: "The AI hints feature is incredible. It's like having a senior dev looking over your shoulder, without the pressure.",
        stars: 5
    },
    {
        name: "Alex Rivera",
        role: "CS Student @ MIT",
        avatar: "AR",
        content: "My study group uses CodeCollab for all our algorithm practice. Being able to run code instantly is a game-changer.",
        stars: 5
    },
    {
        name: "Emily Watson",
        role: "Engineering Manager @ Notion",
        avatar: "EW",
        content: "Finally, a tool that just works. No installations, no config files. Share a link and you're coding together.",
        stars: 5
    },
    {
        name: "David Kim",
        role: "Freelance Developer",
        avatar: "DK",
        content: "I use this to do code reviews with clients. They can see exactly what I'm changing and ask questions in real-time.",
        stars: 5
    }
];

export function Testimonials() {
    return (
        <section className="py-24 px-6 overflow-hidden">
            <div className="container mx-auto">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold mb-6"
                    >
                        Loved by developers worldwide
                    </motion.h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Join thousands of developers who ship better code, faster.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-primary/30 transition-colors"
                        >
                            {/* Stars */}
                            <div className="flex gap-1 mb-4">
                                {[...Array(testimonial.stars)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className="w-4 h-4 fill-primary text-primary"
                                        aria-hidden="true"
                                    />
                                ))}
                            </div>

                            {/* Content */}
                            <p className="text-gray-300 mb-6 leading-relaxed">
                                "{testimonial.content}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <div className="font-medium text-white">{testimonial.name}</div>
                                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
