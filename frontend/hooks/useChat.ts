import { useState } from "react";
import { chatAPI } from "@/lib/axios";
import type { Message, CrisisResource } from "@/types";
import { v4 as uuidv4 } from "uuid";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
  const [isCrisis, setIsCrisis] = useState(false);
  const [crisisResources, setCrisisResources] = useState<CrisisResource[]>([]);

  const loadHistory = async (session: string) => {
    setIsLoading(true);
    try {
      const res = await chatAPI.getSession(session);
      setMessages(res.data);
      setSessionId(session);
      if (res.data.length > 0) {
        const lastUserMsg = [...res.data]
          .reverse()
          .find((m) => m.role === "user");
        if (lastUserMsg?.emotion) {
          setCurrentEmotion(lastUserMsg.emotion);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    setIsLoading(true);
    const userMsgId = uuidv4();
    const tempUserMsg: Message = {
      id: userMsgId,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await chatAPI.sendMessage(text, sessionId || undefined);
      
      const updatedUserMsg: Message = {
        ...tempUserMsg,
        emotion: res.data.emotion_result.emotion,
        sentiment: res.data.emotion_result.sentiment,
        stress_score: res.data.emotion_result.stress_score,
        confidence: res.data.emotion_result.confidence,
        is_crisis: res.data.is_crisis,
      };

      const botMsg: Message = {
        id: res.data.message_id,
        role: "assistant",
        content: res.data.response,
        created_at: res.data.timestamp,
      };

      setMessages((prev) =>
        prev.map((m) => (m.id === userMsgId ? updatedUserMsg : m)).concat(botMsg)
      );

      setSessionId(res.data.session_id);
      setCurrentEmotion(res.data.emotion_result.emotion);
      setIsCrisis(res.data.is_crisis);
      
      if (res.data.is_crisis && res.data.crisis_resources) {
        setCrisisResources(res.data.crisis_resources);
      }
    } catch (err) {
      // Rollback or error message could go here
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    setMessages([]);
    setSessionId(null);
    setCurrentEmotion(null);
    setIsCrisis(false);
    setCrisisResources([]);
  };

  return {
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
  };
}
