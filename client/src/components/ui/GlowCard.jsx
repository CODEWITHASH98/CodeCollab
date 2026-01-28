import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export function GlowCard({ children, className, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            viewport={{ once: true }}
            className={cn(
                "group relative p-6 rounded-xl bg-surface border border-white/5 overflow-hidden",
                "hover:border-primary/50 transition-colors duration-300",
                className
            )}
        >
            {/* Glow Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-primary/10 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </div>

            {/* Corner Accents */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100" />

            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}
