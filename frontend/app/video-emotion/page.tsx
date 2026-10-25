"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { videoEmotionAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Video, UploadCloud, Film, Play, Pause, RefreshCw, Sparkles,
  ShieldCheck, CheckCircle2, AlertTriangle, Trash2, Eye, Lock,
  TrendingUp, Layers, Clock, MessageSquare, ChevronRight,
  Camera, Mic, MicOff, StopCircle, FlipHorizontal, Activity,
  Volume2, Radio, Check, HelpCircle, PlayCircle
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface AnalysisDetails {
  analysis_id: string;
  filename: string;
  status: string;
  duration_seconds: number;
  fps: number;
  resolution: string;
  faces_tracked_count: number;
  dominant_emotion: string;
  overall_confidence: number;
  transitions_count: number;
  has_audio: boolean;
  non_diagnostic_statement: string;
}

interface TimelineSegment {
  id: string;
  face_id: string;
  start_time: number;
  end_time: number;
  facial_emotion: string;
  facial_confidence: number;
  speech_emotion: string | null;
  speech_confidence: number | null;
  combined_emotion: string;
  combined_confidence: number;
  agreement: boolean | null;
  probabilities: Record<string, number>;
}

interface TranscriptSegment {
  id: string;
  sentence_index?: number;
  start_time: number;
  end_time: number;
  text: string;
  emotion: string;
  confidence: number;
  sentiment: string;
}

interface CameraDeviceInfo {
  deviceId: string;
  label: string;
}

const EMOTION_TAXONOMY = ["Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral"];

const getEmotionBadgeColor = (emotion: string) => {
  const e = (emotion || "").toLowerCase();
  if (e.includes("joy") || e.includes("happy") || e.includes("hopeful") || e.includes("excited") || e.includes("love")) {
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  }
  if (e.includes("sad") || e.includes("lonely") || e.includes("grief")) {
    return "bg-sky-500/20 text-sky-300 border-sky-500/30";
  }
  if (e.includes("stress") || e.includes("anxi") || e.includes("fear")) {
    return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  }
  if (e.includes("ang") || e.includes("disgust")) {
    return "bg-rose-500/20 text-rose-300 border-rose-500/30";
  }
  if (e.includes("surprise")) {
    return "bg-purple-500/20 text-purple-300 border-purple-500/30";
  }
  return "bg-slate-700/40 text-slate-300 border-slate-600/30";
};

const getEmotionEmoji = (emotion: string) => {
  const e = (emotion || "").toLowerCase();
  if (e.includes("joy") || e.includes("happy") || e.includes("excited")) return "😊";
  if (e.includes("hopeful") || e.includes("love")) return "✨";
  if (e.includes("sad") || e.includes("lonely")) return "😔";
  if (e.includes("stress") || e.includes("anxi")) return "😰";
  if (e.includes("fear")) return "😨";
  if (e.includes("ang")) return "😠";
  if (e.includes("disgust")) return "🤢";
  if (e.includes("surprise")) return "😲";
  return "😐";
};

