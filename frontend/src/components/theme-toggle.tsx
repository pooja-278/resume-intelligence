"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 animate-pulse" />
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="group relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
      style={{
        background: 'var(--secondary)',
        borderColor: 'var(--border)',
      }}
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative w-5 h-5 flex items-center justify-center">
        {theme === "dark" ? (
          <Moon className="h-5 w-5 transition-all duration-500 text-primary animate-in zoom-in rotate-0" />
        ) : (
          <Sun className="h-5 w-5 transition-all duration-500 text-primary animate-in zoom-in rotate-0" />
        )}
      </div>

      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
