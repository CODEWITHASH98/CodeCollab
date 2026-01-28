import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
    {
        question: "Is CodeCollab free to use?",
        answer: "Yes! CodeCollab is completely free for unlimited rooms, unlimited users, and unlimited coding sessions. We believe collaborative coding should be accessible to everyone."
    },
    {
        question: "Do I need to create an account?",
        answer: "No account required! You can start coding immediately as a guest. However, creating an account lets you save your rooms, track history, and customize your experience."
    },
    {
        question: "Which programming languages are supported?",
        answer: "We support JavaScript, TypeScript, Python, Java, C++, Go, Rust, Ruby, PHP, and more. Our Monaco-powered editor provides syntax highlighting and IntelliSense for all major languages."
    },
    {
        question: "How does real-time collaboration work?",
        answer: "We use Operational Transformation (OT) to sync every keystroke across all connected users in under 50ms. You'll see each teammate's cursor in a different color, just like Google Docs."
    },
    {
        question: "What AI features are available?",
        answer: "Our AI assistant can provide hints when you're stuck, review your code for bugs and improvements, and explain complex code snippets. It's context-aware and understands your entire codebase."
    },
    {
        question: "Is my code secure?",
        answer: "Absolutely. All connections are encrypted with TLS. Room codes are randomly generated and not indexed. Your code is never stored permanently unless you explicitly save it."
    },
    {
        question: "Can I use this for technical interviews?",
        answer: "Yes! CodeCollab is perfect for conducting live coding interviews. Share a room link with candidates, see their code in real-time, and even run their solutions instantly."
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-24 px-6 container mx-auto">
            <div className="text-center mb-16">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-5xl font-bold mb-6"
                >
                    Frequently asked questions
                </motion.h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Everything you need to know about CodeCollab.
                </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]"
                    >
                        <button
                            onClick={() => toggleFAQ(index)}
                            className="w-full px-6 py-5 flex items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                            aria-expanded={openIndex === index}
                            aria-controls={`faq-answer-${index}`}
                        >
                            <span className="font-medium text-white pr-4">{faq.question}</span>
                            <ChevronDown
                                className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${openIndex === index ? "rotate-180" : ""
                                    }`}
                                aria-hidden="true"
                            />
                        </button>

                        <AnimatePresence>
                            {openIndex === index && (
                                <motion.div
                                    id={`faq-answer-${index}`}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-6 pb-5 text-gray-400 leading-relaxed">
                                        {faq.answer}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
