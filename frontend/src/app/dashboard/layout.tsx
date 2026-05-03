"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, Upload, Settings, LogOut, Menu, X, ChevronRight } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/upload", label: "Upload Resume", icon: Upload },
  { href: "#", label: "Settings", icon: Settings, disabled: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: 'hsl(265 10% 10%)' }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:flex
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          width: '240px',
          background: 'hsl(265 10% 12%)',
          borderRight: '1px solid hsl(265 10% 20%)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b" style={{ borderColor: 'hsl(265 10% 20%)' }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'hsl(195 80% 72% / 0.15)', border: '1px solid hsl(195 80% 72% / 0.3)' }}
          >
            <FileText className="w-4 h-4" style={{ color: 'hsl(195 80% 72%)' }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none" style={{ fontFamily: 'var(--font-display)' }}>
              Resume Intel
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'hsl(265 5% 50%)', fontFamily: 'var(--font-mono)' }}>
              AI-powered
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ href, label, icon: Icon, disabled }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={disabled ? "#" : href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                  ${active
                    ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500 pl-[10px]"
                    : disabled
                      ? "opacity-35 cursor-not-allowed text-white/40"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-cyan-400" : ""}`} />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-cyan-400/60" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t" style={{ borderColor: 'hsl(265 10% 20%)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'hsl(265 10% 5% / 0.7)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header
          className="flex items-center gap-4 px-5 h-16 border-b md:hidden"
          style={{ background: 'hsl(265 10% 12%)', borderColor: 'hsl(265 10% 20%)' }}
        >
          <button onClick={() => setSidebarOpen(true)} className="text-white/40 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Resume Intel
          </span>
        </header>

        <main
          className="flex-1 overflow-y-auto relative"
          style={{
            background: `
              radial-gradient(ellipse 60% 40% at 80% 0%, hsl(188 100% 42% / 0.05) 0%, transparent 60%),
              radial-gradient(ellipse 40% 30% at 20% 100%, hsl(280 85% 55% / 0.04) 0%, transparent 50%),
              hsl(265 25% 4%)
            `
          }}
        >
          <div className="px-6 py-8 md:px-10 md:py-10 max-w-[1400px] mx-auto">
            {mounted && children}
          </div>
        </main>
      </div>
    </div>
  );
}
