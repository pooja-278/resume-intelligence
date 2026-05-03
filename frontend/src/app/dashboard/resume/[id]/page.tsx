"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Award, Lightbulb, Loader2, CheckCircle2, TrendingUp, Target, Zap, ArrowRight, X, Download } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";

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
    to_change?: string[];
    to_rephrase?: string[];
    to_add?: string[];
    to_learn?: string[];
    general_improvements?: string[]; // fallback
    missing_skills?: string[]; // fallback
  };
}

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const radius = (size / 2) - 6;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circumference - (pct / 100) * circumference;

  const color =
    pct >= 80 ? "hsl(152 100% 45%)" :
      pct >= 60 ? "hsl(72 100% 45%)" :
        "hsl(5 85% 55%)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(265 15% 14%)" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="font-bold tabular-nums leading-none" style={{ color, fontSize: size * 0.25, fontFamily: 'var(--font-display)' }}>
          {Math.round(score)}
        </span>
        <span className="font-mono tracking-widest uppercase mt-0.5" style={{ color: 'hsl(265 8% 45%)', fontSize: size * 0.12 }}>
          ATS
        </span>
      </div>
    </div>
  );
}

  const scoreColor = (s: number) => {
    if (s >= 80) return "hsl(152 100% 45%)";
    if (s >= 60) return "hsl(72 100% 45%)";
    return "hsl(5 85% 55%)";
  };
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
      
      // If raw_text is still null, document is still being processed
      if (!r.data.raw_text) {
        setTimeout(fetchResume, 2000);
      }
    } catch { 
      toast.error("Failed to fetch resume details"); 
    }
  };

  const fetchAnalysis = async () => {
    try {
      const r = await api.get(`/resumes/${resumeId}/analysis`);
      setAnalysis(r.data);
      setPolling(false);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setPolling(true);
        // Analysis not ready, poll again in 3s
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
          <Skeleton className="w-12 h-12 rounded-xl" style={{ background: 'hsl(265 10% 18%)' }} />
          <div className="space-y-2">
            <Skeleton className="h-5 w-56" style={{ background: 'hsl(265 10% 18%)' }} />
            <Skeleton className="h-3 w-32" style={{ background: 'hsl(265 10% 18%)' }} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[680px] rounded-2xl" style={{ background: 'hsl(265 10% 15%)' }} />
          <div className="space-y-5">
            <Skeleton className="h-60 rounded-2xl" style={{ background: 'hsl(265 10% 15%)' }} />
            <Skeleton className="h-72 rounded-2xl" style={{ background: 'hsl(265 10% 15%)' }} />
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

  const handleDownloadPDF = async () => {
    if (!editor) return;
    
    const element = document.querySelector(".tiptap") as HTMLElement;
    if (!element) return;

    try {
      toast.info("Preparing your PDF...");
      // @ts-ignore
      const html2pdf = (await import("html2pdf.js")).default;
      
      const opt = {
        margin: 0,
        filename: `${resume?.file_name.replace(/\.[^/.]+$/, "")}_Optimized.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
      };

      // Temporarily add class for PDF styling
      element.classList.add("pdf-export");
      
      await html2pdf().set(opt).from(element).save();
      
      // Remove the class after generation
      element.classList.remove("pdf-export");
      
      toast.success("Resume downloaded successfully!");
    } catch (err) {
      console.error(err);
      // Ensure class is removed even on error
      element.classList.remove("pdf-export");
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto px-4 py-6">
      {/* Header / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-fade-in-up">
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="w-10 h-10 rounded-xl glass flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <ArrowRight className="w-5 h-5 rotate-180" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'hsl(188 100% 42% / 0.12)', border: '1px solid hsl(188 100% 42% / 0.3)', boxShadow: '0 0 20px hsl(188 100% 42% / 0.1)' }}>
              <FileText className="w-6 h-6" style={{ color: 'hsl(188 100% 42%)' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] uppercase mb-1" style={{ color: 'hsl(265 8% 55%)' }}>
                <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                <span>/</span>
                <span style={{ color: 'hsl(188 100% 42%)' }}>Analysis</span>
              </div>
              <h1 className="text-2xl font-bold text-white truncate max-w-xs md:max-w-xl leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}>
                {resume?.file_name ?? "Loading…"}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end text-right">
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase mb-1.5" style={{ color: 'hsl(265 8% 55%)' }}>
              {polling ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'hsl(188 100% 42%)' }} />
                  <span>Analyzing…</span>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(152 100% 45%)' }} />
                  <span>Complete</span>
                </>
              )}
            </div>
            <p className="text-xs font-medium" style={{ color: 'hsl(265 8% 45%)' }}>
              Last updated today
            </p>
          </div>

          {analysis && !polling && (
            <div className="glass rounded-2xl p-1.5 pr-5 flex items-center gap-4 animate-fade-in ring-1 ring-white/5">
              <ScoreRing score={analysis.ats_score} size={64} />
              <div className="hidden sm:block">
                <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'hsl(265 8% 55%)' }}>ATS Rating</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: scoreColor(analysis.ats_score) }}>
                  {analysis.ats_score >= 80 ? "Premium" : analysis.ats_score >= 60 ? "Strong" : "Needs Polish"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 animate-fade-in-up delay-100">
          <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ height: '680px' }}>
            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b"
              style={{ background: 'hsl(265 15% 10%)', borderColor: 'hsl(265 15% 14%)' }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(25 80% 55% / 0.8)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(72 100% 45% / 0.8)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(152 100% 45% / 0.8)' }} />
                <span className="ml-3 text-xs font-mono" style={{ color: 'hsl(265 8% 45%)' }}>
                  resume-editor.tsx
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/5"
                  style={{ background: 'hsl(0 0% 100% / 0.03)', color: 'hsl(265 8% 55%)' }}>
                  Auto-saving off
                </span>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 glass hover:bg-white/10 active:scale-95 text-white/70 hover:text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
                <button
                  onClick={handleSaveAndAnalyze}
                  disabled={saving || polling}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'hsl(188 100% 42%)',
                    color: 'hsl(265 25% 4%)',
                    boxShadow: '0 0 15px hsl(188 100% 42% / 0.2)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 25px hsl(188 100% 42% / 0.4)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 15px hsl(188 100% 42% / 0.2)'}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      Save & Re-analyze
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6" style={{ background: 'hsl(265 25% 4%)' }}>
              {!resume?.raw_text ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(188 100% 42%)' }} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Processing Document</h4>
                    <p className="text-xs text-white/40 mt-1 max-w-[280px]">
                      Our AI is extracting text and structure from your file. This usually takes 10-20 seconds.
                    </p>
                  </div>
                </div>
              ) : (
                <EditorContent editor={editor} />
              )}
            </div>
          </div>
        </div>

        {/* Analysis panel */}
        <div className="space-y-5 overflow-y-auto" style={{ maxHeight: '680px' }}>
          {polling ? (
            <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'hsl(188 100% 42% / 0.1)', border: '1px solid hsl(188 100% 42% / 0.25)' }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(188 100% 42%)' }} />
              </div>
              <h3 className="text-base font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Analyzing with AI
              </h3>
              <p className="text-sm" style={{ color: 'hsl(265 8% 45%)' }}>
                Extracting skills, experience, and computing your ATS score…
              </p>
              <div className="w-full mt-6 space-y-2">
                {["Parsing structure", "Extracting keywords", "Scoring ATS fit"].map((s, i) => (
                  <div key={s} className="flex items-center gap-2 text-xs" style={{ color: 'hsl(265 8% 40%)' }}>
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
                  <Award className="w-4 h-4" style={{ color: 'hsl(188 100% 42%)' }} />
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
                            <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(265 8% 55%)' }} />
                            <span className="text-xs font-medium" style={{ color: 'hsl(265 8% 70%)' }}>{key}</span>
                          </div>
                          <span className="text-xs font-bold font-mono" style={{ color }}>
                            {Math.round(v)}<span style={{ color: 'hsl(265 8% 40%)' }}>/100</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(265 15% 14%)' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${v}%`, background: color, boxShadow: `0 0 6px ${color}60` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Suggestions */}
              {(analysis.feedback.to_change?.length ||
                analysis.feedback.to_rephrase?.length ||
                analysis.feedback.to_add?.length ||
                analysis.feedback.to_learn?.length ||
                analysis.feedback.general_improvements?.length) && (
                  <div className="glass rounded-2xl p-5 animate-fade-in-up delay-100 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4" style={{ color: 'hsl(72 100% 45%)' }} />
                      <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                        AI Suggestions
                      </h3>
                    </div>

                    {/* TO CHANGE */}
                    {analysis.feedback.to_change && analysis.feedback.to_change.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono tracking-widest uppercase mb-3" style={{ color: 'hsl(5 85% 55%)' }}>
                          Needs Change
                        </p>
                        <ul className="space-y-2">
                          {analysis.feedback.to_change.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs rounded-lg px-3 py-2.5 border border-red-500/10"
                              style={{ background: 'hsl(5 85% 55% / 0.05)', color: 'hsl(265 10% 85%)' }}>
                              <X className="shrink-0 w-3.5 h-3.5 mt-0.5" style={{ color: 'hsl(5 85% 55%)' }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* TO REPHRASE */}
                    {analysis.feedback.to_rephrase && analysis.feedback.to_rephrase.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono tracking-widest uppercase mb-3" style={{ color: 'hsl(72 100% 45%)' }}>
                          Better Phrasing
                        </p>
                        <ul className="space-y-2">
                          {analysis.feedback.to_rephrase.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs rounded-lg px-3 py-2.5 border border-yellow-500/10"
                              style={{ background: 'hsl(72 100% 45% / 0.05)', color: 'hsl(265 10% 85%)' }}>
                              <TrendingUp className="shrink-0 w-3.5 h-3.5 mt-0.5" style={{ color: 'hsl(72 100% 45%)' }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* TO ADD */}
                    {analysis.feedback.to_add && analysis.feedback.to_add.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono tracking-widest uppercase mb-3" style={{ color: 'hsl(188 100% 42%)' }}>
                          Consider Adding
                        </p>
                        <ul className="space-y-2">
                          {analysis.feedback.to_add.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs rounded-lg px-3 py-2.5 border border-cyan-500/10"
                              style={{ background: 'hsl(188 100% 42% / 0.05)', color: 'hsl(265 10% 85%)' }}>
                              <CheckCircle2 className="shrink-0 w-3.5 h-3.5 mt-0.5" style={{ color: 'hsl(188 100% 42%)' }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* TO LEARN */}
                    {analysis.feedback.to_learn && analysis.feedback.to_learn.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono tracking-widest uppercase mb-3" style={{ color: 'hsl(152 100% 45%)' }}>
                          Skills to Learn
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.feedback.to_learn.map((skill, i) => (
                            <span key={i}
                              className="text-[11px] px-2.5 py-1 rounded-full font-medium border"
                              style={{
                                background: 'hsl(152 100% 45% / 0.08)',
                                color: 'hsl(152 100% 45%)',
                                borderColor: 'hsl(152 100% 45% / 0.2)',
                              }}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fallback for old feedback structure */}
                    {!analysis.feedback.to_change && analysis.feedback.general_improvements && (
                      <ul className="space-y-2">
                        {analysis.feedback.general_improvements.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs rounded-lg px-3 py-2.5"
                            style={{ background: 'hsl(265 15% 15%)', color: 'hsl(265 10% 85%)' }}>
                            <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5"
                              style={{ background: 'hsl(72 100% 70% / 0.15)', color: 'hsl(72 100% 70%)' }}>
                              {i + 1}
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
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
