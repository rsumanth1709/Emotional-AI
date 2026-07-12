"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { journalAPI } from "@/lib/axios";
import type { JournalEntry } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { BookOpen, Plus, Trash2, Calendar, Smile } from "lucide-react";
import { toast } from "react-hot-toast";

export default function JournalPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [moodScore, setMoodScore] = useState(5);
  const [emotionTag, setEmotionTag] = useState("Neutral");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchEntries = async () => {
    try {
      const res = await journalAPI.getEntries();
      setEntries(res.data);
    } catch {
      toast.error("Failed to load journal entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      await journalAPI.createEntry({
        title,
        content,
        mood_score: moodScore,
        emotion_tag: emotionTag,
      });
      toast.success("Journal entry created successfully!");
      setTitle("");
      setContent("");
      setMoodScore(5);
      setEmotionTag("Neutral");
      setShowForm(false);
      fetchEntries();
    } catch {
      toast.error("Could not save journal entry.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await journalAPI.deleteEntry(id);
      toast.success("Entry deleted.");
      fetchEntries();
    } catch {
      toast.error("Failed to delete entry.");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Opening clinical journal...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Personal Therapeutic Journal" />
        
        <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Journaling Space</h2>
              <p className="text-slate-400 text-sm mt-1">A private, safe diary to write down thoughts and monitor moods.</p>
            </div>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{showForm ? "Cancel" : "New Entry"}</span>
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="glass p-6 space-y-4 max-w-2xl animate-fade-in">
              <h3 className="font-bold text-lg text-white">Write Thoughts</h3>
              
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Title</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Today's Reflections"
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Content</label>
                <textarea 
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="How was your day? What obstacles did you encounter? How did you respond?"
                  className="input-field resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">Mood Score ({moodScore}/10)</label>
                  <input 
                    type="range"
                    min={1}
                    max={10}
                    value={moodScore}
                    onChange={(e) => setMoodScore(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">Overall Feeling Tag</label>
                  <select 
                    value={emotionTag}
                    onChange={(e) => setEmotionTag(e.target.value)}
                    className="input-field py-2.5 text-slate-300"
                  >
                    {["Happy", "Excited", "Hopeful", "Sad", "Lonely", "Angry", "Fear", "Anxiety", "Stress", "Neutral"].map((emo) => (
                      <option key={emo} value={emo} className="bg-slate-900 text-white">{emo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-3">Save Entry</button>
            </form>
          )}

          {loading ? (
            <div className="text-slate-500 text-sm">Retrieving journal logs...</div>
          ) : entries.length === 0 ? (
            <div className="glass p-8 text-center max-w-md mx-auto space-y-4">
              <BookOpen className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="font-bold text-white">Your Journal is Empty</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Writing down your experiences is a clinically-proven technique to reduce stress and anxiety levels. Start with a short sentence.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {entries.map((entry) => (
                <div key={entry.id} className="glass p-6 flex flex-col justify-between gap-4 relative group">
                  <button 
                    onClick={() => handleDelete(entry.id)}
                    className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="space-y-2 pr-6">
                    <h3 className="font-bold text-lg text-white">{entry.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{entry.content}</p>
                  </div>

                  <div className="flex gap-4 items-center border-t border-white/5 pt-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-violet-400">
                      <Smile className="w-3.5 h-3.5" />
                      <span>Mood: {entry.mood_score}/10 ({entry.emotion_tag})</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
