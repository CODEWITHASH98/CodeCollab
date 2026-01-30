import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL, SOCKET_EVENTS } from "../utils/constants";

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_BASE = 1000; // 1 second base

export function useSocket(roomId) {
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [code, setCode] = useState("// Welcome to CodeCollab!\n// Start typing to collaborate...\n");
  const [output, setOutput] = useState("");
  const [hint, setHint] = useState("");
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [error, setError] = useState(null);

  const connect = useCallback(() => {
    if (!roomId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("❌ No token found. Please login/guest login first.");
      setError("Authentication required");
      return;
    }

    // Prevent duplicate sockets
    if (socketRef.current?.connected) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnecting(true);
    setError(null);

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: false, // We handle reconnection manually
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
      setConnected(true);
      setConnecting(false);
      setError(null);
      reconnectAttempts.current = 0;

      // Join room and request latest code state
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId });

      // Force request latest code after a short delay to ensure join is processed
      setTimeout(() => {
        if (socket.connected) {
          console.log("🔄 Requesting latest code sync...");
          socket.emit(SOCKET_EVENTS.CODE_UPDATE, { roomId, code: null, sync: true });
        }
      }, 500);
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Socket connect_error:", err.message);
      setConnected(false);
      setConnecting(false);

      if (err.message.includes("Token expired") || err.message.includes("Invalid token")) {
        setError("Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return;
      }

      // Exponential backoff reconnection
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttempts.current);
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
        reconnectAttempts.current++;
        setTimeout(connect, delay);
      } else {
        setError("Connection failed. Please refresh the page.");
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected:", reason);
      setConnected(false);

      // Auto-reconnect on unexpected disconnect
      if (reason === "io server disconnect" || reason === "transport close") {
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttempts.current);
          reconnectAttempts.current++;
          setTimeout(connect, delay);
        }
      }
    });

    socket.on(SOCKET_EVENTS.ERROR, (data) => {
      console.log("❌ Server socket error:", data?.message || data);
      if (data?.message === "Token expired" || data?.message === "Invalid token") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
      }
    });

    socket.on(SOCKET_EVENTS.LOAD_CODE, (data) => {
      setCode(data.code || "");
    });

    socket.on(SOCKET_EVENTS.CODE_UPDATE, (data) => {
      setCode(data.code);
    });

    socket.on(SOCKET_EVENTS.USER_JOINED, (data) => {
      console.log("👤 User joined:", data);
      setParticipants(data.participants || []);
    });

    socket.on(SOCKET_EVENTS.USER_LEFT, (data) => {
      console.log("👤 User left:", data);
      setParticipants(data.participants || []);
    });

    socket.on(SOCKET_EVENTS.EXECUTION_RESULT, (data) => {
      const result = data.stdout || data.stderr || "No output";
      setOutput(`[${data.executedBy}] ${result}`);
    });

    socket.on(SOCKET_EVENTS.EXECUTION_ERROR, (data) => {
      setOutput(`Error: ${data.error}`);
    });

    socket.on(SOCKET_EVENTS.HINT_RESPONSE, (data) => {
      setHint(data.hint);
    });

    // Typing indicator listeners
    socket.on("user-typing", ({ userName }) => {
      setTypingUsers((prev) => new Set([...prev, userName]));
    });

    socket.on("user-stopped-typing", ({ userName }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userName);
        return newSet;
      });
    });

    // Cursor position updates
    socket.on("cursor_update", (data) => {
      // Could be used to show other users' cursors
      console.log("Cursor update:", data);
    });

  }, [roomId]);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

  const updateCode = useCallback((newCode) => {
    setCode(newCode);
    if (socketRef.current?.connected) {
      socketRef.current.emit(SOCKET_EVENTS.CODE_UPDATE, { roomId, code: newCode });
    }
  }, [roomId]);

  const executeCode = useCallback((language) => {
    setOutput("⏳ Executing...");
    if (socketRef.current?.connected) {
      socketRef.current.emit(SOCKET_EVENTS.EXECUTE_CODE, { roomId, code, language });
    }
  }, [roomId, code]);

  const requestHint = useCallback((problemId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(SOCKET_EVENTS.REQUEST_HINT, { roomId, problemId });
    }
  }, [roomId]);

  const emitTyping = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("user-typing", { roomId });
    }
  }, [roomId]);

  const emitStopTyping = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("user-stopped-typing", { roomId });
    }
  }, [roomId]);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    connect();
  }, [connect]);

  return {
    connected,
    connecting,
    participants,
    code,
    output,
    hint,
    error,
    typingUsers: Array.from(typingUsers),
    updateCode,
    executeCode,
    requestHint,
    setHint,
    emitTyping,
    emitStopTyping,
    reconnect,
  };
}
