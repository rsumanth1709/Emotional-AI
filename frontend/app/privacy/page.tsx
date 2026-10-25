"use client";

import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck, Database, EyeOff, CheckCircle2, UserCheck, FileCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/signup"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Sign Up</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="MindCare AI Logo"
              className="w-8 h-8 rounded-full object-cover shadow-sm shadow-cyan-500/20"
            />
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
              MindCare AI
            </span>
          </div>

          <Link
            href="/terms"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Terms & Conditions →
          </Link>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Privacy By Design</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm">
            Last Updated: October 6, 2026 • Strict Confidentiality & Zero Data Selling Guarantee
          </p>
        </div>

        {/* Zero Data Selling Guarantee Banner */}
        <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs sm:text-sm space-y-2">
          <div className="flex items-center gap-2 font-bold text-cyan-300">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <span>Our Uncompromising Privacy Guarantee</span>
          </div>
          <p className="leading-relaxed text-cyan-200/90">
            <strong>MindCare AI will NEVER sell your emotional data, chat history, or wellness journals to advertisers or data brokers.</strong> Your personal reflection history is protected by 256-bit AES encryption at rest and TLS 1.3 in transit, adhering to rigorous confidentiality and ethical AI governance standards.
          </p>
        </div>

        {/* Section Blocks */}
        <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">1.</span> Information We Collect
            </h2>
            <p>
              To provide personalized emotional guidance and support, MindCare AI collects the following categories of information:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-400">
              <li>
                <strong className="text-white">Account Information:</strong> Your email address, username, password hash (salted via bcrypt), or Google OAuth identifier if authenticating with Google.
              </li>
              <li>
                <strong className="text-white">Wellness & Mood Telemetry:</strong> Mood ratings, self-reported emotions, journal reflections, and habit completions you choose to log.
              </li>
              <li>
                <strong className="text-white">Multimodal Audio & Video Data:</strong> If enabled, transient microphone and camera inputs are processed locally or in memory to extract emotional tone and valence vectors. Raw audio and video files are not permanently archived.
              </li>
              <li>
                <strong className="text-white">Optional Wearable Metrics:</strong> Heart rate variability (HRV) and sleep duration if you connect an external wearable health integration.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">2.</span> How We Protect Your Data (Encryption & Security)
            </h2>
            <p>
              We implement comprehensive technical and organizational safeguards designed to secure your sensitive emotional information:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-400">
              <li><strong>Field-Level Encryption:</strong> Sensitive journal entries and private session reflections are encrypted using AES-256 before storage in our database.</li>
              <li><strong>Zero Foundation Model Training:</strong> Your private conversations are NEVER used to train publicly distributed third-party foundation models.</li>
              <li><strong>Small-Group Suppression & Differential Privacy:</strong> Any aggregate research or system health statistics inject mathematical noise to prevent individual participant re-identification.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">3.</span> How We Use Your Information
            </h2>
            <p>
              We use the collected information strictly for:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-400">
              <li>Generating empathetic, emotion-aware supportive responses and suggestions.</li>
              <li>Detecting behavioral emotional patterns, causes, and transitions to support personal self-reflection.</li>
              <li>Detecting acute crisis phrases (e.g. self-harm statements) to trigger immediate, protective crisis resources and emergency hotlines.</li>
              <li>Maintaining system reliability, safety guardrails, and account security.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">4.</span> Information Sharing & Third Parties
            </h2>
            <p>
              We do not share your personal health or emotional data with any third parties, except in the following strictly limited situations:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-400">
              <li><strong>Service Providers:</strong> Secure cloud infrastructure providers strictly bound by data protection agreements and confidentiality covenants.</li>
              <li><strong>Imminent Danger & Legal Compliance:</strong> In the rare event of clear and credible imminent self-harm or threat to life, emergency protocols or legal obligations may require sharing necessary safety details with certified crisis responders.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">5.</span> Your Rights & Right to Be Forgotten
            </h2>
            <p>
              Regardless of your geographic location, MindCare AI grants all users the following fundamental privacy rights:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-400">
              <li><strong>Right of Access:</strong> You can view all your stored emotional records, journals, and chat logs at any time directly through the dashboard.</li>
              <li><strong>Right to Data Portability:</strong> You can export your data in JSON or CSV format from your account settings.</li>
              <li><strong>Right to Erasure (Permanent Deletion):</strong> You can permanently purge your entire account, chat history, and emotional logs with a single click in your Profile Settings or by sending an erasure request.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">6.</span> Third-Party Authentication (Google Sign-In)
            </h2>
            <p>
              When you authenticate using Google Sign-In, we receive verified authentication tokens containing your email, name, and profile picture avatar from Google Identity Services. We do not receive access to your Google Drive, Gmail, or other Google services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">7.</span> Contact Our Privacy Officer
            </h2>
            <p>
              For any questions regarding this Privacy Policy, your personal rights, or to submit a data erasure request, please reach out to our dedicated privacy desk:{" "}
              <a href="mailto:privacy@mindcare.ai" className="text-cyan-400 underline font-semibold">
                privacy@mindcare.ai
              </a>
            </p>
          </section>
        </div>

        {/* Footer Accept CTA */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>HIPAA-Aligned • GDPR Compliant • AES-256 Encrypted</span>
          </div>

          <Link
            href="/signup"
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30"
          >
            I Acknowledge — Return to Sign Up
          </Link>
        </div>
      </main>
    </div>
  );
}
