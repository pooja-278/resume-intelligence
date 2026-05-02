"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Progress } from "@/components/ui/progress";
import { FileText, UploadCloud, X, Loader2, CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0]?.message;
      toast.error(`File rejected: ${error}`);
    },
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(10);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 85 ? 85 : prev + 10));
      }, 500);
      const response = await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      clearInterval(interval);
      setProgress(100);
      setDone(true);
      toast.success("Resume uploaded and queued for analysis!");
      setTimeout(() => router.push(`/dashboard/resume/${response.data.id}`), 900);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Upload failed. Please try again.");
      setUploading(false);
      setProgress(0);
    }
  };

  const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(2) : null;
  const fileExt = file ? file.name.split('.').pop()?.toUpperCase() : null;

  const stages = [
    { label: "Parsing document", done: progress >= 30 },
    { label: "Extracting text & structure", done: progress >= 55 },
    { label: "Running AI analysis", done: progress >= 80 },
    { label: "Generating ATS score", done: progress >= 100 },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono tracking-widest uppercase px-2 py-0.5 rounded-full border"
            style={{ color: 'oklch(0.72 0.18 195)', borderColor: 'oklch(0.72 0.18 195 / 0.3)', background: 'oklch(0.72 0.18 195 / 0.08)' }}>
            Upload
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Upload Resume
        </h1>
        <p className="text-white/40 text-sm mt-1">PDF or DOCX format · Max 5 MB</p>
      </div>

      {/* Drop zone or file preview */}
      <div className="glass rounded-2xl overflow-hidden animate-fade-in-up delay-100">
        {!file ? (
          <div
            {...getRootProps()}
            className={`relative flex flex-col items-center justify-center p-16 text-center cursor-pointer transition-all duration-200 rounded-2xl
              ${isDragActive ? "" : "hover:bg-white/[0.02]"}`}
            style={isDragActive ? { background: 'oklch(0.72 0.18 195 / 0.06)', boxShadow: 'inset 0 0 0 2px oklch(0.72 0.18 195 / 0.4)' } : {}}
          >
            <input {...getInputProps()} />

            {/* Animated upload icon */}
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300
              ${isDragActive ? "scale-110" : ""}`}
              style={{
                background: isDragActive ? 'oklch(0.72 0.18 195 / 0.15)' : 'oklch(0.18 0.010 265)',
                border: `2px dashed ${isDragActive ? 'oklch(0.72 0.18 195 / 0.6)' : 'oklch(0.30 0.010 265)'}`,
                boxShadow: isDragActive ? '0 0 30px oklch(0.72 0.18 195 / 0.2)' : 'none'
              }}>
              <UploadCloud className={`w-9 h-9 transition-colors ${isDragActive ? "animate-bounce" : ""}`}
                style={{ color: isDragActive ? 'oklch(0.72 0.18 195)' : 'oklch(0.45 0.015 265)' }} />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {isDragActive ? "Release to upload" : "Drag & drop your resume"}
            </h3>
            <p className="text-sm text-white/30 mb-6">
              or <span className="underline underline-offset-2 text-white/50 cursor-pointer">browse your files</span>
            </p>

            <div className="flex items-center gap-6 text-xs text-white/25 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                  style={{ background: 'oklch(0.55 0.22 25 / 0.2)', color: 'oklch(0.65 0.20 25)' }}>PDF</span>
                Supported
              </span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                  style={{ background: 'oklch(0.55 0.20 200 / 0.2)', color: 'oklch(0.65 0.18 200)' }}>DOC</span>
                Supported
              </span>
              <span className="w-px h-3 bg-white/10" />
              <span>Max 5 MB</span>
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-8">
            {/* File info */}
            <div className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: 'oklch(0.16 0.010 265)', border: '1px solid oklch(0.25 0.010 265)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative"
                style={{ background: 'oklch(0.72 0.18 195 / 0.1)', border: '1px solid oklch(0.72 0.18 195 / 0.25)' }}>
                <FileText className="w-6 h-6" style={{ color: 'oklch(0.72 0.18 195)' }} />
                <span className="absolute -bottom-1.5 -right-1.5 text-[8px] font-mono font-bold px-1 rounded leading-none py-0.5"
                  style={{ background: 'oklch(0.72 0.18 195)', color: 'oklch(0.10 0.008 265)' }}>
                  {fileExt}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white truncate">{file.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'oklch(0.50 0.015 265)' }}>{fileSizeMB} MB</p>
              </div>
              {!uploading && (
                <button onClick={() => setFile(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 text-white/30 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50 font-mono text-xs tracking-wider uppercase">
                      {done ? "Complete" : "Processing…"}
                    </span>
                    <span className="font-bold tabular-nums text-sm" style={{ color: 'oklch(0.72 0.18 195)', fontFamily: 'var(--font-mono)' }}>
                      {progress}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.20 0.010 265)' }}>
                    <Progress value={progress} className="h-1.5 bg-transparent" />
                  </div>
                </div>

                <div className="space-y-2">
                  {stages.map(({ label, done: stageDone }) => (
                    <div key={label} className="flex items-center gap-3 text-sm">
                      <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                        {stageDone ? (
                          <CheckCircle2 className="w-4 h-4" style={{ color: 'oklch(0.75 0.18 152)' }} />
                        ) : (
                          <div className="w-3 h-3 rounded-full" style={{ background: 'oklch(0.28 0.010 265)' }} />
                        )}
                      </div>
                      <span style={{ color: stageDone ? 'oklch(0.75 0.015 265)' : 'oklch(0.40 0.010 265)' }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action button */}
            {!uploading && (
              <button
                onClick={handleUpload}
                className="w-full h-13 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 group"
                style={{
                  background: 'oklch(0.72 0.18 195)',
                  color: 'oklch(0.10 0.008 265)',
                  height: '52px',
                  boxShadow: '0 0 20px oklch(0.72 0.18 195 / 0.25)'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'oklch(0.78 0.18 195)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px oklch(0.72 0.18 195 / 0.4)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'oklch(0.72 0.18 195)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px oklch(0.72 0.18 195 / 0.25)';
                }}
              >
                <Zap className="w-4 h-4" />
                Analyze with AI
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4 animate-fade-in-up delay-200">
        {[
          { label: "ATS Score", desc: "Compatibility rating 0–100" },
          { label: "Skill Gaps", desc: "Missing keywords detected" },
          { label: "Feedback", desc: "Actionable improvement tips" },
        ].map(({ label, desc }) => (
          <div key={label} className="glass rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>{label}</p>
            <p className="text-xs mt-1 text-white/30 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
