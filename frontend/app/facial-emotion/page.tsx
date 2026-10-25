"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { facialEmotionAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Camera, UploadCloud, Image as ImageIcon, RefreshCw, Sparkles,
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Settings2, Sliders,
  TrendingUp, Layers, HelpCircle, Trash2, Eye, Lock
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface DetectedFace {
  face_id: string;
  label: string;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
    norm_x: number;
    norm_y: number;
    norm_w: number;
    norm_h: number;
  };
  predicted_emotion: string;
  confidence_percentage: number;
  probabilities: Record<string, number>;
  is_low_confidence: boolean;
  warning_message: string | null;
}

interface MultimodalResult {
  success: boolean;
  faces_detected: number;
  faces: DetectedFace[];
  image_emotion: {
    emotion: string;
    confidence: number;
    confidence_percentage: number;
    probabilities: Record<string, number>;
    is_low_confidence: boolean;
    warning_message: string | null;
  } | null;
  text_emotion: {
    emotion: string;
    confidence: number;
    sentiment: string;
  } | null;
  multimodal_result: {
    emotion: string;
    confidence: number;
    confidence_percentage: number;
    confidence_level: string;
    agreement: boolean | null;
    note: string;
  } | null;
  non_diagnostic_statement: string;
  error_message?: string;
}

