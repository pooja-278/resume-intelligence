"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Award, Lightbulb, Loader2, CheckCircle2, TrendingUp, Target, Zap } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";
import api from "@/lib/api";

interface Resume {
  id: number;
  file_name: string;
  raw_text: string | null;
  structured_json: any | null;
}

interface Analysis {
  id: number;
  ats_score: number;
  feedback: {
    formatting_score?: number;
    skills_score?: number;
    experience_score?: number;
    keyword_match?: number;
    general_improvements?: string[];
    missing_skills?: string[];
  };
}

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circumference - (pct / 100) * circumference;

  const color =
    pct >= 80 ? "oklch(0.75 0.18 152)" :
      pct >= 60 ? "oklch(0.78 0.18 72)" :
        "oklch(0.62 0.22 25)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="oklch(0.22 0.010 265)" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-2xl font-bold tabular-nums" style={{ color, fontFamily: 'var(--font-display)' }}>
          {Math.round(score)}
        </span>
        <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'oklch(0.45 0.015 265)' }}>
          ATS
        </span>
      </div>
    </div>
  );
}

const scoreColor = (v: number) =>
  v >= 80 ? "oklch(0.75 0.18 152)" : v >= 60 ? "oklch(0.78 0.18 72)" : "oklch(0.62 0.22 25)";

