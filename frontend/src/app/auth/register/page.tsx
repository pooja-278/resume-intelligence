"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Fair", "Strong"][passwordStrength];
  const strengthColor = ["", "bg-red-500", "bg-amber-400", "bg-primary"][passwordStrength];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/register", { email, password });
      toast.success("Account created! Please sign in.");
      router.push("/auth/login");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-8 animate-fade-in-up delay-100">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          Create account
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Start analyzing your resumes today</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-muted-foreground text-xs uppercase tracking-widest font-mono">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary/50 transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-muted-foreground text-xs uppercase tracking-widest font-mono">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 bg-muted/30 border-border text-foreground rounded-xl pr-12 focus:border-primary/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground/60 transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColor : "bg-muted"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{strengthLabel} password</p>
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="space-y-2 pt-1">
          {["AI-powered ATS scoring", "Detailed feedback & suggestions", "Resume content editor"].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-muted-foreground/70 text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary/70 shrink-0" />
              {benefit}
            </div>
          ))}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl transition-all duration-200 glow-teal group"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Create account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
