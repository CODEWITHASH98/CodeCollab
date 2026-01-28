const SESSIONS_KEY = "codecollab_sessions";
const MAX_SESSIONS = 10;

export const saveSession = (roomId, userName) => {
  const sessions = getSessions();
  const newSession = {
    roomId,
    userName,
    timestamp: Date.now(),
    lastVisited: new Date().toLocaleString(),
  };

  const filtered = sessions.filter((s) => s.roomId !== roomId);
  const updated = [newSession, ...filtered].slice(0, MAX_SESSIONS);

  localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
};

export const getSessions = () => {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const clearSessions = () => {
  localStorage.removeItem(SESSIONS_KEY);
};
