import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../contexts/AuthContext";
import { executionAPI } from "../services/api";

import Editor, { loader } from "@monaco-editor/react";
import { EditorHeader } from "../components/editor/EditorHeader";
import { EditorToolbar } from "../components/editor/EditorToolbar";
import { Sidebar, SidebarPanel } from "../components/editor/Sidebar";
import { ChatPanel } from "../components/editor/ChatPanel";
import { OutputPanel } from "../components/editor/OutputPanel";
import { Modal } from "../components/ui/Modal";
import { AnalyticsModal } from "../components/analytics/AnalyticsModal";
import { Toast } from "../components/ui/Toast";

// Custom Cyberpunk Theme Definition
loader.init().then((monaco) => {
  monaco.editor.defineTheme("cyberpunk", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "627254", fontStyle: "italic" },
      { token: "keyword", foreground: "FF5722", fontStyle: "bold" },
      { token: "string", foreground: "10B981" },
      { token: "number", foreground: "F59E0B" },
      { token: "type", foreground: "A855F7" },
    ],
    colors: {
      "editor.background": "#0F0F0F", // Deep dark background
      "editor.foreground": "#E5E5E5",
      "editor.lineHighlightBackground": "#FFFFFF0A",
      "editorCursor.foreground": "#FF5722",
      "editor.selectionBackground": "#FF572233",
      "editorLineNumber.foreground": "#4B5563",
    },
  });
});

