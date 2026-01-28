import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export function Tooltip({ children, content, side = "top" }) {
    const [isVisible, setIsVisible] = useState(false);
    const prefersReducedMotion = useReducedMotion();

    const positions = {
        top: "-top-2 left-1/2 -translate-x-1/2 -translate-y-full",
        bottom: "-bottom-2 left-1/2 -translate-x-1/2 translate-y-full",
        left: "-left-2 top-1/2 -translate-y-1/2 -translate-x-full",
        right: "-right-2 top-1/2 -translate-y-1/2 translate-x-full",
    };

    const show = () => setIsVisible(true);
    const hide = () => setIsVisible(false);

    const animationProps = prefersReducedMotion
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
        : { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 } };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        {...animationProps}
                        transition={{ duration: 0.15 }}
                        role="tooltip"
                        className={`absolute ${positions[side]} z-50 px-2 py-1 text-xs font-medium text-white bg-gray-800 border border-white/10 rounded shadow-lg whitespace-nowrap pointer-events-none`}
                    >
                        {content}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
