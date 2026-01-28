/**
 * Active Rooms Page
 * 
 * Displays a list of all active collaboration rooms.
 * Allows users to join existing rooms or create new ones.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { roomAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import {
    Users,
    Plus,
    ArrowRight,
    Clock,
    Code2,
    RefreshCw,
    Home
} from 'lucide-react';

export default function RoomsPage() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    // Fetch active rooms
    const fetchRooms = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await roomAPI.getActiveRooms();
            if (response.success) {
                setRooms(response.data.rooms || []);
            } else {
                setError(response.error || 'Failed to fetch rooms');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchRooms();
        }
    }, [isAuthenticated]);

    // Create new room
    const handleCreateRoom = async () => {
        setCreating(true);
        try {
            const response = await roomAPI.createRoom();
            if (response.success) {
                navigate(`/room/${response.data.roomId}`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    // Join existing room
    const handleJoinRoom = (roomId) => {
        navigate(`/room/${roomId}`);
    };

    // Format time ago with Intl.RelativeTimeFormat
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

        if (diffMins < 1) return rtf.format(0, 'minute');
        if (diffMins < 60) return rtf.format(-diffMins, 'minute');
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return rtf.format(-diffHours, 'hour');
        return rtf.format(-Math.floor(diffHours / 24), 'day');
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
                <Card glass className="max-w-md p-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Please Log In</h2>
                    <p className="text-white/80 mb-6">You need to be logged in to view active rooms.</p>
                    <Button onClick={() => navigate('/')} variant="primary">
                        <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                        Go to Home
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            className="flex items-center gap-2 cursor-pointer hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                            onClick={() => navigate('/')}
                            aria-label="Go to home page"
                        >
                            <Code2 className="w-8 h-8 text-white" aria-hidden="true" />
                            <h1 className="text-2xl font-bold text-white">Active Rooms</h1>
                        </button>
                        <Badge variant="outline" className="text-white border-white/30">
                            {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={fetchRooms}
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                            Refresh
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateRoom}
                            disabled={creating}
                        >
                            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                            {creating ? 'Creating…' : 'New Room'}
                        </Button>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-white">
                        <p>{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Card glass key={i} className="p-6">
                                <Skeleton className="h-6 w-32 mb-4" />
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-4 w-20" />
                            </Card>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && rooms.length === 0 && (
                    <Card glass className="max-w-md mx-auto p-8 text-center">
                        <Users className="w-16 h-16 text-white/60 mx-auto mb-4" aria-hidden="true" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Active Rooms</h3>
                        <p className="text-white/70 mb-6">
                            Be the first to create a room and start collaborating!
                        </p>
                        <Button variant="primary" onClick={handleCreateRoom} disabled={creating}>
                            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                            {creating ? 'Creating…' : 'Create First Room'}
                        </Button>
                    </Card>
                )}

                {/* Rooms Grid */}
                {!loading && rooms.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rooms.map((room) => (
                            <Card
                                glass
                                key={room.roomId}
                                className="group hover:border-primary/50 transition-colors cursor-pointer"
                                onClick={() => handleJoinRoom(room.roomId)}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-white font-mono text-sm">
                                            {room.roomId}
                                        </CardTitle>
                                        {room.isActive && (
                                            <Badge variant="success" className="text-xs">LIVE</Badge>
                                        )}
                                    </div>
                                    <CardDescription className="text-white/70">
                                        Created by {room.createdBy || 'Unknown'}
                                    </CardDescription>
                                </CardHeader>

                                <div className="p-4 pt-0 flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-white/60 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" aria-hidden="true" />
                                            <span>{room.participantCount || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" aria-hidden="true" />
                                            <span>{formatTimeAgo(room.createdAt)}</span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="group-hover:text-primary transition-colors"
                                    >
                                        Join
                                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* User Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 text-center text-white/60 text-sm"
                >
                    Logged in as <span className="text-white font-medium">{user?.userName}</span>
                    <span className="mx-2">·</span>
                    <Link to="/" className="text-primary hover:underline">Back to Home</Link>
                </motion.div>
            </div>
        </div>
    );
}
