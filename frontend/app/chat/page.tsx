"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { chatAPI } from "@/lib/axios";
import type { SessionSummary } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import ChatBubble from "@/components/chat/ChatBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ChatInput from "@/components/chat/ChatInput";
import CrisisModal from "@/components/chat/CrisisModal";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { getEmotionEmoji } from "@/lib/utils";

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const {
    messages,
    isLoading,
    sessionId,
    currentEmotion,
    isCrisis,
    crisisResources,
    sendMessage,
    loadHistory,
    clearSession,
    setIsCrisis,
  } = useChat();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchSessions = async () => {
    try {
      const res = await chatAPI.getSessions();
      setSessions(res.data);
    } catch {
      // Handle error
    }
  };

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleDeleteSession = async (sessId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatAPI.deleteSession(sessId);
      if (sessionId === sessId) {
        clearSession();
      }
      fetchSessions();
    } catch {
      // Handle error
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Starting conversational engine...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar title="Empathetic Support Chat" />
        
        {/* Emotion Context Bar */}
        {currentEmotion && (
          <div className="bg-slate-900 border-b border-white/5 py-2 px-8 flex items-center gap-2 text-xs font-semibold text-violet-300">
            <span>Current session emotional landscape:</span>
            <span className="text-sm">{getEmotionEmoji(currentEmotion)}</span>
            <span className="capitalize">{currentEmotion}</span>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Sessions Sidebar Panel */}
          <div className="w-80 bg-slate-900/50 border-r border-white/5 hidden md:flex flex-col justify-between overflow-y-auto">
            <div className="p-4 space-y-4">
              <button 
                onClick={clearSession}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Session</span>
              </button>
              
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-2">History</span>
                {sessions.length === 0 ? (
                  <p className="text-xs text-slate-500 p-2">No past check-ins.</p>
                ) : (
                  sessions.map((sess) => (
                    <div 
                      key={sess.session_id}
                      onClick={() => loadHistory(sess.session_id)}
                      className={`flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all ${
                        sessionId === sess.session_id ? "bg-white/10 border border-white/10" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-violet-400" />
                          <span className="truncate">{sess.last_message || "Empathetic Support"}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {new Date(sess.last_active).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteSession(sess.session_id, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 md:opacity-100 transition-all"
                        aria-label="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Core Chat Stream Panel */}
          <div className="flex-1 flex flex-col justify-between bg-slate-950 relative overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <MessageSquare className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white">How are you feeling today?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This is a secure space. Express your worries, anxiety, stress, or joys. MindCare AI will guide you through grounding activities and support.
                  </p>
                </div>
              ) : (
                messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)
              )}

              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            <ChatInput onSend={sendMessage} disabled={isLoading} />
          </div>
        </div>
      </div>

      <CrisisModal 
        isOpen={isCrisis} 
        resources={crisisResources} 
        onClose={() => setIsCrisis(false)} 
      />
    </div>
  );
}
