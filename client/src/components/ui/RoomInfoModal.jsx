/**
 * Room Info Modal Component
 * 
 * Displays room details and management options in the editor.
 * Shows participants, room settings, and delete option.
 */

import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { ConfirmationModal } from './ConfirmationModal';
import { roomAPI } from '../../services/api';
import {
    Users,
    Clock,
    Code2,
    Trash2,
    Copy,
    Check,
    Share2,
    Link as LinkIcon
} from 'lucide-react';

export function RoomInfoModal({
    isOpen,
    onClose,
    roomId,
    roomData,
    participants = [],
    isCreator = false,
    onRoomDeleted,
}) {
    const [copied, setCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const copyRoomLink = () => {
        const link = `${window.location.origin}/room/${roomId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const response = await roomAPI.deleteRoom(roomId);
            if (response.success) {
                setShowDeleteConfirm(false);
                onClose();
                if (onRoomDeleted) {
                    onRoomDeleted();
                }
            } else {
                alert(response.error || 'Failed to delete room');
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(new Date(dateString));
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Room Information">
                <div className="space-y-6">
                    {/* Room ID Section */}
                    <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Room ID</span>
                            <Button variant="ghost" size="sm" onClick={copyRoomId} aria-label="Copy room ID">
                                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                            </Button>
                        </div>
                        <code className="text-lg font-mono text-white">{roomId}</code>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-white/5 rounded-lg">
                            <Users className="w-5 h-5 mx-auto mb-1 text-blue-400" aria-hidden="true" />
                            <span className="text-xl font-bold text-white">{participants.length}</span>
                            <p className="text-xs text-gray-400">Participants</p>
                        </div>
                        <div className="text-center p-3 bg-white/5 rounded-lg">
                            <Code2 className="w-5 h-5 mx-auto mb-1 text-green-400" aria-hidden="true" />
                            <span className="text-xl font-bold text-white">{roomData?.language || 'JS'}</span>
                            <p className="text-xs text-gray-400">Language</p>
                        </div>
                        <div className="text-center p-3 bg-white/5 rounded-lg">
                            <Clock className="w-5 h-5 mx-auto mb-1 text-purple-400" aria-hidden="true" />
                            <Badge variant={roomData?.isActive ? 'success' : 'outline'}>
                                {roomData?.isActive ? 'LIVE' : 'Idle'}
                            </Badge>
                            <p className="text-xs text-gray-400 mt-1">Status</p>
                        </div>
                    </div>

                    {/* Participants List */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-3">Participants</h3>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {participants.length > 0 ? (
                                participants.map((p, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                                        <Avatar name={p.userName} size="sm" status="online" />
                                        <span className="text-white text-sm">{p.userName}</span>
                                        {i === 0 && (
                                            <Badge variant="outline" className="ml-auto text-xs">Host</Badge>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">No participants yet</p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-white/10">
                        <Button variant="secondary" className="flex-1" onClick={copyRoomLink}>
                            <Share2 className="w-4 h-4 mr-2" aria-hidden="true" />
                            Share Link
                        </Button>

                        {isCreator && (
                            <Button
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => setShowDeleteConfirm(true)}
                                aria-label="Delete room"
                            >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </Button>
                        )}
                    </div>

                    {/* Room Created Info */}
                    {roomData?.createdAt && (
                        <p className="text-center text-xs text-gray-500">
                            Created {formatDate(roomData.createdAt)}
                        </p>
                    )}
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Room"
                message={`Are you sure you want to delete room "${roomId}"? This action cannot be undone and all participants will be disconnected.`}
                confirmText="Delete Room"
                variant="danger"
                loading={deleting}
            />
        </>
    );
}

export default RoomInfoModal;
