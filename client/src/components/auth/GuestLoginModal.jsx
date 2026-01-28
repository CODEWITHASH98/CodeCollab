import { useState, useEffect } from "react";
import { ArrowRight, User, Hash, Github, Mail, Lock, LogOut } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL } from "../../utils/constants";

export function GuestLoginModal({ isOpen, onClose, onSuccess, initialAction = 'create' }) {
    const { guestLogin, login, register, logout, isAuthenticated, user, loading: authLoading } = useAuth();

    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [roomId, setRoomId] = useState("");
    const [mode, setMode] = useState(initialAction); // 'create' | 'join'
    const [authMode, setAuthMode] = useState('guest'); // 'guest' | 'login' | 'register'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Reset error when mode changes
    useEffect(() => {
        setError("");
    }, [mode, authMode]);

    const handleAuthenticatedSubmit = (e) => {
        e.preventDefault();
        if (mode === 'join' && !roomId.trim()) {
            setError("Please enter a Room ID");
            return;
        }
        onSuccess(mode === 'join' ? roomId.trim() : null);
    };

    const handleGuestSubmit = async (e) => {
        e.preventDefault();
        if (!userName.trim()) {
            setError("Please enter your name");
            return;
        }

        if (mode === 'join' && !roomId.trim()) {
            setError("Please enter a Room ID");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await guestLogin(userName);
            if (result.success) {
                onSuccess(mode === 'join' ? roomId.trim() : null);
            } else {
                setError(result.error || "Login failed");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setError("Please enter email and password");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await login(email, password);
            if (result.success) {
                onSuccess(mode === 'join' ? roomId.trim() : null);
            } else {
                setError(result.error || "Login failed");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!userName.trim() || !email.trim() || !password.trim()) {
            setError("Please fill all fields");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await register(userName, email, password);
            if (result.success) {
                onSuccess(mode === 'join' ? roomId.trim() : null);
            } else {
                setError(result.error || "Registration failed");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider) => {
        window.location.href = `${API_URL}/api/auth/${provider}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? "Start New Session" : "Join Collaboration"}>
            <div className="space-y-6">
                {/* Room Mode Toggle */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setMode('create')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'create' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Create Room
                    </button>
                    <button
                        onClick={() => setMode('join')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'join' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Join by ID
                    </button>
                </div>

                {/* If Authenticated: Show Simplified View */}
                {isAuthenticated ? (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Logged in as</p>
                                    <p className="font-medium text-white">{user?.userName}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-400 hover:text-white">
                                <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                                Logout
                            </Button>
                        </div>

                        {mode === 'join' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Room ID
                                </label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                                    <input
                                        type="text"
                                        value={roomId}
                                        onChange={(e) => setRoomId(e.target.value)}
                                        placeholder="e.g. code-xxxx-xxxx"
                                        name="roomId"
                                        autoComplete="off"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus-visible:outline-none focus-visible:border-primary/50 transition-[border-color] font-mono"
                                    />
                                </div>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <Button onClick={handleAuthenticatedSubmit} className="w-full" size="lg" glow>
                            {mode === 'create' ? "Start Session" : "Join Room"} <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Auth Mode Tabs */}
                        <div className="flex gap-2 text-sm">
                            <button
                                onClick={() => setAuthMode('guest')}
                                className={`px-3 py-1.5 rounded-lg transition-[background-color,color] ${authMode === 'guest' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
                            >
                                Quick Start
                            </button>
                            <button
                                onClick={() => setAuthMode('login')}
                                className={`px-3 py-1.5 rounded-lg transition-[background-color,color] ${authMode === 'login' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setAuthMode('register')}
                                className={`px-3 py-1.5 rounded-lg transition-[background-color,color] ${authMode === 'register' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
                            >
                                Register
                            </button>
                        </div>

                        {/* Guest Form */}
                        {authMode === 'guest' && (
                            <form onSubmit={handleGuestSubmit} className="space-y-4 animate-in fade-in duration-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">
                                        Your Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            placeholder="e.g. Alex"
                                            name="guestName"
                                            autoComplete="name"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus-visible:outline-none focus-visible:border-primary/50 transition-[border-color]"
                                        />
                                    </div>
                                </div>

                                {mode === 'join' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                            Room ID
                                        </label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                                            <input
                                                type="text"
                                                value={roomId}
                                                onChange={(e) => setRoomId(e.target.value)}
                                                placeholder="e.g. code-xxxx-xxxx"
                                                name="joinRoomId"
                                                autoComplete="off"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus-visible:outline-none focus-visible:border-primary/50 transition-[border-color] font-mono"
                                            />
                                        </div>
                                    </div>
                                )}

                                {error && <p className="text-red-500 text-sm">{error}</p>}

                                <Button
                                    type="submit"
                                    className="w-full"
                                    size="lg"
                                    disabled={loading}
                                    glow
                                >
                                    {loading ? "Initializing…" : (
                                        <>
                                            {mode === 'create' ? "Get Started" : "Join Room"} <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}

                        {/* Login Form */}
                        {authMode === 'login' && (
                            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in duration-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            name="loginEmail"
                                            autoComplete="email"
                                            spellCheck="false"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus-visible:outline-none focus-visible:border-primary/50 transition-[border-color]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            name="loginPassword"
                                            autoComplete="current-password"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus-visible:outline-none focus-visible:border-primary/50 transition-[border-color]"
                                        />
                                    </div>
                                </div>

                                {mode === 'join' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Room ID</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                                            <input
                                                type="text"
                                                value={roomId}
                                                onChange={(e) => setRoomId(e.target.value)}
                                                placeholder="e.g. code-xxxx-xxxx"
                                                name="loginRoomId"
                                                autoComplete="off"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus-visible:outline-none focus-visible:border-primary/50 transition-[border-color] font-mono"
                                            />
                                        </div>
                                    </div>
                                )}

                                {error && <p className="text-red-500 text-sm">{error}</p>}

                                <Button type="submit" className="w-full" size="lg" disabled={loading} glow>
                                    {loading ? "Signing in…" : "Sign In"}
                                </Button>
                            </form>
                        )}

                        {/* Register Form */}
                        {authMode === 'register' && (
                            <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-in fade-in duration-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            placeholder="Your name"
                                            name="registerName"
                                            autoComplete="name"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus-visible:outline-none focus-visible:border-primary/50 transition-[border-color]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            name="registerEmail"
                                            autoComplete="email"
                                            spellCheck="false"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus-visible:outline-none focus-visible:border-primary/50 transition-[border-color]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="At least 6 characters…"
                                            name="registerPassword"
                                            autoComplete="new-password"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus-visible:outline-none focus-visible:border-primary/50 transition-[border-color]"
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-red-500 text-sm">{error}</p>}

                                <Button type="submit" className="w-full" size="lg" disabled={loading} glow>
                                    {loading ? "Creating account…" : "Create Account"}
                                </Button>
                            </form>
                        )}

                        {/* OAuth Divider */}
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#0F0F0F] px-2 text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        {/* OAuth Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" onClick={() => handleSocialLogin('google')} className="bg-white/5 border-white/10 hover:bg-white/10">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 mr-2" alt="Google" />
                                Google
                            </Button>
                            <Button variant="outline" onClick={() => handleSocialLogin('github')} className="bg-white/5 border-white/10 hover:bg-white/10">
                                <Github className="w-4 h-4 mr-2" aria-hidden="true" />
                                GitHub
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