export default function CodeEditor() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const { user, isAuthenticated, logout } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // State
  const [language, setLanguage] = useState("javascript");
  const [activeTab, setActiveTab] = useState("files");
  const [rightPanel, setRightPanel] = useState("chat"); // 'chat' | 'output' | null
  const [loading, setLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([
    { type: 'ai', content: "Welcome to CodeCollab! I'm your AI pair programmer. Ask me anything about the code." }
  ]);

  const {
    connected,
    participants,
    code,
    updateCode,
    executeCode,
    output,
    typingUsers,
    emitTyping,
    emitStopTyping
  } = useSocket(roomId);

  const userName = user?.userName || "Guest";

  // Handlers
  const handleExecute = () => {
    setLoading(true);
    setRightPanel("output");
    executeCode(language);
    setTimeout(() => setLoading(false), 1500); // Simulate processing time if needed
  };

  const handleAIRequest = async (type) => {
    setLoading(true);
    setRightPanel("chat");

    const prompts = {
      hint: "🤔 Generating hint...",
      review: "🔍 Reviewing code...",
      explain: "📖 Explaining code..."
    };

    // Add user request message
    setMessages(prev => [...prev, { type: 'user', content: `/${type}` }]);
    // Add placeholder AI message
    setMessages(prev => [...prev, { type: 'ai', content: prompts[type] || "Thinking...", loading: true }]);

    try {
      let response;
      let result;

      if (type === 'hint') {
        const response = await executionAPI.getHint(code, language);
        if (response.success && response.data) {
          result = response.data.hint || "Try breaking down the problem into smaller steps.";
        } else {
          result = response.error || "Could not generate hint.";
        }

      } else if (type === 'review') {
        const response = await executionAPI.reviewCode(code, language);
        // Handle the response structure properly
        if (response.success && response.data) {
          const review = response.data;
          result = formatReviewResult(review);
        } else if (response.error) {
          result = `⚠️ ${response.error}`;
        } else {
          result = "Could not complete review. Please try again.";
        }

      } else if (type === 'explain') {
        const response = await executionAPI.explainCode(code, language);
        if (response.success && response.data) {
          result = response.data.explanation || response.data.message || "Code explanation not available.";
        } else {
          result = "Could not explain code. Please try again.";
        }
      }

      // Update the last AI message with actual result
      setMessages(prev => {
        const updated = [...prev];
        // Find and update the last AI message
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].type === 'ai' && updated[i].loading) {
            updated[i] = { type: 'ai', content: result };
            break;
          }
        }
        return updated;
      });

    } catch (err) {
      console.error('AI request error:', err);
      setMessages(prev => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].type === 'ai' && updated[i].loading) {
            updated[i] = { type: 'ai', content: "❌ Error communicating with AI service. Please try again." };
            break;
          }
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to format review results nicely
  const formatReviewResult = (review) => {
    if (!review) return "No review data available.";

    let result = "";

    if (review.score) {
      result += `**Score: ${review.score}/10**\n\n`;
    }

    if (review.summary) {
      result += `${review.summary}\n\n`;
    }

    if (review.issues && review.issues.length > 0) {
      result += `**Issues Found:**\n`;
      review.issues.forEach(issue => {
        result += `• ${issue}\n`;
      });
      result += "\n";
    }

    if (review.suggestions && review.suggestions.length > 0) {
      result += `**Suggestions:**\n`;
      review.suggestions.forEach(suggestion => {
        result += `• ${suggestion}\n`;
      });
      result += "\n";
    }

    if (review.complexity) {
      result += `**Complexity:** Time: ${review.complexity.time || 'N/A'}, Space: ${review.complexity.space || 'N/A'}`;
    }

    return result || "Review complete - no issues found!";
  };


  const handleSendMessage = (text) => {
    setMessages(prev => [...prev, { type: 'user', content: text }]);
    // Mock AI response for now (or hook up to real chat endpoint)
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'ai', content: "I received your message. Real-time chat is being integrated." }]);
    }, 1000);
  };

  return (
    <div className="h-screen flex flex-col bg-background text-white overflow-hidden font-sans selection:bg-primary/30">
      <EditorHeader
        roomId={roomId}
        connected={connected}
        participants={participants}
        userName={userName}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          participants={participants}
        />

        {/* EXPANDABLE SIDE PANEL (Files/Users) */}
        {activeTab && (
          <div className="w-60 border-r border-white/5 animate-fade-in">
            <SidebarPanel activeTab={activeTab} participants={participants} />
          </div>
        )}

        {/* MAIN EDITOR AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          <EditorToolbar
            language={language}
            setLanguage={setLanguage}
            onExecute={handleExecute}
            onHint={() => handleAIRequest('hint')}
            onReview={() => handleAIRequest('review')}
            loading={loading}
            code={code}
            roomId={roomId}
            onExportSuccess={(msg) => showToast(msg, 'success')}
          />

          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => {
                updateCode(value);
                emitTyping();
                setTimeout(emitStopTyping, 1000);
              }}
              theme="cyberpunk"
              options={{
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 20 },
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on"
              }}
            />

            {/* Typing Indicator Overlay */}
            {typingUsers.length > 0 && (
              <div className="absolute bottom-4 right-8 bg-primary/20 text-primary px-3 py-1 rounded text-xs animate-pulse">
                {typingUsers.join(", ")} is typing…
              </div>
            )}
          </div>

          {/* BOTTOM OUTPUT (If configured as bottom panel, currently sidebar) */}
        </div>

        {/* RIGHT PANEL (Chat / Output) */}
        {rightPanel && (
          <div className="w-96 border-l border-white/5 flex flex-col bg-surface shadow-2xl z-10 transition-[width,opacity] duration-300">
            {/* Panel Tabs */}
            <div className="flex border-b border-white/5" role="tablist" aria-label="Panel tabs">
              <button
                role="tab"
                aria-selected={rightPanel === "chat"}
                aria-controls="panel-chat"
                id="tab-chat"
                onClick={() => setRightPanel("chat")}
                className={`flex-1 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${rightPanel === "chat" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-white"}`}
              >
                AI Chat
              </button>
              <button
                role="tab"
                aria-selected={rightPanel === "output"}
                aria-controls="panel-output"
                id="tab-output"
                onClick={() => setRightPanel("output")}
                className={`flex-1 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${rightPanel === "output" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-white"}`}
              >
                Terminal {output && <span className="ml-2 w-2 h-2 rounded-full bg-primary inline-block" aria-hidden="true" />}
              </button>
            </div>

            <div id="panel-chat" role="tabpanel" aria-labelledby="tab-chat" className="flex-1 overflow-hidden relative" hidden={rightPanel !== "chat"}>
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                onAIRequest={handleAIRequest}
              />
            </div>
            <div id="panel-output" role="tabpanel" aria-labelledby="tab-output" className="flex-1 overflow-hidden relative" hidden={rightPanel !== "output"}>
              <OutputPanel output={output} onClose={() => setRightPanel("chat")} />
            </div>
          </div>
        )}
      </div>

      {/* Modals & Toasts */}
      <AnalyticsModal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} roomId={roomId} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
