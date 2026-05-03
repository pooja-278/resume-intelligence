"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Progress } from "@/components/ui/progress";
import { FileText, UploadCloud, X, Loader2, CheckCircle2, ArrowRight, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setErrorMsg(null);
    }
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
    setErrorMsg(null);
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
      const msg = error.response?.data?.detail || "Upload failed. Please try again.";
      setErrorMsg(msg);
      toast.error("Upload failed");
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
        <h1 className="text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Upload Resume
        </h1>
        <p className="text-muted-foreground text-sm mt-1">PDF or DOCX format · Max 5 MB</p>
      </div>

      {errorMsg && (
        <Alert variant="destructive" className="animate-fade-in border-red-500/20 bg-red-500/10 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload Error</AlertTitle>
          <AlertDescription>
            {errorMsg}
          </AlertDescription>
        </Alert>
      )}

      {/* Drop zone or file preview */}
      <div className="glass rounded-2xl overflow-hidden animate-fade-in-up delay-100">
        {!file ? (
          <div
            {...getRootProps()}
            className={`relative flex flex-col items-center justify-center p-16 text-center cursor-pointer transition-all duration-200 rounded-2xl
              ${isDragActive ? "bg-primary/5 shadow-[inset_0_0_0_2px_theme(colors.primary.DEFAULT/40%)]" : "hover:bg-accent/50"}`}
          >
            <input {...getInputProps()} />

            {/* Animated upload icon */}
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 border-2 border-dashed
              ${isDragActive ? "scale-110 bg-primary/10 border-primary/60 shadow-[0_0_30px_theme(colors.primary.DEFAULT/20%)]" : "bg-muted border-border"}`}
              >
              <UploadCloud className={`w-9 h-9 transition-colors ${isDragActive ? "animate-bounce text-primary" : "text-muted-foreground/50"}`} />
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {isDragActive ? "Release to upload" : "Drag & drop your resume"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              or <span className="underline underline-offset-2 text-foreground/70 cursor-pointer">browse your files</span>
            </p>

            <div className="flex items-center gap-6 text-xs text-muted-foreground/50 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400">PDF</span>
                Supported
              </span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">DOC</span>
                Supported
              </span>
              <span className="w-px h-3 bg-border" />
              <span>Max 5 MB</span>
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-8">
            {/* File info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative bg-primary/10 border border-primary/20">
                <FileText className="w-6 h-6 text-primary" />
                <span className="absolute -bottom-1.5 -right-1.5 text-[8px] font-mono font-bold px-1 rounded leading-none py-0.5 bg-primary text-primary-foreground">
                  {fileExt}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs mt-0.5 text-muted-foreground">{fileSizeMB} MB</p>
              </div>
              {!uploading && (
                <button onClick={() => setFile(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-accent text-muted-foreground/50 hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground/60 font-mono text-xs tracking-wider uppercase">
                      {done ? "Complete" : "Processing…"}
                    </span>
                    <span className="font-bold tabular-nums text-sm text-primary font-mono">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                    <Progress value={progress} className="h-1.5 bg-transparent" />
                  </div>
                </div>

                <div className="space-y-2">
                  {stages.map(({ label, done: stageDone }) => (
                    <div key={label} className="flex items-center gap-3 text-sm">
                      <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                        {stageDone ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                        )}
                      </div>
                      <span className={stageDone ? 'text-foreground/80' : 'text-muted-foreground/50'}>
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
                className="w-full h-[52px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 group bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
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
            <p className="text-sm font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{label}</p>
            <p className="text-xs mt-1 text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
