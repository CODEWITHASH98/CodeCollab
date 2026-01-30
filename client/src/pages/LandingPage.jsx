import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Code, Zap, Users, Shield, Github, Twitter } from "lucide-react";
import { Button } from "../components/ui/Button";
import { GlowCard } from "../components/ui/GlowCard";
import { AnimatedText } from "../components/ui/AnimatedText";
import HeroScene from "../components/3d/HeroScene";
import { roomAPI, getCookie, deleteCookie } from "../services/api";
import { GuestLoginModal } from "../components/auth/GuestLoginModal";
import { useAuth } from "../contexts/AuthContext";

// New components
import { HowItWorks } from "../components/ui/HowItWorks";
import { UseCases } from "../components/ui/UseCases";
import { Testimonials } from "../components/ui/Testimonials";
import { FAQ } from "../components/ui/FAQ";
import { Pricing } from "../components/ui/Pricing";
import { LanguageBadges } from "../components/ui/LanguageBadges";

export default function LandingPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingAction, setPendingAction] = useState('create');
    const [isLoading, setIsLoading] = useState(false); // New loading state
    const { isAuthenticated, logout } = useAuth();

    // Handle OAuth Redirects (Cookie Check > URL Check)
    // Handle OAuth Redirects (Ticket > Cookie > URL token)
    useEffect(() => {
        const checkAuth = async () => {
            // 1. Check for ticket (New Secure Flow)
            const ticket = searchParams.get("ticket");

            if (ticket) {
                try {
                    const response = await import("../services/api").then(m => m.authAPI.exchangeTicket(ticket));
                    if (response.success && response.data) {
                        const { token, user } = response.data;

                        localStorage.setItem("token", token);
                        // Ensure user is stored as string
                        localStorage.setItem("user", typeof user === 'string' ? user : JSON.stringify(user));

                        // Clear URL params
                        setSearchParams({});

                        // Trigger UI
                        setShowAuthModal(true);
                        setPendingAction('create');

                        // Force auth update
                        window.dispatchEvent(new Event('storage'));
                        return;
                    }
                } catch (err) {
                    console.error("Ticket exchange failed", err);
                }
            }

            // 2. Check for cookie (Legacy/Fallback)
            const cookieToken = getCookie("auth_token_transfer");
            const cookieUser = getCookie("auth_user_transfer");

            let token = cookieToken || searchParams.get("token");
            let userData = cookieUser || searchParams.get("user");

            // URL decode user data if needed
            if (userData) {
                try {
                    userData = decodeURIComponent(userData);
                } catch (e) {
                    console.warn("Failed to decode user data", e);
                }
            }

            if (token && userData) {
                try {
                    localStorage.setItem("token", token);
                    localStorage.setItem("user", userData);

                    // Cleanup
                    deleteCookie("auth_token_transfer");
                    deleteCookie("auth_user_transfer");
                    setSearchParams({});

                    // Trigger UI
                    setShowAuthModal(true);
                    setPendingAction('create');

                    // Force a reload or state update if auth context needs it
                    window.dispatchEvent(new Event('storage'));
                } catch (err) {
                    console.error("Failed to parse OAuth data", err);
                }
            }
        };

        checkAuth();
    }, [searchParams, setSearchParams]);

    const handleStartAction = (action) => {
        const token = localStorage.getItem("token");
        if (token && action === 'create') {
            createRoom();
        } else {
            setPendingAction(action);
            setShowAuthModal(true);
        }
    };

    const createRoom = async () => {
        if (isLoading) return; // Prevent double clicks

        setIsLoading(true);
        try {
            const response = await roomAPI.createRoom();
            if (response.success && response.data?.roomId) {
                navigate(`/room/${response.data.roomId}`);
            } else {
                console.error("Failed to create room:", response.error);
                // Optional: Show error toast here
            }
        } catch (error) {
            console.error("Failed to create room:", error);
        } finally {
            setIsLoading(false); // Reset loading state
        }
    };

    const handleAuthSuccess = (joinRoomId) => {
        setShowAuthModal(false);
        if (joinRoomId) {
            navigate(`/room/${joinRoomId}`);
        } else {
            createRoom();
        }
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="min-h-screen bg-background text-white selection:bg-primary/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" aria-hidden="true" />
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />

            {/* 3D Scene Background */}
            <HeroScene />

            {/* Auth Modal */}
            <GuestLoginModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={handleAuthSuccess}
                initialAction={pendingAction}
            />

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Code className="w-5 h-5 text-white" aria-hidden="true" />
                        </span>
                        CodeCollab
                    </a>

                    <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                        <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
                    </div>

                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <>
                                <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
                                <Button size="sm" onClick={() => handleStartAction('create')} glow>Dashboard</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => handleStartAction('join')}>Sign In</Button>
                                <Button size="sm" onClick={() => handleStartAction('create')} glow>Get Started</Button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 container mx-auto">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-medium mb-8"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" aria-hidden="true" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </span>
                        Open Source & Free Forever
                    </motion.div>

                    <AnimatedText
                        text="Code together. Ship faster."
                        className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
                    />

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed"
                    >
                        Real-time collaborative coding for technical interviews, pair programming,
                        and code reviews. With AI-powered assistance that actually helps.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Button size="lg" onClick={() => handleStartAction('create')} glow className="min-w-[200px]">
                            Start Coding Free <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => handleStartAction('join')} className="min-w-[200px]">
                            Join a Room
                        </Button>
                    </motion.div>

                    {/* Language badges */}
                    <LanguageBadges />
                </div>
            </section>

            {/* Stats/Social Proof */}
            <div className="border-y border-white/5 bg-white/[0.02]">
                <div className="container mx-auto px-6 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { label: "Developers", value: "5,000+" },
                            { label: "Rooms Created", value: "25,000+" },
                            { label: "Sync Latency", value: "<50ms" },
                            { label: "Languages", value: "10+" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-sm text-gray-500 uppercase tracking-wider">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <section id="features" className="py-24 px-6 container mx-auto">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold mb-6"
                    >
                        Everything you need to code together
                    </motion.h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Built for developers who value speed, simplicity, and seamless collaboration.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <GlowCard delay={0.2} className="h-full">
                        <Zap className="w-10 h-10 text-primary mb-6" aria-hidden="true" />
                        <h3 className="text-xl font-bold mb-3">Instant Rooms</h3>
                        <p className="text-gray-400 mb-6">
                            Create a collaborative coding environment in one click. No downloads, no installations, no waiting.
                        </p>
                        <div className="mt-auto pt-6 border-t border-white/5">
                            <div className="text-sm font-mono text-primary">
                                $ codecollab create<br />
                                {'>'} Room ready in 42ms
                            </div>
                        </div>
                    </GlowCard>

                    <GlowCard delay={0.4} className="h-full">
                        <Users className="w-10 h-10 text-primary mb-6" aria-hidden="true" />
                        <h3 className="text-xl font-bold mb-3">Real-time Sync</h3>
                        <p className="text-gray-400 mb-6">
                            Every keystroke syncs instantly. See your teammate's cursor, selections, and changes as they happen.
                        </p>
                        <div className="relative h-24 bg-black/40 rounded-lg overflow-hidden border border-white/5 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <div className="w-20 h-2 bg-white/10 rounded" />
                            </div>
                            <div className="ml-4 w-32 h-2 bg-primary/20 rounded animate-pulse" />
                        </div>
                    </GlowCard>

                    <GlowCard delay={0.6} className="h-full">
                        <Shield className="w-10 h-10 text-primary mb-6" aria-hidden="true" />
                        <h3 className="text-xl font-bold mb-3">AI Assistant</h3>
                        <p className="text-gray-400 mb-6">
                            Get intelligent hints, code reviews, and explanations. Our AI understands your context and helps you learn.
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                            AI: Consider using reduce() here…
                        </div>
                    </GlowCard>
                </div>
            </section>

            {/* How It Works */}
            <HowItWorks />

            {/* Use Cases */}
            <UseCases />

            {/* Testimonials */}
            <Testimonials />

            {/* Pricing */}
            <Pricing onGetStarted={() => handleStartAction('create')} />

            {/* FAQ */}
            <FAQ />

            {/* Final CTA */}
            <section className="py-24 px-6 container mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto bg-gradient-to-b from-white/5 to-transparent p-12 rounded-3xl border border-white/10 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" aria-hidden="true" />

                    <h2 className="text-4xl font-bold mb-6">Ready to code together?</h2>
                    <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                        Join thousands of developers who are already shipping better code, faster.
                    </p>
                    <Button size="lg" onClick={() => handleStartAction('create')} glow>
                        Start Your First Session
                    </Button>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-16 px-6 bg-black/20">
                <div className="container mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        {/* Brand */}
                        <div className="md:col-span-1">
                            <div className="flex items-center gap-2 font-bold text-xl mb-4">
                                <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                    <Code className="w-5 h-5 text-white" aria-hidden="true" />
                                </span>
                                CodeCollab
                            </div>
                            <p className="text-gray-500 text-sm mb-4">
                                Real-time collaborative coding for modern teams.
                            </p>
                            <div className="flex gap-4">
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" aria-label="GitHub">
                                    <Github className="w-5 h-5" />
                                </a>
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" aria-label="Twitter">
                                    <Twitter className="w-5 h-5" />
                                </a>
                            </div>
                        </div>

                        {/* Product */}
                        <div>
                            <h4 className="font-semibold text-white mb-4">Product</h4>
                            <ul className="space-y-3 text-sm text-gray-500">
                                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Roadmap</a></li>
                            </ul>
                        </div>

                        {/* Resources */}
                        <div>
                            <h4 className="font-semibold text-white mb-4">Resources</h4>
                            <ul className="space-y-3 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                                <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h4 className="font-semibold text-white mb-4">Company</h4>
                            <ul className="space-y-3 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                                <li><a href="mailto:hello@codecollab.dev" className="hover:text-primary transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} CodeCollab. All rights reserved.
                        </div>
                        <div className="flex gap-6 text-gray-500 text-sm">
                            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
