"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText, ArrowRight, Sparkles, TrendingUp, Trash2, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Resume {
  id: number;
  file_name: string;
}

export default function DashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this resume?")) return;
    
    setDeletingId(id);
    try {
      await api.delete(`/resumes/${id}`);
      setResumes(prev => prev.filter(r => r.id !== id));
      toast.success("Resume deleted successfully");
    } catch (error) {
      toast.error("Failed to delete resume");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const getFileExt = (name: string) => name.split('.').pop()?.toUpperCase() ?? 'FILE';

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono tracking-widest uppercase px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary">
              Dashboard
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Your Resumes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {resumes.length > 0 ? `${resumes.length} resume${resumes.length > 1 ? 's' : ''} ready for analysis` : 'Upload your first resume to get started'}
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button
            className="h-10 px-5 font-semibold rounded-xl flex items-center gap-2 transition-all duration-200 bg-primary text-primary-foreground"
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
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-primary/20 bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
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
        <div className="glass rounded-2xl border-dashed animate-fade-in border-border" style={{ borderStyle: 'dashed' }}>
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 animate-float border border-primary/20 bg-primary/10">
              <FileText className="w-9 h-9 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>No resumes yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-8 leading-relaxed">
              Upload your resume to receive an instant AI-powered ATS score with actionable feedback.
            </p>
            <Link href="/dashboard/upload">
              <Button className="h-11 px-6 rounded-xl font-semibold bg-primary text-primary-foreground">
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
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative bg-primary/10 border border-primary/20">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="absolute -bottom-1.5 -right-1.5 text-[8px] font-mono font-bold px-1 py-0.5 rounded bg-primary text-primary-foreground"
                      style={{ lineHeight: 1 }}>
                      {ext}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate text-sm" title={baseName}>{baseName}</h3>
                    <p className="text-xs mt-0.5 text-muted-foreground">Ready for analysis</p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, resume.id)}
                    disabled={deletingId === resume.id}
                    className="p-2 rounded-lg transition-all duration-200 hover:bg-destructive/10 group/trash"
                    title="Delete resume"
                  >
                    {deletingId === resume.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-destructive" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-muted-foreground/30 group-hover/trash:text-destructive" />
                    )}
                  </button>
                </div>

                <div className="h-px mb-5 bg-border" />

                <Link href={`/dashboard/resume/${resume.id}`}>
                  <button className="w-full flex items-center justify-between text-sm font-medium transition-all duration-150 group/btn text-muted-foreground hover:text-primary">
                    <span>View Analysis</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            );
          })}

          {/* Add new card */}
          <Link href="/dashboard/upload">
            <div className="rounded-xl p-5 flex flex-col items-center justify-center gap-3 h-full min-h-[160px] cursor-pointer transition-all duration-200 hover:border-primary/30 border-dashed border-2 border-border bg-muted/20 hover:bg-muted/40">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">Add new resume</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
