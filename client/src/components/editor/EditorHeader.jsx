import { Code2, Copy, Check, Share2, LogOut, Info } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { AIStatusIndicator } from "../ui/AIStatusIndicator";
import { RoomInfoModal } from "../ui/RoomInfoModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useAIStatus } from "../../hooks/useAIStatus";

export function EditorHeader({ roomId, connected, participants, userName, roomData, isCreator }) {
  const [copied, setCopied] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const aiStatus = useAIStatus();

  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleRoomDeleted = () => {
    navigate('/');
  };

  return (
    <>
      <header className="h-16 bg-background border-b border-white/5 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            onClick={() => navigate('/')}
            aria-label="Go to home page"
          >
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(255,87,34,0.3)]">
              <Code2 className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-white tracking-tight">CodeCollab</span>
          </button>

          {/* Room Info */}
          <div className="hidden md:flex items-center gap-3 pl-6 border-l border-white/5">
            <Badge
              variant="outline"
              className="font-mono text-xs tracking-wider cursor-pointer hover:bg-white/10"
              onClick={() => setShowRoomInfo(true)}
            >
              {roomId}
            </Badge>
            <Badge variant={connected ? "success" : "error"}>
              {connected ? "LIVE" : "OFFLINE"}
            </Badge>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <AIStatusIndicator
              available={aiStatus.available}
              providers={aiStatus.providers}
              loading={aiStatus.loading}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Participants */}
          <div
            className="flex -space-x-2 mr-4 cursor-pointer"
            onClick={() => setShowRoomInfo(true)}
          >
            {participants.slice(0, 4).map((p, i) => (
              <div key={i} className="relative ring-2 ring-background rounded-full">
                <Avatar name={p.userName} size="sm" status="online" />
              </div>
            ))}
            {participants.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center text-xs text-white ring-2 ring-background">
                +{participants.length - 4}
              </div>
            )}
          </div>

          {/* Actions */}
          <Button variant="ghost" size="sm" onClick={() => setShowRoomInfo(true)} aria-label="Room information">
            <Info className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="sm" onClick={copyRoomLink}>
            {copied ? <Check className="w-4 h-4 mr-2" aria-hidden="true" /> : <Share2 className="w-4 h-4 mr-2" aria-hidden="true" />}
            Share
          </Button>
          <Avatar name={userName} size="md" className="ring-2 ring-primary/20" />
          <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Logout">
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </header>

      {/* Room Info Modal */}
      <RoomInfoModal
        isOpen={showRoomInfo}
        onClose={() => setShowRoomInfo(false)}
        roomId={roomId}
        roomData={roomData}
        participants={participants}
        isCreator={isCreator}
        onRoomDeleted={handleRoomDeleted}
      />
    </>
  );
}
