"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { voiceAPI } from "@/lib/axios";
import type { VoiceProcessResponse } from "@/types";

export function useVoiceAssistant() {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const [transcript, setTranscript] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [voiceEmotion, setVoiceEmotion] = useState<string>("Neutral");
  const [activePersona, setActivePersona] = useState<string>("friendly");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("auto");
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en-US");
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // ── Interruption Control ──────────────────────────────────────────────────
  const interrupt = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // ── Text to Speech (TTS) with Multilingual Voice Selection ───────────────
  const speak = useCallback(
    (text: string, persona: string = "friendly", targetLang: string = "en-US") => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      // Stop any active speech before starting new utterance (Interrupt)
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Select best matching native voice for requested language
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const langCode = targetLang === "auto" ? "en" : targetLang.split("-")[0];
        const match = voices.find((v) => v.lang.toLowerCase().startsWith(langCode.toLowerCase()));
        if (match) {
          utterance.voice = match;
          utterance.lang = match.lang;
        } else {
          utterance.lang = targetLang === "auto" ? (navigator.language || "en-US") : targetLang;
        }
      }

      // Tune voice pitch and rate according to active persona
      switch (persona.toLowerCase()) {
        case "professional":
          utterance.pitch = 0.9;
          utterance.rate = 0.95;
          break;
        case "motivational":
          utterance.pitch = 1.1;
          utterance.rate = 1.1;
          break;
        case "coach":
          utterance.pitch = 1.05;
          utterance.rate = 1.05;
          break;
        case "mentor":
          utterance.pitch = 0.95;
          utterance.rate = 0.9;
          break;
        case "counselor":
          utterance.pitch = 1.0;
          utterance.rate = 0.95;
          break;
        default: // friendly
          utterance.pitch = 1.0;
          utterance.rate = 1.0;
          break;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  // ── Web Audio Analyser for Orb Pulsating Effect ───────────────────────────
  const startAudioAnalyzer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch {
      // Safe fallback
    }
  };

  const stopAudioAnalyzer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  // ── Send Recorded Audio to Backend ───────────────────────────────────────
  const sendAudioToBackend = async (audioBlob: Blob, liveText: string) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      if (audioBlob.size > 0) {
        formData.append("file", audioBlob, "voice_recording.webm");
      }
      if (liveText) {
        formData.append("text_transcription", liveText);
      }
      formData.append("persona", activePersona);
      formData.append("language", selectedLanguage);

      const res = await voiceAPI.processVoice(formData);
      const data: VoiceProcessResponse = res.data;

      setTranscript(data.transcription);
      setResponse(data.response_text);
      setVoiceEmotion(data.fused_emotion);
      setDetectedLanguage(data.detected_language || selectedLanguage);

      // Speak assistant response out loud in target language
      speak(data.response_text, activePersona, data.detected_language || selectedLanguage);
    } catch {
      const errorReply = "I'm having trouble connecting to my voice servers right now.";
      setResponse(errorReply);
      speak(errorReply, activePersona, selectedLanguage);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Start Listening ───────────────────────────────────────────────────────
  const startListening = async () => {
    interrupt(); // Interrupt any active bot speech immediately
    setTranscript("");
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startAudioAnalyzer(stream);

      // 1. MediaRecorder setup for acoustic emotion detection blob
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        stopAudioAnalyzer();
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());

        sendAudioToBackend(audioBlob, transcriptRef.current);
      };

      mediaRecorder.start();
      setIsListening(true);

      // 2. Web Speech API for real-time live STT text feedback
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLanguage === "auto" ? (navigator.language || "en-US") : selectedLanguage;

        recognition.onresult = (event: any) => {
          let currentResult = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentResult += event.results[i][0].transcript;
          }
          setTranscript(currentResult);
          transcriptRef.current = currentResult;
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch {
      setIsListening(false);
    }
  };

  const transcriptRef = useRef<string>("");

  // ── Stop Listening ────────────────────────────────────────────────────────
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      interrupt();
      stopAudioAnalyzer();
    };
  }, [interrupt]);

  return {
    isListening,
    isProcessing,
    isSpeaking,
    transcript,
    response,
    voiceEmotion,
    activePersona,
    setActivePersona,
    selectedLanguage,
    setSelectedLanguage,
    detectedLanguage,
    audioLevel,
    startListening,
    stopListening,
    interrupt,
    speak,
  };
}
