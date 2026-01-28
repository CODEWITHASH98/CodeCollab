import { motion } from "framer-motion";

const languages = [
    { name: "JavaScript", color: "#F7DF1E", bgColor: "rgba(247, 223, 30, 0.1)" },
    { name: "TypeScript", color: "#3178C6", bgColor: "rgba(49, 120, 198, 0.1)" },
    { name: "Python", color: "#3776AB", bgColor: "rgba(55, 118, 171, 0.1)" },
    { name: "Java", color: "#ED8B00", bgColor: "rgba(237, 139, 0, 0.1)" },
    { name: "C++", color: "#00599C", bgColor: "rgba(0, 89, 156, 0.1)" },
    { name: "Go", color: "#00ADD8", bgColor: "rgba(0, 173, 216, 0.1)" },
    { name: "Rust", color: "#DEA584", bgColor: "rgba(222, 165, 132, 0.1)" },
    { name: "Ruby", color: "#CC342D", bgColor: "rgba(204, 52, 45, 0.1)" },
];

export function LanguageBadges() {
    return (
        <div className="flex flex-wrap justify-center gap-3 mt-8">
            {languages.map((lang, index) => (
                <motion.div
                    key={lang.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors"
                    style={{
                        backgroundColor: lang.bgColor,
                        borderColor: `${lang.color}30`
                    }}
                >
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: lang.color }}
                        aria-hidden="true"
                    />
                    <span className="text-sm font-medium text-gray-300">{lang.name}</span>
                </motion.div>
            ))}
        </div>
    );
}
