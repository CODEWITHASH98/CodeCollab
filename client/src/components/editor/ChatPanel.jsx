import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export function ChatPanel({ messages, onSendMessage, onAIRequest }) {
    const [input, setInput] = useState("");
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input);
        setInput("");
    };

    return (
        <div className="flex flex-col h-full bg-surface border-l border-white/5">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-white">Live Chat</h3>
                <div className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-mono">
                    AI Active
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={cn(
                        "flex gap-3 max-w-[90%]",
                        msg.type === 'ai' ? "mr-auto" : "ml-auto flex-row-reverse"
                    )}>
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            msg.type === 'ai' ? "bg-primary/20 text-primary" : "bg-white/10 text-white"
                        )}>
                            {msg.type === 'ai' ? <Bot className="w-4 h-4" aria-hidden="true" /> : <User className="w-4 h-4" aria-hidden="true" />}
                        </div>

                        <div className={cn(
                            "rounded-2xl p-3 text-sm leading-relaxed border",
                            msg.type === 'ai'
                                ? "bg-surface border-white/10 text-gray-300 rounded-tl-none"
                                : "bg-primary/10 border-primary/20 text-white rounded-tr-none"
                        )}>
                            {/* Render message with simple markdown support */}
                            <div className="whitespace-pre-wrap">
                                {msg.content.split('\n').map((line, i) => (
                                    <span key={i}>
                                        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
                                            }
                                            return part;
                                        })}
                                        {i < msg.content.split('\n').length - 1 && <br />}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-background">
                <div className="relative">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message or /ask for AI…"
                        name="chatMessage"
                        autoComplete="off"
                        aria-label="Chat message input"
                        className="w-full bg-surface border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus-visible:outline-none focus-visible:border-primary/50 transition-[border-color]"
                    />
                    <button
                        type="submit"
                        aria-label="Send message"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <Send className="w-4 h-4" aria-hidden="true" />
                    </button>
                </div>
            </form>
        </div>
    );
}
