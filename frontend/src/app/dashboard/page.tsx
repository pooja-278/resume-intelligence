"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import api from "@/lib/api";

interface Resume {
  id: number;
  file_name: string;
}

export default function DashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchResumes(); }, []);

  const fetchResumes = async () => {
    try {
      const response = await api.get("/resumes/");
      setResumes(response.data);
    } catch (error) {
      console.error("Failed to fetch resumes", error);
    } finally {
      setLoading(false);
    }
  };

  const getFileExt = (name: string) => name.split('.').pop()?.toUpperCase() ?? 'FILE';

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono tracking-widest uppercase px-2 py-0.5 rounded-full border" 
              style={{ color: 'oklch(0.72 0.18 195)', borderColor: 'oklch(0.72 0.18 195 / 0.3)', background: 'oklch(0.72 0.18 195 / 0.08)' }}>
              Dashboard
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Your Resumes
          </h1>
          <p className="text-white/40 mt-1 text-sm">
            {resumes.length > 0 ? `${resumes.length} resume${resumes.length > 1 ? 's' : ''} ready for analysis` : 'Upload your first resume to get started'}
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button
            className="h-10 px-5 font-semibold rounded-xl flex items-center gap-2 transition-all duration-200"
            style={{ background: 'oklch(0.72 0.18 195)', color: 'oklch(0.10 0.008 265)' }}
          >
            <Plus className="w-4 h-4" /> New Resume
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      {!loading && resumes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-in-up delay-100">
          {[
            { label: "Total Resumes", value: resumes.length, icon: FileText, color: 'oklch(0.72 0.18 195)' },
            { label: "Analyzed", value: resumes.length, icon: Sparkles, color: 'oklch(0.75 0.18 152)' },
            { label: "Improvements", value: resumes.length * 3, icon: TrendingUp, color: 'oklch(0.78 0.18 72)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
                <p className="text-xs text-white/40">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl h-44 overflow-hidden relative">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <div className="glass rounded-2xl border-dashed animate-fade-in" style={{ borderStyle: 'dashed', borderColor: 'oklch(0.30 0.010 265)' }}>
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 animate-float"
              style={{ background: 'oklch(0.72 0.18 195 / 0.08)', border: '1px solid oklch(0.72 0.18 195 / 0.2)' }}>
              <FileText className="w-9 h-9" style={{ color: 'oklch(0.72 0.18 195)' }} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>No resumes yet</h3>
            <p className="text-white/40 text-sm max-w-xs mb-8 leading-relaxed">
              Upload your resume to receive an instant AI-powered ATS score with actionable feedback.
            </p>
            <Link href="/dashboard/upload">
              <Button className="h-11 px-6 rounded-xl font-semibold"
                style={{ background: 'oklch(0.72 0.18 195)', color: 'oklch(0.10 0.008 265)' }}>
                <Plus className="w-4 h-4 mr-2" /> Upload your first resume
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {resumes.map((resume, i) => {
            const ext = getFileExt(resume.file_name);
            const baseName = resume.file_name.replace(/\.[^/.]+$/, "");
            return (
              <div
                key={resume.id}
                className="glass rounded-xl p-5 card-hover group animate-fade-in-up cursor-pointer"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative"
                    style={{ background: 'oklch(0.72 0.18 195 / 0.1)', border: '1px solid oklch(0.72 0.18 195 / 0.25)' }}>
                    <FileText className="w-5 h-5" style={{ color: 'oklch(0.72 0.18 195)' }} />
                    <span className="absolute -bottom-1.5 -right-1.5 text-[8px] font-mono font-bold px-1 py-0.5 rounded"
                      style={{ background: 'oklch(0.72 0.18 195)', color: 'oklch(0.10 0.008 265)', lineHeight: 1 }}>
                      {ext}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white truncate text-sm" title={baseName}>{baseName}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 265)' }}>Ready for analysis</p>
                  </div>
                </div>

                <div className="h-px mb-5" style={{ background: 'oklch(0.22 0.010 265)' }} />

                <Link href={`/dashboard/resume/${resume.id}`}>
                  <button className="w-full flex items-center justify-between text-sm font-medium transition-all duration-150 group/btn"
                    style={{ color: 'oklch(0.55 0.015 265)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'oklch(0.72 0.18 195)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'oklch(0.55 0.015 265)')}>
                    <span>View Analysis</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            );
          })}

          {/* Add new card */}
          <Link href="/dashboard/upload">
            <div className="rounded-xl p-5 flex flex-col items-center justify-center gap-3 h-full min-h-[160px] cursor-pointer transition-all duration-200 hover:border-cyan-500/30 border-dashed"
              style={{ border: '2px dashed oklch(0.25 0.010 265)', background: 'oklch(0.13 0.008 265 / 0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'oklch(0.72 0.18 195 / 0.4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'oklch(0.25 0.010 265)')}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'oklch(0.72 0.18 195 / 0.08)', border: '1px solid oklch(0.72 0.18 195 / 0.2)' }}>
                <Plus className="w-5 h-5" style={{ color: 'oklch(0.72 0.18 195)' }} />
              </div>
              <p className="text-xs font-medium" style={{ color: 'oklch(0.50 0.015 265)' }}>Add new resume</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