export default function FacialEmotionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>("");
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<MultimodalResult | null>(null);

  // Config settings
  const [textWeight, setTextWeight] = useState<number>(0.60);
  const [imageWeight, setImageWeight] = useState<number>(0.40);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(60.0);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // File size check (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds maximum limit of 10MB.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["jpg", "jpeg", "png", "webp"].includes(ext || "")) {
      toast.error("Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.");
      return;
    }
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Please upload an image containing a human face.");
      return;
    }
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      if (textInput.trim()) {
        formData.append("text", textInput.trim());
      }

      const res = await facialEmotionAPI.analyzeImage(formData);
      setResult(res.data);
      if (res.data.success) {
        toast.success(`Analysis complete: ${res.data.multimodal_result?.emotion.toUpperCase()} emotion detected.`);
      } else {
        toast.error(res.data.error_message || "No face detected in image.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Facial emotion analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await facialEmotionAPI.updateConfig({
        text_weight: textWeight,
        image_weight: imageWeight,
        confidence_threshold: confidenceThreshold,
      });
      toast.success("Multimodal fusion configuration saved.");
      setShowConfig(false);
    } catch {
      toast.error("Failed to save configuration.");
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Facial Emotion Recognition & Multimodal AI" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-slate-900 to-indigo-950/30 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(6,182,212,0.06)_0%,_transparent_60%)]" />
            <div className="relative flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Image-Based Emotion Recognition
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      OpenCV &amp; Multimodal AI
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Upload a facial photo to detect faces, analyze facial expressions across 7 emotions, and combine
                    visual predictions with text NLP for high-accuracy multimodal assessment.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                    <span>🔒 Zero Raw Image Disk Storage</span>
                    <span>👁️ Multi-Face Detection</span>
                    <span>⚡ Weighted Multimodal Fusion</span>
                    <span>🛡️ Non-Diagnostic Safety Shield</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowConfig(!showConfig)}
                className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 flex items-center gap-2"
              >
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Fusion Settings</span>
              </button>
            </div>
          </div>

          {/* Config Settings Drawer */}
          {showConfig && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-cyan-400" />
                  Multimodal Fusion &amp; Confidence Threshold Configuration
                </h3>
                <span className="text-[10px] text-slate-500">Backend System Parameters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Text Weight ({textWeight})</label>
                  <input
                    type="range"
                    min="0.10"
                    max="0.90"
                    step="0.05"
                    value={textWeight}
                    onChange={(e) => {
                      const tw = Number(e.target.value);
                      setTextWeight(tw);
                      setImageWeight(Number((1.0 - tw).toFixed(2)));
                    }}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Image Weight ({imageWeight})</label>
                  <input
                    type="range"
                    min="0.10"
                    max="0.90"
                    step="0.05"
                    value={imageWeight}
                    onChange={(e) => {
                      const iw = Number(e.target.value);
                      setImageWeight(iw);
                      setTextWeight(Number((1.0 - iw).toFixed(2)));
                    }}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Confidence Threshold ({confidenceThreshold}%)</label>
                  <input
                    type="range"
                    min="40"
                    max="90"
                    step="5"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleSaveConfig}
                  className="btn-primary py-2 px-4 text-xs"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          )}

          {/* Main Upload & Text Input Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Zone */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                1. Facial Image Upload
              </h3>

              {!imagePreview ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-8 text-center cursor-pointer transition-colors space-y-3 bg-slate-950/40"
                >
                  <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 w-16 h-16 mx-auto flex items-center justify-center">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">Drag &amp; Drop facial photo here or click to browse</p>
                    <p className="text-[11px] text-slate-500">Supports JPG, JPEG, PNG, WEBP (Max 10MB)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-h-72 flex items-center justify-center">
                    {/* Image Preview */}
                    <img src={imagePreview} alt="Facial Preview" className="max-h-72 w-auto object-contain" />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-mono truncate max-w-xs">{selectedFile?.name}</span>
                    <button
                      onClick={handleRemoveImage}
                      className="py-1.5 px-3 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold flex items-center gap-1.5 border border-rose-500/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Text Context & Submit */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  2. Optional Text Context for Multimodal Fusion
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">
                    Message or Journal Excerpt (Optional)
                  </label>
                  <textarea
                    rows={5}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter message text to combine with your facial photo for weighted multimodal fusion..."
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || !selectedFile}
                  className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {analyzing ? "Detecting Faces & Analyzing Emotion..." : "Analyze Facial & Multimodal Emotion"}
                </button>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
                  <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Privacy Shield: Raw images are processed in-memory and never stored on disk.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Results Display */}
          {result && result.success && (
            <div className="space-y-6 animate-fade-in">
              {/* Multimodal Summary Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 space-y-4">
                <div className="flex flex-wrap justify-between items-center border-b border-cyan-500/20 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Multimodal Assessment:</span>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 capitalize">
                      {result.multimodal_result?.emotion}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-emerald-400 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      Confidence: {result.multimodal_result?.confidence_percentage}% ({result.multimodal_result?.confidence_level})
                    </span>

                    {result.multimodal_result?.agreement !== null && (
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border ${
                        result.multimodal_result?.agreement
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      }`}>
                        {result.multimodal_result?.agreement ? "Modality Signals Agree ✓" : "Modality Disagreement Note ⚠️"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <p className="text-slate-200 leading-relaxed font-medium">{result.multimodal_result?.note}</p>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-300 block mb-0.5">Supportive Mental-Health Observation:</strong>
                    {result.non_diagnostic_statement}
                  </div>
                </div>
              </div>

              {/* Detailed Visual & Text Signals Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Facial Emotion Signal */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Camera className="w-4 h-4 text-cyan-400" />
                      Facial Expression Analysis ({result.faces_detected} face detected)
                    </h3>
                    <span className="text-xs font-bold text-cyan-300 capitalize">
                      {result.image_emotion?.emotion} ({result.image_emotion?.confidence_percentage}%)
                    </span>
                  </div>

                  {result.image_emotion?.is_low_confidence && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{result.image_emotion.warning_message}</span>
                    </div>
                  )}

                  {/* Emotion Probabilities Progress Bars */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Facial Emotion Probability Breakdown
                    </span>
                    {result.image_emotion && Object.entries(result.image_emotion.probabilities).map(([emo, pct]) => (
                      <div key={emo} className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="font-semibold text-white capitalize">{emo}</span>
                          <span className="text-slate-400 font-mono">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Text Signal (if analyzed) */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      Text NLP Emotion Signal
                    </h3>
                    <span className="text-xs font-bold text-violet-300 capitalize">
                      {result.text_emotion ? `${result.text_emotion.emotion} (${(result.text_emotion.confidence * 100).toFixed(1)}%)` : "No Text Provided"}
                    </span>
                  </div>

                  {result.text_emotion ? (
                    <div className="space-y-4 text-xs">
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Analyzed Text Content</span>
                        <p className="text-slate-200 italic leading-relaxed">"{textInput}"</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-semibold block">Predicted Text Emotion</span>
                          <span className="font-bold text-violet-300 text-sm capitalize">{result.text_emotion.emotion}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-semibold block">Sentiment Class</span>
                          <span className="font-bold text-emerald-400 text-sm uppercase">{result.text_emotion.sentiment}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8 text-slate-500 text-xs">
                      No text prompt was submitted alongside the photo. Analysis operated purely on facial visual expression.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