export default function ResumeAnalysisPage() {
  const params = useParams();
  const resumeId = params?.id;

  const [resume, setResume] = useState<Resume | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [editedContent, setEditedContent] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Loading resume content…</p>",
    onUpdate: ({ editor }) => {
      setEditedContent(editor.getHTML()); // capture edits
    },
    editorProps: {
      attributes: { class: "prose prose-invert max-w-none focus:outline-none min-h-[500px]" },
    },
    immediatelyRender: false
  });

  useEffect(() => {
    if (resumeId) { fetchResume(); fetchAnalysis(); }
  }, [resumeId]);

  useEffect(() => {
    if (editor && resume?.raw_text && editor.getText() === "Loading resume content…") {
      const html = resume.raw_text
        .split("\n")
        .filter((p) => p.trim() !== "")
        .map((p) => `<p>${p}</p>`)
        .join("");
      editor.commands.setContent(html);
    }
  }, [editor, resume]);

  const fetchResume = async () => {
    try {
      const r = await api.get(`/resumes/${resumeId}`);
      setResume(r.data);
    } catch { toast.error("Failed to fetch resume details"); }
  };

  const fetchAnalysis = async () => {
    try {
      const r = await api.get(`/resumes/${resumeId}/analysis`);
      setAnalysis(r.data);
      setPolling(false);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setPolling(true);
        setTimeout(fetchAnalysis, 3000);
      } else {
        toast.error("Failed to fetch analysis");
        setLoading(false);
      }
    } finally {
      if (!polling) setLoading(false);
    }
  };

  if (loading && !polling && !resume) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" style={{ background: 'oklch(0.18 0.010 265)' }} />
          <div className="space-y-2">
            <Skeleton className="h-5 w-56" style={{ background: 'oklch(0.18 0.010 265)' }} />
            <Skeleton className="h-3 w-32" style={{ background: 'oklch(0.18 0.010 265)' }} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[680px] rounded-2xl" style={{ background: 'oklch(0.15 0.010 265)' }} />
          <div className="space-y-5">
            <Skeleton className="h-60 rounded-2xl" style={{ background: 'oklch(0.15 0.010 265)' }} />
            <Skeleton className="h-72 rounded-2xl" style={{ background: 'oklch(0.15 0.010 265)' }} />
          </div>
        </div>
      </div>
    );
  }

  const scoreBreakdown = [
    { key: "Formatting", value: analysis?.feedback.formatting_score, icon: Target },
    { key: "Skills", value: analysis?.feedback.skills_score, icon: Zap },
    { key: "Experience", value: analysis?.feedback.experience_score, icon: TrendingUp },
    { key: "Keywords", value: analysis?.feedback.keyword_match, icon: Award },
  ].filter(x => x.value !== undefined);

  const handleSaveAndAnalyze = async () => {
    if (!editor) return;

    try {
      setSaving(true);

      const updatedContent = editor.getHTML();

      // 1. Save updated resume
      await api.put(`/resumes/${resumeId}`, {
        raw_text: updatedContent,
      });

      toast.success("Resume updated successfully");

      // 2. Trigger re-analysis
      await api.post(`/resumes/${resumeId}/analyze`);

      // 3. Reset state & poll again
      setAnalysis(null);
      setPolling(true);
      fetchAnalysis();

    } catch (err) {
      toast.error("Failed to update resume");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'oklch(0.72 0.18 195 / 0.1)', border: '1px solid oklch(0.72 0.18 195 / 0.25)' }}>
            <FileText className="w-6 h-6" style={{ color: 'oklch(0.72 0.18 195)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white truncate max-w-xs md:max-w-lg"
              style={{ fontFamily: 'var(--font-display)' }}>
              {resume?.file_name ?? "Loading…"}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm">
              {polling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'oklch(0.72 0.18 195)' }} />
                  <span style={{ color: 'oklch(0.50 0.015 265)' }}>AI is analyzing…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'oklch(0.75 0.18 152)' }} />
                  <span style={{ color: 'oklch(0.50 0.015 265)' }}>Analysis complete</span>
                </>
              )}
            </div>
          </div>
        </div>

        {analysis && !polling && (
          <div className="animate-fade-in flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-mono tracking-widest uppercase" style={{ color: 'oklch(0.50 0.015 265)' }}>ATS Score</p>
              <p className="text-xs mt-0.5" style={{ color: 'oklch(0.40 0.010 265)' }}>
                {analysis.ats_score >= 80 ? "Excellent" : analysis.ats_score >= 60 ? "Good" : "Needs Work"}
              </p>
            </div>
            <ScoreRing score={analysis.ats_score} />
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 animate-fade-in-up delay-100">
          <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ height: '680px' }}>
            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b"
              style={{ background: 'oklch(0.13 0.008 265)', borderColor: 'oklch(0.22 0.010 265)' }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: 'oklch(0.55 0.22 25 / 0.8)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: 'oklch(0.78 0.18 72 / 0.8)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: 'oklch(0.75 0.18 152 / 0.8)' }} />
                <span className="ml-3 text-xs font-mono" style={{ color: 'oklch(0.40 0.010 265)' }}>
                  resume-editor.tsx
                </span>
              </div>
              <button
                onClick={handleSaveAndAnalyze}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-xs font-medium"
              >
                {saving ? "Saving..." : "Save & Re-analyze"}
              </button>
              <span className="text-xs font-mono px-2 py-0.5 rounded"
                style={{ background: 'oklch(0.72 0.18 195 / 0.1)', color: 'oklch(0.72 0.18 195 / 0.7)' }}>
                Editable
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-6" style={{ background: 'oklch(0.115 0.008 265)' }}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Analysis panel */}
        <div className="space-y-5 overflow-y-auto" style={{ maxHeight: '680px' }}>
          {polling ? (
            <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'oklch(0.72 0.18 195 / 0.1)', border: '1px solid oklch(0.72 0.18 195 / 0.25)' }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'oklch(0.72 0.18 195)' }} />
              </div>
              <h3 className="text-base font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Analyzing with AI
              </h3>
              <p className="text-sm" style={{ color: 'oklch(0.45 0.015 265)' }}>
                Extracting skills, experience, and computing your ATS score…
              </p>
              <div className="w-full mt-6 space-y-2">
                {["Parsing structure", "Extracting keywords", "Scoring ATS fit"].map((s, i) => (
                  <div key={s} className="flex items-center gap-2 text-xs" style={{ color: 'oklch(0.40 0.010 265)' }}>
                    <Loader2 className="w-3 h-3 animate-spin shrink-0" style={{ animationDelay: `${i * 0.3}s` }} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          ) : analysis ? (
            <>
              {/* Score breakdown */}
              <div className="glass rounded-2xl p-5 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-5">
                  <Award className="w-4 h-4" style={{ color: 'oklch(0.72 0.18 195)' }} />
                  <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    Score Breakdown
                  </h3>
                </div>
                <div className="space-y-4">
                  {scoreBreakdown.map(({ key, value, icon: Icon }) => {
                    const v = value as number;
                    const color = scoreColor(v);
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: 'oklch(0.50 0.015 265)' }} />
                            <span className="text-xs font-medium" style={{ color: 'oklch(0.70 0.015 265)' }}>{key}</span>
                          </div>
                          <span className="text-xs font-bold font-mono" style={{ color }}>
                            {Math.round(v)}<span style={{ color: 'oklch(0.40 0.010 265)' }}>/100</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.20 0.010 265)' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${v}%`, background: color, boxShadow: `0 0 6px ${color}60` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Suggestions */}
              {(analysis.feedback.general_improvements?.length || analysis.feedback.missing_skills?.length) && (
                <div className="glass rounded-2xl p-5 animate-fade-in-up delay-100">
                  <div className="flex items-center gap-2 mb-5">
                    <Lightbulb className="w-4 h-4" style={{ color: 'oklch(0.78 0.18 72)' }} />
                    <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                      AI Suggestions
                    </h3>
                  </div>

                  {analysis.feedback.general_improvements && analysis.feedback.general_improvements.length > 0 && (
                    <div className="mb-5">
                      <p className="text-[10px] font-mono tracking-widest uppercase mb-3"
                        style={{ color: 'oklch(0.42 0.010 265)' }}>
                        How to improve
                      </p>
                      <ul className="space-y-2">
                        {analysis.feedback.general_improvements.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs rounded-lg px-3 py-2.5"
                            style={{ background: 'oklch(0.16 0.010 265)', color: 'oklch(0.70 0.015 265)' }}>
                            <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5"
                              style={{ background: 'oklch(0.78 0.18 72 / 0.15)', color: 'oklch(0.78 0.18 72)' }}>
                              {i + 1}
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.feedback.missing_skills && analysis.feedback.missing_skills.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono tracking-widest uppercase mb-3"
                        style={{ color: 'oklch(0.42 0.010 265)' }}>
                        Consider adding
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.feedback.missing_skills.map((skill, i) => (
                          <span key={i}
                            className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-default"
                            style={{
                              background: 'oklch(0.72 0.18 195 / 0.08)',
                              color: 'oklch(0.72 0.18 195 / 0.9)',
                              border: '1px solid oklch(0.72 0.18 195 / 0.2)',
                            }}>
                            + {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
