import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authAPI, roomAPI } from "../services/api";
import { API_URL } from "../utils/constants";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import {
  Sparkles,
  Rocket,
  Lightbulb,
  Users,
  Code2,
  ArrowRight,
  LayoutGrid,
  Zap,
  Shield,
  Terminal
} from "lucide-react";

const tips = [
  { icon: Zap, text: "Press Ctrl+Enter to run code instantly" },
  { icon: Lightbulb, text: "Click 'Hint' when stuck for AI suggestions" },
  { icon: Shield, text: "Your code is never stored without permission" },
  { icon: Terminal, text: "Supports 10+ languages with syntax highlighting" }
];

export default function HomePage() {
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get("token");
    const userParam = searchParams.get("user");

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        window.history.replaceState({}, "", "/");

        roomAPI.createRoom().then((response) => {
          if (response.success) {
            navigate(`/room/${response.data.roomId}`);
          }
        });
      } catch (err) {
        console.error("OAuth callback error:", err);
      }
    }
  }, [searchParams, navigate]);

  const handleGuestLogin = async () => {
    if (!userName.trim()) {
      alert("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.guestLogin(userName);
      if (response.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        const roomResponse = await roomAPI.createRoom();
        if (roomResponse.success) {
          navigate(`/room/${roomResponse.data.roomId}`);
        }
      } else {
        alert("Login failed: " + (response.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed: " + (err.response?.data?.message || err.message || "Network error"));
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!userName.trim()) {
      alert("Please enter your name");
      return;
    }

    if (!roomId.trim()) {
      alert("Please enter room ID");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.guestLogin(userName);
      if (response && response.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        navigate(`/room/${roomId.trim()}`);
      } else {
        alert("Login failed: " + (response?.message || "Invalid response"));
      }
    } catch (error) {
      console.error("Join room error:", error);
      const errorMessage = error?.response?.data?.message
        || error?.message
        || "Failed to join room. Please try again.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const handleGitHubLogin = () => {
    window.location.href = `${API_URL}/api/auth/github`;
  };

  const CurrentTipIcon = tips[currentTip].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Code2 className="w-12 h-12 text-white" aria-hidden="true" />
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
              CodeCollab
            </h1>
          </div>

          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-6">
            Real-time collaborative coding for technical interviews and pair programming
          </p>

          {/* Rotating Tips */}
          <motion.div
            key={currentTip}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-lg rounded-full border border-white/30"
          >
            <CurrentTipIcon className="w-4 h-4 text-white" aria-hidden="true" />
            <span className="text-white font-medium text-sm">{tips[currentTip].text}</span>
          </motion.div>
        </motion.div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-lg rounded-full border border-white/30">
            <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
            <span className="text-white font-semibold text-sm">Real-time Sync</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-lg rounded-full border border-white/30">
            <Rocket className="w-4 h-4 text-white" aria-hidden="true" />
            <span className="text-white font-semibold text-sm">Code Execution</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-lg rounded-full border border-white/30">
            <Lightbulb className="w-4 h-4 text-white" aria-hidden="true" />
            <span className="text-white font-semibold text-sm">AI Hints</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-lg rounded-full border border-white/30">
            <Users className="w-4 h-4 text-white" aria-hidden="true" />
            <span className="text-white font-semibold text-sm">Live Presence</span>
          </div>
          <Link
            to="/rooms"
            className="flex items-center gap-2 px-4 py-2 bg-primary/80 hover:bg-primary backdrop-blur-lg rounded-full border border-primary/50 transition-colors cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4 text-white" aria-hidden="true" />
            <span className="text-white font-semibold text-sm">Browse Rooms</span>
          </Link>
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {/* Quick Start Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card glass className="h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6" aria-hidden="true" />
                  Quick Start
                </CardTitle>
                <CardDescription className="text-white/80">
                  No account needed — start coding instantly
                </CardDescription>
              </CardHeader>

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGuestLogin()}
                  name="guestUserName"
                  autoComplete="name"
                  aria-label="Your name for quick start"
                  className="bg-white/90"
                />

                <Button
                  onClick={handleGuestLogin}
                  disabled={loading}
                  size="lg"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" aria-hidden="true" />
                      Creating…
                    </>
                  ) : (
                    <>
                      Create New Room
                      <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Join Room Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card glass className="h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-6 h-6" aria-hidden="true" />
                  Join Room
                </CardTitle>
                <CardDescription className="text-white/80">
                  Enter room ID to collaborate with others
                </CardDescription>
              </CardHeader>

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  name="joinUserName"
                  autoComplete="name"
                  aria-label="Your name to join room"
                  className="bg-white/90"
                />

                <Input
                  type="text"
                  placeholder="Room ID (e.g., code-xyz123)"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  name="roomIdToJoin"
                  autoComplete="off"
                  aria-label="Room ID to join"
                  className="bg-white/90"
                />

                <Button
                  onClick={handleJoinRoom}
                  disabled={loading}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" aria-hidden="true" />
                      Joining…
                    </>
                  ) : (
                    <>
                      Join Room
                      <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* OAuth Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-md mx-auto"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/30" />
            <span className="text-white/80 font-semibold">Or continue with</span>
            <div className="flex-1 h-px bg-white/30" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="google" onClick={handleGoogleLogin} size="lg">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </Button>

            <Button variant="github" onClick={handleGitHubLogin} size="lg">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </Button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16 text-white/60 text-sm"
        >
          <p>Built with React, Vite, Socket.IO & Monaco Editor</p>
          <p className="mt-2">
            <Link to="/" className="hover:text-white transition-colors">← Back to Landing Page</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