export default function VideoEmotionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Mode: Live Webcam vs Upload Pre-recorded
  const [pageMode, setPageMode] = useState<"live" | "upload">("live");

  // ── Upload Mode State ─────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [analysisStage, setAnalysisStage] = useState<string>("Initializing analysis...");

  // ── Results / Reports State (Shared between Live Save & Upload) ────────────
  const [details, setDetails] = useState<AnalysisDetails | null>(null);
  const [timeline, setTimeline] = useState<TimelineSegment[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [activeTab, setActiveTab] = useState<"transcript" | "timeline">("transcript");

  // ── Live Video Emotion State ──────────────────────────────────────────────
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isVirtualStream, setIsVirtualStream] = useState<boolean>(false);
  const [isSystemCameraStream, setIsSystemCameraStream] = useState<boolean>(false);
  const [systemCameraFrame, setSystemCameraFrame] = useState<string | null>(null);
  const [virtualStreamName, setVirtualStreamName] = useState<string>("");
  const [mirrorPreview, setMirrorPreview] = useState<boolean>(true);
  const [enableAudioSpeech, setEnableAudioSpeech] = useState<boolean>(true);
  const [streamDuration, setStreamDuration] = useState<number>(0);
  const [framesProcessedCount, setFramesProcessedCount] = useState<number>(0);
  const [faceDetectedInFrame, setFaceDetectedInFrame] = useState<boolean>(false);

  // Permission & Device Troubleshooting State
  const [cameraError, setCameraError] = useState<{
    type: "permission_denied" | "not_found" | "in_use" | "unsupported" | "generic";
    message: string;
    detail?: string;
  } | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  // Live telemetry readings
  const [currentLiveEmotion, setCurrentLiveEmotion] = useState<string>("Neutral");
  const [currentLiveConfidence, setCurrentLiveConfidence] = useState<number>(0);
  const [currentProbabilities, setCurrentProbabilities] = useState<Record<string, number>>({
    Happy: 5, Sad: 5, Angry: 5, Fear: 5, Surprise: 5, Disgust: 5, Neutral: 70
  });

  // Live speech & timeline accumulation
  const [currentSpeechSnippet, setCurrentSpeechSnippet] = useState<string>("");
  const [currentSpeechEmotion, setCurrentSpeechEmotion] = useState<string | null>(null);
  const [currentSpeechConfidence, setCurrentSpeechConfidence] = useState<number | null>(null);
  const [currentSpeechSentiment, setCurrentSpeechSentiment] = useState<string | null>(null);
  const [liveTimeline, setLiveTimeline] = useState<TimelineSegment[]>([]);
  const [liveTranscripts, setLiveTranscripts] = useState<TranscriptSegment[]>([]);
  const [savingSession, setSavingSession] = useState<boolean>(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const virtualFileInputRef = useRef<HTMLInputElement>(null);
  const uploadVideoRef = useRef<HTMLVideoElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const simulationAnimationRef = useRef<number | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const streamDurationRef = useRef<number>(0);
  const lastRecordedSegmentTimeRef = useRef<number>(0);
  const latestSpeechTextRef = useRef<string>("");
  const speechRecognitionRef = useRef<any>(null);
  const isSystemCameraStreamRef = useRef<boolean>(false);

  // Detect available camera devices
  useEffect(() => {
    const listDevices = async () => {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices
            .filter((d) => d.kind === "videoinput")
            .map((d, idx) => ({
              deviceId: d.deviceId,
              label: d.label || `Camera ${idx + 1}`,
            }));
          setAvailableCameras(videoDevices);
          if (videoDevices.length > 0 && !selectedCameraId) {
            setSelectedCameraId(videoDevices[0].deviceId);
          }
        } catch (e) {
          console.warn("Could not enumerate camera devices:", e);
        }
      }
    };
    listDevices();
  }, [selectedCameraId]);

  // Keep duration ref synced
  useEffect(() => {
    streamDurationRef.current = streamDuration;
  }, [streamDuration]);

  // Clean up media streams and intervals on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, []);

  // ── Overlay Bounding Box Drawing ──────────────────────────────────────────
  const drawBoundingBox = (
    box: { norm_x: number; norm_y: number; norm_w: number; norm_h: number } | null,
    emotion: string,
    confidence: number
  ) => {
    const canvas = overlayCanvasRef.current;
    const video = liveVideoRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (video && video.clientWidth > 0) ? video.clientWidth : (canvas.parentElement?.clientWidth || 640);
    const height = (video && video.clientHeight > 0) ? video.clientHeight : (canvas.parentElement?.clientHeight || 480);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    if (!box) return;

    // Calculate box pixel coordinates taking mirror mode into account
    const rawX = mirrorPreview ? (1 - box.norm_x - box.norm_w) * width : box.norm_x * width;
    const rawY = box.norm_y * height;
    const rawW = box.norm_w * width;
    const rawH = box.norm_h * height;

    const x = Math.max(0, Math.min(width - 10, rawX));
    const y = Math.max(0, Math.min(height - 10, rawY));
    const w = Math.min(width - x, rawW);
    const h = Math.min(height - y, rawH);

    const color = "#8b5cf6"; // Violet glow
    const cornerLength = Math.min(w * 0.25, 24);

    // Subtle translucent fill
    ctx.fillStyle = "rgba(139, 92, 246, 0.08)";
    ctx.fillRect(x, y, w, h);

    // Outer border with corner brackets
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#a855f7";
    ctx.shadowBlur = 8;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(x, y + cornerLength);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerLength, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(x + w - cornerLength, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + cornerLength);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(x, y + h - cornerLength);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + cornerLength, y + h);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(x + w - cornerLength, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - cornerLength);
    ctx.stroke();

    ctx.restore();

    // Emotion Pill Badge
    const emoji = getEmotionEmoji(emotion);
    const labelText = `${emoji} ${emotion.toUpperCase()} ${confidence ? `${Math.round(confidence)}%` : ""}`;
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    const textWidth = ctx.measureText(labelText).width;
    const badgeWidth = textWidth + 24;
    const badgeHeight = 26;
    const badgeX = Math.max(8, Math.min(width - badgeWidth - 8, x + (w - badgeWidth) / 2));
    const badgeY = y > badgeHeight + 10 ? y - badgeHeight - 6 : y + h + 6;

    // Badge background rounded rectangle
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 6);
    ctx.fill();
    ctx.stroke();

    // Badge text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(labelText, badgeX + 12, badgeY + 17);
    ctx.restore();
  };

  // ── Speech Recognition Integration ────────────────────────────────────────
  const startSpeechRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.info("Speech recognition not supported in this browser. Facial emotion tracking will run uninterrupted.");
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final.trim()) {
          const text = final.trim();
          setCurrentSpeechSnippet(text);
          latestSpeechTextRef.current = text;
        } else if (interim.trim()) {
          setCurrentSpeechSnippet(interim.trim());
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition warning:", e);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
    }
  };

  const stopSpeechRecognition = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
  };

  // ── Start / Stop Live Streaming ───────────────────────────────────────────
  const startStreaming = async () => {
    setCameraError(null);
    setIsVirtualStream(false);
    setVirtualStreamName("");

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError({
        type: "unsupported",
        message: "Camera access requires a secure browser context (HTTPS or http://localhost).",
        detail: "Please access this application via http://localhost:3000.",
      });
      toast.error("Camera access is not supported in this browser environment.");
      return;
    }

    try {
      setLiveTimeline([]);
      setLiveTranscripts([]);
      setStreamDuration(0);
      setFramesProcessedCount(0);
      lastRecordedSegmentTimeRef.current = 0;
      setCurrentSpeechSnippet("");
      latestSpeechTextRef.current = "";

      let mediaStream: MediaStream | null = null;
      let lastError: any = null;

      // 1. Direct standard video request (no facingMode: "user" which breaks PC webcams like HP TrueVision)
      try {
        const videoConstraint = selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : true;

        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraint,
        });
      } catch (err: any) {
        lastError = err;
        console.warn("First camera attempt failed, trying fallback:", err);
      }

      // 2. Fallback to basic { video: true } with no deviceId
      if (!mediaStream) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
        } catch (err: any) {
          lastError = err;
          console.warn("Basic video attempt failed:", err);
        }
      }

      if (!mediaStream) {
        throw lastError || new Error("Failed to initialize camera stream.");
      }

      // 3. Audio request (handled separately so audio issues NEVER block camera!)
      if (enableAudioSpeech) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStream.getAudioTracks().forEach((track) => mediaStream!.addTrack(track));
          startSpeechRecognition();
        } catch (audioErr) {
          console.info("Microphone unavailable or blocked; proceeding camera-only:", audioErr);
        }
      }

      streamRef.current = mediaStream;
      if (liveVideoRef.current) {
        liveVideoRef.current.src = "";
        liveVideoRef.current.srcObject = mediaStream;
        await liveVideoRef.current.play();
      }

      setIsStreaming(true);
      setCameraError(null);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setStreamDuration((prev) => prev + 1);
      }, 1000);

      // Start continuous frame processing loop (~600ms interval)
      frameIntervalRef.current = setInterval(() => {
        processLiveFrame();
      }, 600);

      toast.success("Live video emotion stream active.");
    } catch (err: any) {
      console.warn("Browser WebRTC camera access failed, attempting hardware camera bridge fallback:", err);

      // Auto-fallback: Connect via System Hardware Direct Bridge (DirectShow)
      try {
        const startedHw = await startSystemCameraStream();
        if (startedHw) {
          return;
        }
      } catch (hwErr) {
        console.warn("Hardware camera bridge fallback failed:", hwErr);
      }

      stopStreaming();

      const errName = err?.name || "";
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        setCameraError({
          type: "permission_denied",
          message: "Camera permission was denied in your browser or operating system.",
          detail: "Please click the lock/camera icon in your browser URL bar and set Camera to Allow.",
        });
        toast.error("Camera permission denied. Allow access in your browser address bar.");
      } else if (errName === "NotReadableError" || errName === "TrackStartError") {
        setCameraError({
          type: "in_use",
          message: "Camera is currently being used by another application.",
          detail: "Close other applications that might be using your camera (such as Zoom, Microsoft Teams, OBS Studio, or other browser tabs).",
        });
        toast.error("Camera is busy or in use by another app.");
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        setCameraError({
          type: "not_found",
          message: "Webcam device was locked or not recognized by browser.",
          detail: "You can click 'Connect Hardware Camera' below, stream a video file, or run the live face simulation!",
        });
        toast.error("Webcam not accessible via browser WebRTC. Use the Hardware Camera button below.");
      } else {
        setCameraError({
          type: "generic",
          message: err?.message || "Could not access camera.",
          detail: "Ensure your camera is connected and unblocked in browser permissions.",
        });
        toast.error("Could not access camera.");
      }
    }
  };

  // ── Hardware Camera Direct Bridge (DirectShow / Windows Camera Fix) ──────
  const startSystemCameraStream = async () => {
    stopStreaming();
    setCameraError(null);
    setLiveTimeline([]);
    setLiveTranscripts([]);
    setStreamDuration(0);
    setFramesProcessedCount(0);
    lastRecordedSegmentTimeRef.current = 0;
    setCurrentSpeechSnippet("");
    latestSpeechTextRef.current = "";

    try {
      const res = await videoEmotionAPI.startSystemCamera();
      if (!res.data.success) {
        return false;
      }

      setIsStreaming(true);
      setIsSystemCameraStream(true);
      isSystemCameraStreamRef.current = true;
      setVirtualStreamName("HP TrueVision HD Camera (Hardware Direct Bridge)");

      if (enableAudioSpeech) {
        startSpeechRecognition();
      }

      timerIntervalRef.current = setInterval(() => {
        setStreamDuration((prev) => prev + 1);
      }, 1000);

      frameIntervalRef.current = setInterval(async () => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        try {
          const formData = new FormData();
          const speechText = latestSpeechTextRef.current;
          if (speechText) {
            formData.append("speech_text", speechText);
            latestSpeechTextRef.current = "";
          }

          const fRes = await videoEmotionAPI.grabSystemCameraFrame(formData);
          const data = fRes.data;
          if (data.success && data.frame_data) {
            setSystemCameraFrame(data.frame_data);
            setFramesProcessedCount((prev) => prev + 1);

            if (data.dominant_emotion) {
              setCurrentLiveEmotion(data.dominant_emotion);
              setCurrentLiveConfidence(data.overall_confidence || 75);
            }

            if (data.facial) {
              setFaceDetectedInFrame(true);
              setCurrentProbabilities(data.facial.probabilities || {});
              drawBoundingBox(
                data.facial.bounding_box,
                data.facial.dominant_facial_emotion || data.dominant_emotion,
                data.facial.confidence
              );
            } else {
              setFaceDetectedInFrame(false);
              drawBoundingBox(null, "Neutral", 0);
            }

            if (data.speech) {
              setCurrentSpeechEmotion(data.speech.emotion);
              setCurrentSpeechConfidence(data.speech.confidence);
              setCurrentSpeechSentiment(data.speech.sentiment);

              const newTranscript: TranscriptSegment = {
                id: "tr_" + Date.now(),
                sentence_index: liveTranscripts.length + 1,
                start_time: Math.max(0, streamDurationRef.current - 3),
                end_time: streamDurationRef.current,
                text: data.speech.text,
                emotion: data.speech.emotion,
                confidence: data.speech.confidence / 100,
                sentiment: data.speech.sentiment,
              };
              setLiveTranscripts((prev) => [...prev, newTranscript]);
            }

            if (
              streamDurationRef.current > 0 &&
              streamDurationRef.current - lastRecordedSegmentTimeRef.current >= 2
            ) {
              lastRecordedSegmentTimeRef.current = streamDurationRef.current;
              const facialEmo = data.facial?.dominant_facial_emotion || "Neutral";
              const facialConf = data.facial?.confidence || 50;
              const speechEmo = data.speech?.emotion || null;
              const speechConf = data.speech?.confidence || null;

              const seg: TimelineSegment = {
                id: "seg_" + Date.now(),
                face_id: "face_1",
                start_time: Math.max(0, streamDurationRef.current - 2),
                end_time: streamDurationRef.current,
                facial_emotion: facialEmo,
                facial_confidence: facialConf / 100,
                speech_emotion: speechEmo,
                speech_confidence: speechConf ? speechConf / 100 : null,
                combined_emotion: data.dominant_emotion || facialEmo,
                combined_confidence: (data.overall_confidence || facialConf) / 100,
                agreement: speechEmo ? facialEmo.toLowerCase() === speechEmo.toLowerCase() : null,
                probabilities: data.facial?.probabilities || {},
              };
              setLiveTimeline((prev) => [...prev, seg]);
            }
          }
        } catch (fErr) {
          console.warn("Hardware camera frame fetch error:", fErr);
        } finally {
          isProcessingRef.current = false;
        }
      }, 350);

      toast.success("Live HP TrueVision HD Camera active via Hardware Bridge!");
      return true;
    } catch (err) {
      console.error("Hardware camera start error:", err);
      stopStreaming();
      return false;
    }
  };

  // ── Virtual Video File Stream (Works on any device) ───────────────────────
  const handleSelectVirtualCameraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopStreaming();
    setCameraError(null);
    setLiveTimeline([]);
    setLiveTranscripts([]);
    setStreamDuration(0);
    setFramesProcessedCount(0);
    lastRecordedSegmentTimeRef.current = 0;
    setCurrentSpeechSnippet("");
    latestSpeechTextRef.current = "";

    const url = URL.createObjectURL(file);
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
      liveVideoRef.current.src = url;
      liveVideoRef.current.loop = true;
      liveVideoRef.current.muted = true;
      liveVideoRef.current.play().then(() => {
        setIsStreaming(true);
        setIsVirtualStream(true);
        setVirtualStreamName(file.name);

        timerIntervalRef.current = setInterval(() => {
          setStreamDuration((prev) => prev + 1);
        }, 1000);

        frameIntervalRef.current = setInterval(() => {
          processLiveFrame();
        }, 600);

        toast.success(`Virtual camera active: ${file.name}`);
      }).catch((err) => {
        console.error("Virtual video playback error:", err);
        toast.error("Could not play the selected video file.");
      });
    }
  };

  // ── Simulated Live Face Stream (In-Browser Virtual Camera Demo) ────────────
  const startSimulationStream = () => {
    stopStreaming();
    setCameraError(null);
    setLiveTimeline([]);
    setLiveTranscripts([]);
    setStreamDuration(0);
    setFramesProcessedCount(0);
    lastRecordedSegmentTimeRef.current = 0;
    setCurrentSpeechSnippet("");
    latestSpeechTextRef.current = "";

    const animCanvas = document.createElement("canvas");
    animCanvas.width = 640;
    animCanvas.height = 480;
    const ctx = animCanvas.getContext("2d");
    if (!ctx) return;

    let frameCount = 0;
    const renderAnimFrame = () => {
      frameCount++;
      const time = frameCount * 0.05;

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 640, 480);
      bgGrad.addColorStop(0, "#1e293b");
      bgGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 640, 480);

      // Shoulders
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.ellipse(320, 500, 200, 120, 0, 0, Math.PI * 2);
      ctx.fill();

      // Neck
      ctx.fillStyle = "#e2b89d";
      ctx.fillRect(285, 300, 70, 80);

      // Head
      ctx.fillStyle = "#f5d0b5";
      ctx.beginPath();
      ctx.ellipse(320, 240, 110, 140, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = "#2d1f14";
      ctx.beginPath();
      ctx.ellipse(320, 140, 115, 60, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      // Eyes
      const blink = Math.sin(time * 0.8) > 0.95;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(280, 225, 18, blink ? 2 : 12, 0, 0, Math.PI * 2);
      ctx.ellipse(360, 225, 18, blink ? 2 : 12, 0, 0, Math.PI * 2);
      ctx.fill();

      if (!blink) {
        ctx.fillStyle = "#2563eb";
        ctx.beginPath();
        ctx.arc(280 + Math.sin(time) * 3, 225, 7, 0, Math.PI * 2);
        ctx.arc(360 + Math.sin(time) * 3, 225, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Eyebrows
      ctx.strokeStyle = "#2d1f14";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(260, 205);
      ctx.quadraticCurveTo(280, 195 - Math.sin(time * 0.5) * 5, 300, 205);
      ctx.moveTo(340, 205);
      ctx.quadraticCurveTo(360, 195 - Math.sin(time * 0.5) * 5, 380, 205);
      ctx.stroke();

      // Nose
      ctx.strokeStyle = "#d49b78";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(320, 230);
      ctx.lineTo(315, 265);
      ctx.lineTo(325, 268);
      ctx.stroke();

      // Animated Mouth
      const expressionPhase = Math.sin(time * 0.3);
      ctx.strokeStyle = "#b91c1c";
      ctx.lineWidth = 4;
      ctx.beginPath();
      if (expressionPhase > 0.2) {
        ctx.arc(320, 290, 25, 0.2, Math.PI - 0.2);
      } else if (expressionPhase < -0.4) {
        ctx.fillStyle = "#7f1d1d";
        ctx.ellipse(320, 305, 12, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.moveTo(305, 305);
        ctx.lineTo(335, 305);
      }
      ctx.stroke();

      simulationAnimationRef.current = requestAnimationFrame(renderAnimFrame);
    };

    renderAnimFrame();

    if ((animCanvas as any).captureStream) {
      const stream = (animCanvas as any).captureStream(25);
      streamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.src = "";
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play().then(() => {
          setIsStreaming(true);
          setIsVirtualStream(true);
          setVirtualStreamName("Simulated Face Avatar");

          timerIntervalRef.current = setInterval(() => {
            setStreamDuration((prev) => prev + 1);
          }, 1000);

          frameIntervalRef.current = setInterval(() => {
            processLiveFrame();
          }, 600);

          toast.success("Simulated live webcam stream active.");
        });
      }
    }
  };

  const stopStreaming = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (simulationAnimationRef.current) {
      cancelAnimationFrame(simulationAnimationRef.current);
      simulationAnimationRef.current = null;
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.pause();
      liveVideoRef.current.srcObject = null;
      liveVideoRef.current.src = "";
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (isSystemCameraStream || isSystemCameraStreamRef.current) {
      videoEmotionAPI.stopSystemCamera().catch(() => {});
      setIsSystemCameraStream(false);
      isSystemCameraStreamRef.current = false;
      setSystemCameraFrame(null);
    }
    stopSpeechRecognition();
    setIsStreaming(false);
    setIsVirtualStream(false);
    setVirtualStreamName("");

    // Clear overlay canvas
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
  };

  // ── Frame Processing Loop ─────────────────────────────────────────────────
  const processLiveFrame = async () => {
    if (isProcessingRef.current || !liveVideoRef.current) return;
    const video = liveVideoRef.current;
    if (video.readyState < 2) return;

    isProcessingRef.current = true;
    try {
      const offscreen = document.createElement("canvas");
      const maxDim = 640;
      let w = video.videoWidth || 640;
      let h = video.videoHeight || 480;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, w, h);

      const blob = await new Promise<Blob | null>((resolve) =>
        offscreen.toBlob(resolve, "image/jpeg", 0.72)
      );
      if (!blob) return;

      const formData = new FormData();
      formData.append("frame", blob, "webcam_frame.jpg");

      const speechText = latestSpeechTextRef.current;
      if (speechText) {
        formData.append("speech_text", speechText);
        latestSpeechTextRef.current = ""; // Reset after dispatch
      }

      const res = await videoEmotionAPI.analyzeLiveFrame(formData);
      const data = res.data;

      setFramesProcessedCount((prev) => prev + 1);

      if (data.dominant_emotion) {
        setCurrentLiveEmotion(data.dominant_emotion);
        setCurrentLiveConfidence(data.overall_confidence || 75);
      }

      if (data.facial) {
        setFaceDetectedInFrame(true);
        setCurrentProbabilities(data.facial.probabilities || {});
        drawBoundingBox(
          data.facial.bounding_box,
          data.facial.dominant_facial_emotion || data.dominant_emotion,
          data.facial.confidence
        );
      } else {
        setFaceDetectedInFrame(false);
        drawBoundingBox(null, "Neutral", 0);
      }

      if (data.speech) {
        setCurrentSpeechEmotion(data.speech.emotion);
        setCurrentSpeechConfidence(data.speech.confidence);
        setCurrentSpeechSentiment(data.speech.sentiment);

        const newTranscript: TranscriptSegment = {
          id: "tr_" + Date.now(),
          sentence_index: liveTranscripts.length + 1,
          start_time: Math.max(0, streamDurationRef.current - 3),
          end_time: streamDurationRef.current,
          text: data.speech.text,
          emotion: data.speech.emotion,
          confidence: data.speech.confidence / 100,
          sentiment: data.speech.sentiment,
        };
        setLiveTranscripts((prev) => [...prev, newTranscript]);
      }

      // Record a timeline point every 2-3 seconds for live trend
      if (
        streamDurationRef.current > 0 &&
        streamDurationRef.current - lastRecordedSegmentTimeRef.current >= 2
      ) {
        lastRecordedSegmentTimeRef.current = streamDurationRef.current;
        const facialEmo = data.facial?.dominant_facial_emotion || "Neutral";
        const facialConf = data.facial?.confidence || 50;
        const speechEmo = data.speech?.emotion || null;
        const speechConf = data.speech?.confidence || null;

        const seg: TimelineSegment = {
          id: "seg_" + Date.now(),
          face_id: "face_1",
          start_time: Math.max(0, streamDurationRef.current - 2),
          end_time: streamDurationRef.current,
          facial_emotion: facialEmo,
          facial_confidence: facialConf / 100,
          speech_emotion: speechEmo,
          speech_confidence: speechConf ? speechConf / 100 : null,
          combined_emotion: data.dominant_emotion || facialEmo,
          combined_confidence: (data.overall_confidence || facialConf) / 100,
          agreement: speechEmo ? facialEmo.toLowerCase() === speechEmo.toLowerCase() : null,
          probabilities: data.facial?.probabilities || {},
        };
        setLiveTimeline((prev) => [...prev, seg]);
      }
    } catch (err) {
      console.warn("Live frame analysis error:", err);
    } finally {
      isProcessingRef.current = false;
    }
  };

  // ── Save Live Session ─────────────────────────────────────────────────────
  const handleSaveLiveSession = async () => {
    if (liveTimeline.length === 0 && !currentLiveEmotion) {
      toast.error("No emotion telemetry recorded in this session yet.");
      return;
    }

    setSavingSession(true);
    try {
      stopStreaming();

      let dominant = currentLiveEmotion || "Neutral";
      if (liveTimeline.length > 0) {
        const counts: Record<string, number> = {};
        liveTimeline.forEach((s) => {
          counts[s.combined_emotion] = (counts[s.combined_emotion] || 0) + 1;
        });
        dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      }

      const payload = {
        duration_seconds: Math.max(1, streamDuration),
        dominant_emotion: dominant,
        overall_confidence: currentLiveConfidence || 75,
        transitions_count: Math.max(0, liveTimeline.length - 1),
        has_audio: liveTranscripts.length > 0,
        timeline: liveTimeline.map((s) => ({
          start_time: s.start_time,
          end_time: s.end_time,
          facial_emotion: s.facial_emotion,
          facial_confidence: Math.round(s.facial_confidence * 100),
          speech_emotion: s.speech_emotion,
          speech_confidence: s.speech_confidence ? Math.round(s.speech_confidence * 100) : null,
          combined_emotion: s.combined_emotion,
          combined_confidence: Math.round(s.combined_confidence * 100),
          probabilities: s.probabilities,
        })),
        transcripts: liveTranscripts.map((t) => ({
          start_time: t.start_time,
          end_time: t.end_time,
          text: t.text,
          emotion: t.emotion,
          confidence: Math.round(t.confidence * 100),
          sentiment: t.sentiment,
        })),
      };

      const res = await videoEmotionAPI.saveLiveSession(payload);
      const analysisId = res.data.analysis_id;

      const [detRes, timeRes, trRes] = await Promise.all([
        videoEmotionAPI.getDetails(analysisId),
        videoEmotionAPI.getTimeline(analysisId),
        videoEmotionAPI.getTranscript(analysisId),
      ]);

      setDetails(detRes.data);
      setTimeline(timeRes.data);
      setTranscripts(trRes.data);

      toast.success("Live video emotion session saved and analyzed!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to save live session.");
    } finally {
      setSavingSession(false);
    }
  };

  // ── Upload Mode Handlers ──────────────────────────────────────────────────
  const handleFileSelect = (file: File) => {
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Video file size exceeds maximum limit of 500MB.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["mp4", "mov", "webm", "avi"].includes(ext || "")) {
      toast.error("Unsupported video format. Allowed formats: MP4, MOV, WebM, AVI.");
      return;
    }
    setSelectedFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setDetails(null);
    setTimeline([]);
    setTranscripts([]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveVideo = () => {
    setSelectedFile(null);
    setVideoPreview(null);
    setDetails(null);
    setTimeline([]);
    setTranscripts([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyzeUpload = async () => {
    if (!selectedFile) {
      toast.error("Please upload a video file.");
      return;
    }
    setAnalyzing(true);
    setProgress(12);
    setAnalysisStage("Uploading video stream to secure analyzer...");

    const ticker = setInterval(() => {
      setProgress((prev) => {
        if (prev < 32) {
          setAnalysisStage("Demuxing audio & preparing speech stream...");
          return prev + 4;
        }
        if (prev < 58) {
          setAnalysisStage("Transcribing spoken sentences with Whisper AI...");
          return prev + 3;
        }
        if (prev < 78) {
          setAnalysisStage("Extracting keyframes & tracking facial expressions...");
          return prev + 2;
        }
        if (prev < 92) {
          setAnalysisStage("Analyzing emotion of each sentence & fusing signals...");
          return prev + 1;
        }
        if (prev < 96) {
          setAnalysisStage("Synthesizing final dominant emotion & timeline...");
          return prev + 1;
        }
        return prev;
      });
    }, 900);

    try {
      const formData = new FormData();
      formData.append("video", selectedFile);

      const res = await videoEmotionAPI.analyzeVideo(formData);
      const analysisId = res.data.analysis_id;

      setProgress(96);
      setAnalysisStage("Retrieving multimodal timeline & sentence results...");

      const [detRes, timeRes, trRes] = await Promise.all([
        videoEmotionAPI.getDetails(analysisId),
        videoEmotionAPI.getTimeline(analysisId),
        videoEmotionAPI.getTranscript(analysisId),
      ]);

      clearInterval(ticker);
      setProgress(100);
      setAnalysisStage("Video emotion analysis complete!");

      setDetails(detRes.data);
      setTimeline(timeRes.data);
      setTranscripts(trRes.data);

      toast.success(`Video analysis complete: ${detRes.data.dominant_emotion.toUpperCase()} emotion detected.`);
    } catch (err: any) {
      clearInterval(ticker);
      toast.error(err?.response?.data?.detail || "Video emotion analysis failed.");
    } finally {
      clearInterval(ticker);
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!details) return;
    try {
      await videoEmotionAPI.deleteAnalysis(details.analysis_id);
      toast.success("Video analysis and timeline data deleted.");
      handleRemoveVideo();
    } catch {
      toast.error("Failed to delete analysis records.");
    }
  };

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Video-Based Emotion Analysis & Multimodal Timeline" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 via-slate-900 to-cyan-950/30 p-6 shadow-xl">
            <div className="relative flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                  <Video className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Video-Based Emotion Analysis
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      Real-Time Live Vision &amp; Multimodal Timeline
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Experience real-time live video emotion classification with facial bounding box overlays,
                    stream local video files as virtual cameras, or upload pre-recorded video files for Whisper transcription.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                    <span>🔒 Zero Raw Video Disk Storage</span>
                    <span>👁️ Real-Time Face Bounding Boxes</span>
                    <span>🎙️ Live Speech Sentiment Integration</span>
                    <span>🛡️ Non-Diagnostic Wellness Shield</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-2 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPageMode("live");
                  setDetails(null);
                }}
                className={`flex items-center gap-2.5 px-4 md:px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  pageMode === "live"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 border border-violet-400/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Camera className="w-4 h-4 text-cyan-300" />
                Live Video Emotion
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Real-time
                </span>
              </button>

              <button
                onClick={() => {
                  setPageMode("upload");
                  stopStreaming();
                  setDetails(null);
                }}
                className={`flex items-center gap-2.5 px-4 md:px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  pageMode === "upload"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 border border-violet-400/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <UploadCloud className="w-4 h-4 text-violet-300" />
                Upload Video File
              </button>
            </div>

            <div className="text-xs text-slate-400 font-mono px-3">
              {pageMode === "live" ? (
                isStreaming ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    REC &bull; {formatTime(streamDuration)} ({framesProcessedCount} frames)
                  </span>
                ) : (
                  <span>Camera Standby</span>
                )
              ) : (
                <span>File Upload Ready (Max 500MB)</span>
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* MODE 1: LIVE VIDEO EMOTION DETECTION                                 */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {pageMode === "live" && !details && (
            <div className="space-y-6">
              {/* Permission / Hardware Notice Troubleshooter Banner */}
              {cameraError && (
                <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-4 animate-fade-in shadow-xl">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex-shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {cameraError.type === "not_found"
                            ? "Camera Device Notice"
                            : cameraError.type === "permission_denied"
                            ? "Camera Permission Blocked"
                            : cameraError.type === "in_use"
                            ? "Camera Is In Use by Another Application"
                            : "Camera Notice"}
                        </h4>
                        <button
                          onClick={() => setCameraError(null)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          &times; Dismiss
                        </button>
                      </div>
                      <p className="text-xs text-amber-200/90 font-medium">
                        {cameraError.message}
                      </p>
                      {cameraError.detail && (
                        <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                          {cameraError.detail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Fallback Options */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-900/50 space-y-3 text-xs">
                    <strong className="text-amber-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Hardware Camera &amp; Live Stream Options:
                    </strong>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                      {/* Option 1: Hardware Direct Bridge */}
                      <button
                        onClick={startSystemCameraStream}
                        className="p-3 rounded-xl bg-gradient-to-br from-violet-900/50 to-indigo-900/40 hover:from-violet-800/60 hover:to-indigo-800/50 border border-violet-500/50 text-left space-y-1.5 transition-all group shadow-lg"
                      >
                        <div className="flex items-center gap-2 text-violet-200 font-bold text-xs">
                          <Camera className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
                          Connect HP TrueVision HD
                        </div>
                        <p className="text-[11px] text-slate-300 leading-tight">
                          Hardware bridge connects directly to your laptop webcam, resolving Windows Media Foundation driver conflicts.
                        </p>
                      </button>

                      {/* Option 2: Virtual Video File */}
                      <button
                        onClick={() => virtualFileInputRef.current?.click()}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-violet-500/30 text-left space-y-1.5 transition-all group"
                      >
                        <div className="flex items-center gap-2 text-violet-300 font-bold text-xs">
                          <Film className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
                          Stream Video File
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          Select any local video file (.mp4, .webm) to stream as a virtual camera feed with real-time detection.
                        </p>
                      </button>

                      {/* Option 3: Simulated Live Face */}
                      <button
                        onClick={startSimulationStream}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-left space-y-1.5 transition-all group"
                      >
                        <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                          <PlayCircle className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                          Simulate Live Face
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          Launch an animated face transitioning between emotions with live telemetry.
                        </p>
                      </button>

                      {/* Option 4: Switch to Upload Mode */}
                      <button
                        onClick={() => {
                          setCameraError(null);
                          setPageMode("upload");
                        }}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left space-y-1.5 transition-all group"
                      >
                        <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
                          <UploadCloud className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                          Upload Mode
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          Upload video files for sentence-by-sentence Whisper AI analysis.
                        </p>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                      <span>Click below to retry accessing your physical webcam directly:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={startSystemCameraStream}
                          className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white border border-violet-400/40 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                        >
                          <Camera className="w-3.5 h-3.5 text-cyan-300" /> Connect HP TrueVision Camera
                        </button>
                        <button
                          onClick={startStreaming}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retry Browser WebRTC
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Hidden Virtual Video Input */}
              <input
                ref={virtualFileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                onChange={handleSelectVirtualCameraFile}
                className="hidden"
              />

              {/* Live Streaming Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Video Viewport & Overlaid Canvas HUD (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col space-y-4">
                  <div className="p-4 md:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                    {/* Viewport Header Controls */}
                    <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                          <Radio className="w-4 h-4 animate-pulse" />
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            Live Camera HUD
                            {isVirtualStream && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Virtual: {virtualStreamName || "Feed"}
                              </span>
                            )}
                          </h3>
                          <p className="text-[11px] text-slate-400">Real-time facial tracking &amp; emotion telemetry</p>
                        </div>
                      </div>

                      {/* Toggles & Camera Selector */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {availableCameras.length > 1 && !isVirtualStream && (
                          <select
                            value={selectedCameraId}
                            disabled={isStreaming}
                            onChange={(e) => setSelectedCameraId(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                          >
                            {availableCameras.map((cam) => (
                              <option key={cam.deviceId} value={cam.deviceId}>
                                {cam.label}
                              </option>
                            ))}
                          </select>
                        )}

                        <button
                          onClick={() => setMirrorPreview(!mirrorPreview)}
                          className={`p-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                            mirrorPreview
                              ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                              : "bg-slate-950 text-slate-400 border-slate-800"
                          }`}
                          title="Mirror camera preview horizontally"
                        >
                          <FlipHorizontal className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Mirror</span>
                        </button>

                        <button
                          onClick={() => setEnableAudioSpeech(!enableAudioSpeech)}
                          disabled={isStreaming}
                          className={`p-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                            enableAudioSpeech
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                              : "bg-slate-950 text-slate-400 border-slate-800 opacity-60"
                          }`}
                          title="Enable speech-to-text sentiment integration"
                        >
                          {enableAudioSpeech ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">Speech</span>
                        </button>
                      </div>
                    </div>

                    {/* Camera Feed Viewport with Overlaid Canvas */}
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-2xl">
                      {/* Video Element for WebRTC / Virtual Stream */}
                      <video
                        ref={liveVideoRef}
                        playsInline
                        autoPlay
                        muted
                        className={`w-full h-full object-cover transition-transform ${
                          mirrorPreview ? "-scale-x-100" : ""
                        } ${isStreaming && !isSystemCameraStream ? "block" : "hidden"}`}
                      />

                      {/* Direct Hardware Camera Stream Feed (DirectShow Bridge) */}
                      {isStreaming && isSystemCameraStream && systemCameraFrame && (
                        <img
                          src={systemCameraFrame}
                          alt="Live Hardware Camera Feed"
                          className={`w-full h-full object-cover transition-transform ${
                            mirrorPreview ? "-scale-x-100" : ""
                          }`}
                        />
                      )}

                      {/* Connecting Indicator for Hardware Camera */}
                      {isStreaming && isSystemCameraStream && !systemCameraFrame && (
                        <div className="flex flex-col items-center justify-center gap-3 text-violet-400 p-6 text-center">
                          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                          <span className="text-xs font-semibold text-slate-200">
                            Connecting to HP TrueVision HD Camera via Hardware Bridge...
                          </span>
                        </div>
                      )}

                      {/* Bounding Box HUD Canvas Overlay */}
                      <canvas
                        ref={overlayCanvasRef}
                        className={`absolute inset-0 pointer-events-none w-full h-full ${
                          isStreaming ? "block" : "hidden"
                        }`}
                      />

                      {/* Active Status Badge on Video */}
                      {isStreaming && (
                        <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
                          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/80 text-white flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            LIVE &bull; {formatTime(streamDuration)}
                          </span>
                          {faceDetectedInFrame ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1">
                              <Check className="w-3 h-3" /> Face Locked
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                              Scanning for face...
                            </span>
                          )}
                        </div>
                      )}

                      {/* Active Dominant Emotion Pill Overlay */}
                      {isStreaming && (
                        <div className="absolute top-4 right-4 pointer-events-none">
                          <div
                            className={`px-3 py-1 rounded-xl font-bold text-xs border backdrop-blur-md shadow-lg flex items-center gap-1.5 capitalize ${getEmotionBadgeColor(
                              currentLiveEmotion
                            )}`}
                          >
                            <span>{getEmotionEmoji(currentLiveEmotion)}</span>
                            <span>{currentLiveEmotion}</span>
                            <span className="opacity-80">({Math.round(currentLiveConfidence)}%)</span>
                          </div>
                        </div>
                      )}

                      {/* Spoken Speech Subtitle Banner Overlay */}
                      {isStreaming && currentSpeechSnippet && (
                        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                          <div className="p-2.5 rounded-xl bg-slate-950/85 border border-slate-700/80 backdrop-blur-md shadow-lg flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 truncate text-slate-200">
                              <Volume2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                              <span className="italic truncate">&ldquo;{currentSpeechSnippet}&rdquo;</span>
                            </div>
                            {currentSpeechEmotion && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex-shrink-0 capitalize ${getEmotionBadgeColor(
                                  currentSpeechEmotion
                                )}`}
                              >
                                {getEmotionEmoji(currentSpeechEmotion)} {currentSpeechEmotion}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Idle / Offscreen Standby View */}
                      {!isStreaming && (
                        <div className="p-8 text-center space-y-4 max-w-md">
                          <div className="w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 mx-auto flex items-center justify-center shadow-inner">
                            <Camera className="w-10 h-10" />
                          </div>
                          <div className="space-y-1.5">
                            <h4 className="text-sm font-bold text-white">Live Camera Detection Ready</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Real-time emotion recognition using your HP TrueVision HD Camera or standard WebRTC webcam.
                            </p>
                          </div>

                          {/* Quick Launch Buttons in Standby */}
                          <div className="flex flex-wrap justify-center gap-2 pt-2">
                            <button
                              onClick={startSystemCameraStream}
                              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white border border-violet-400/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-violet-500/20"
                            >
                              <Camera className="w-3.5 h-3.5 text-cyan-300" />
                              Connect HP TrueVision HD
                            </button>
                            <button
                              onClick={() => virtualFileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-violet-300 border border-violet-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                            >
                              <Film className="w-3.5 h-3.5" />
                              Stream Video File
                            </button>
                            <button
                              onClick={startSimulationStream}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              Simulate Live Face
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Primary Streaming Controls */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {!isStreaming ? (
                        <>
                          <button
                            onClick={startSystemCameraStream}
                            className="btn-primary flex-1 py-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
                            title="Connect directly to your HP TrueVision HD Camera"
                          >
                            <Camera className="w-4 h-4 text-cyan-300" />
                            Connect Live Camera (HP TrueVision HD)
                          </button>
                          <button
                            onClick={startStreaming}
                            className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                            title="Start via standard Browser WebRTC"
                          >
                            <Radio className="w-4 h-4 text-emerald-400" />
                            Browser WebRTC
                          </button>
                          <button
                            onClick={() => virtualFileInputRef.current?.click()}
                            className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                            title="Stream any video file as a virtual camera"
                          >
                            <Film className="w-4 h-4 text-violet-400" />
                            Stream Video File
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={stopStreaming}
                            className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all"
                          >
                            <StopCircle className="w-4 h-4 text-rose-400" />
                            Stop Camera
                          </button>

                          <button
                            onClick={handleSaveLiveSession}
                            disabled={savingSession}
                            className="btn-primary flex-1 py-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
                          >
                            {savingSession ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            )}
                            {savingSession ? "Saving Live Session..." : "Finish & View Full Report"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Real-Time Telemetry & Probability Dashboard (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Real-time Dominant Mood Card */}
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live Emotion Telemetry</h4>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {isStreaming ? "Sampling @ ~1.6 FPS" : "Awaiting Stream"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-3xl shadow-inner">
                        {getEmotionEmoji(currentLiveEmotion)}
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Dominant Expression</div>
                        <div className="text-xl font-black text-white capitalize flex items-center gap-2">
                          {currentLiveEmotion}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-bold border ${getEmotionBadgeColor(
                              currentLiveEmotion
                            )}`}
                          >
                            {Math.round(currentLiveConfidence)}% Confidence
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {faceDetectedInFrame ? "Face tracking active in keyframe" : "No face locked in current frame"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 7-Emotion Live Probability Spectrum */}
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                        7-Emotion Probability Spectrum
                      </h4>
                      <span className="text-[10px] text-slate-500">Facial Neural Net</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      {EMOTION_TAXONOMY.map((emo) => {
                        const rawVal = currentProbabilities[emo] || 0;
                        const pct = Math.min(100, Math.round(rawVal > 1 ? rawVal : rawVal * 100));
                        return (
                          <div key={emo} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                                <span>{getEmotionEmoji(emo)}</span>
                                <span className="capitalize">{emo}</span>
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-400">{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                              <div
                                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Speech Recognition & Sentiment Feed */}
                  {enableAudioSpeech && (
                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                          Live Speech Emotion Stream ({liveTranscripts.length})
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono">NLP Whisper</span>
                      </div>

                      {liveTranscripts.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {liveTranscripts.slice(-4).map((tr, idx) => (
                            <div
                              key={tr.id || idx}
                              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-mono">
                                  {formatTime(tr.start_time)} – {formatTime(tr.end_time)}
                                </span>
                                <span
                                  className={`px-2 py-0.2 rounded-full font-bold border text-[10px] capitalize ${getEmotionBadgeColor(
                                    tr.emotion
                                  )}`}
                                >
                                  {getEmotionEmoji(tr.emotion)} {tr.emotion}
                                </span>
                              </div>
                              <p className="text-slate-200 text-xs italic">&ldquo;{tr.text}&rdquo;</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-xs text-slate-500 space-y-1">
                          <Mic className="w-5 h-5 mx-auto text-slate-600" />
                          <p>Speak to capture live sentences &amp; sentiment.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Live Rolling Timeline Snapshots */}
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-violet-400" />
                        Rolling Timeline Points ({liveTimeline.length})
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">2s Ticker</span>
                    </div>

                    {liveTimeline.length > 0 ? (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {liveTimeline.slice(-5).map((seg, idx) => (
                          <div
                            key={seg.id || idx}
                            className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                          >
                            <span className="font-mono text-cyan-300 font-semibold">{formatTime(seg.start_time)}</span>
                            <span className="capitalize text-slate-200 font-semibold">
                              {getEmotionEmoji(seg.facial_emotion)} {seg.facial_emotion}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getEmotionBadgeColor(
                                seg.combined_emotion
                              )}`}
                            >
                              Combined: {seg.combined_emotion}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-slate-500 space-y-1">
                        <Clock className="w-5 h-5 mx-auto text-slate-600" />
                        <p>Timeline points will accumulate automatically during streaming.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* MODE 2: UPLOAD VIDEO FILE (SENTENCE & TIMELINE ANALYSIS)            */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {pageMode === "upload" && !details && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Zone */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Film className="w-4 h-4 text-cyan-400" />
                  1. Video Upload &amp; Preview
                </h3>

                {!videoPreview ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-violet-500 rounded-2xl p-8 text-center cursor-pointer transition-colors space-y-3 bg-slate-950/40"
                  >
                    <div className="p-4 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 w-16 h-16 mx-auto flex items-center justify-center">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">Drag &amp; Drop video file here or click to browse</p>
                      <p className="text-[11px] text-slate-500">Supports MP4, MOV, WebM, AVI (Max 500MB, 60 mins / 3600s)</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                      <video ref={uploadVideoRef} src={videoPreview} controls className="max-h-64 w-full rounded-2xl" />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-mono truncate max-w-xs">{selectedFile?.name}</span>
                      <button
                        onClick={handleRemoveVideo}
                        className="py-1.5 px-3 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold flex items-center gap-1.5 border border-rose-500/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Video
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Analysis Controls & Progress */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    2. Multimodal Video Pipeline
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    The video pipeline automatically extracts sampled frames, tracks faces across keyframes, smooths frame-by-frame emotion probabilities,
                    transcribes audio speech, and correlates speech sentiment with visual expressions.
                  </p>

                  {analyzing && (
                    <div className="space-y-3 pt-2 animate-fade-in">
                      <div className="flex justify-between items-center text-xs text-slate-300">
                        <span className="flex items-center gap-2 font-semibold text-cyan-300 truncate max-w-[280px]">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0 text-cyan-400" />
                          {analysisStage}
                        </span>
                        <span className="font-mono font-bold text-violet-300 bg-violet-500/15 border border-violet-500/25 px-2 py-0.5 rounded-full text-[11px]">
                          {progress}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-400 rounded-full transition-all duration-500 ease-out shadow-sm"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        Analyzing spoken audio and facial movements. Optimized keyframe processing completes in seconds.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleAnalyzeUpload}
                    disabled={analyzing || !selectedFile}
                    className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
                  >
                    {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                    {analyzing ? "Tracking Faces & Processing Audio..." : "Analyze Video & Generate Timeline"}
                  </button>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
                    <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Privacy Guard: Video processing is executed in-memory. Raw videos are never retained.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* COMPREHENSIVE ANALYSIS REPORT DISPLAY (FOR LIVE SESSIONS OR UPLOADS) */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {details && (
            <div className="space-y-6 animate-fade-in">
              {/* Back to Live / Reset Bar */}
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Analysis Saved: {details.filename}
                </span>
                <button
                  onClick={() => {
                    setDetails(null);
                    setTimeline([]);
                    setTranscripts([]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 text-xs font-bold border border-violet-500/30 transition-all flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Start New Session
                </button>
              </div>

              {/* Final Dominant Emotion Summary Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-950/40 via-slate-900 to-cyan-950/40 border border-violet-500/30 space-y-5">
                <div className="flex flex-wrap justify-between items-center border-b border-violet-500/20 pb-4 gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-2xl shadow-inner">
                      {getEmotionEmoji(details.dominant_emotion)}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Final Dominant Emotion</div>
                      <div className="text-xl md:text-2xl font-black text-white capitalize flex items-center gap-2">
                        {details.dominant_emotion}
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getEmotionBadgeColor(details.dominant_emotion)}`}>
                          {((details.overall_confidence || 0.82) * 100).toFixed(0)}% Overall Confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Duration: </span>
                      <strong className="text-white font-mono">{details.duration_seconds}s</strong>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Sentences: </span>
                      <strong className="text-violet-300 font-mono">{transcripts.length}</strong>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Tracked Faces: </span>
                      <strong className="text-cyan-300 font-mono">{details.faces_tracked_count}</strong>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Emotion Shifts: </span>
                      <strong className="text-emerald-400 font-mono">{details.transitions_count}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200">Supportive Non-Diagnostic Observation:</strong>{" "}
                    {details.non_diagnostic_statement}
                  </div>
                </div>
              </div>

              {/* Multi-Layer Timeline & Sentence Tabs */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab("transcript")}
                      className={`py-1.5 px-3.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        activeTab === "transcript"
                          ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Sentence-by-Sentence Emotions ({transcripts.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("timeline")}
                      className={`py-1.5 px-3.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        activeTab === "timeline"
                          ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Multi-Layer Timeline ({timeline.length})
                    </button>
                  </div>

                  <button
                    onClick={handleDelete}
                    className="py-1.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Analysis
                  </button>
                </div>

                {/* Sentence-by-Sentence Emotion Recognition Tab */}
                {activeTab === "transcript" && (
                  <div className="space-y-4">
                    {transcripts.length > 0 ? (
                      <>
                        {/* Sentence Emotion Distribution Summary */}
                        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2">
                          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                            Speech Emotion Distribution across {transcripts.length} spoken sentence(s):
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {Array.from(new Set(transcripts.map((t) => t.emotion))).map((emo) => {
                              const count = transcripts.filter((t) => t.emotion === emo).length;
                              const pct = ((count / transcripts.length) * 100).toFixed(0);
                              return (
                                <span
                                  key={emo}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${getEmotionBadgeColor(
                                    emo
                                  )}`}
                                >
                                  <span>{getEmotionEmoji(emo)}</span>
                                  <span className="capitalize">{emo}</span>
                                  <span className="opacity-80">
                                    ({count} &bull; {pct}%)
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Individual Sentences List */}
                        <div className="space-y-3">
                          {transcripts.map((tr, idx) => (
                            <div
                              key={tr.id}
                              className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5 shadow-sm"
                            >
                              <div className="flex flex-wrap justify-between items-center gap-2 text-xs border-b border-slate-900 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold text-[11px]">
                                    Sentence #{tr.sentence_index || idx + 1}
                                  </span>
                                  <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    {tr.start_time}s – {tr.end_time}s
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 capitalize ${getEmotionBadgeColor(
                                      tr.emotion
                                    )}`}
                                  >
                                    <span>{getEmotionEmoji(tr.emotion)}</span>
                                    <span>{tr.emotion}</span>
                                    <span className="text-[10px] opacity-75">
                                      ({(tr.confidence * 100).toFixed(0)}%)
                                    </span>
                                  </span>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                      tr.sentiment === "positive"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : tr.sentiment === "negative"
                                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                        : "bg-slate-800 text-slate-400 border-slate-700"
                                    } capitalize`}
                                  >
                                    {tr.sentiment} Sentiment
                                  </span>
                                </div>
                              </div>
                              <p className="text-slate-100 text-xs sm:text-sm font-medium leading-relaxed pl-2 border-l-2 border-violet-500/40">
                                &ldquo;{tr.text}&rdquo;
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs font-bold text-slate-300">No Spoken Audio Detected</p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          This session contains no transcribed dialogue. Facial emotion tracking is available in the Multi-Layer Timeline tab.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline Layer */}
                {activeTab === "timeline" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">Tracked Face</th>
                          <th className="py-3 px-4">Facial Expression</th>
                          <th className="py-3 px-4">Speech Emotion</th>
                          <th className="py-3 px-4">Combined Multimodal Result</th>
                          <th className="py-3 px-4">Signal Alignment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {timeline.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-950/40">
                            <td className="py-3 px-4 font-mono text-cyan-300">{item.start_time}s</td>
                            <td className="py-3 px-4 text-slate-400 font-semibold">{item.face_id}</td>
                            <td className="py-3 px-4 font-semibold text-white capitalize">
                              {item.facial_emotion} ({(item.facial_confidence * 100).toFixed(0)}%)
                            </td>
                            <td className="py-3 px-4 text-slate-400 capitalize">
                              {item.speech_emotion
                                ? `${item.speech_emotion} (${((item.speech_confidence || 0.8) * 100).toFixed(0)}%)`
                                : "—"}
                            </td>
                            <td className="py-3 px-4 font-bold text-violet-300 capitalize">
                              {item.combined_emotion} ({(item.combined_confidence * 100).toFixed(0)}%)
                            </td>
                            <td className="py-3 px-4">
                              {item.agreement !== null && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    item.agreement
                                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                  }`}
                                >
                                  {item.agreement ? "Agreed ✓" : "Mixed ⚠️"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
