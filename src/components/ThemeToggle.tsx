import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check initial preference from localStorage or documentElement
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) {
        return saved === 'dark';
      }
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const [isActive, setIsActive] = useState<boolean>(true);

  // Monitor user movement & interactions to handle auto-hiding
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const handleUserActivity = () => {
      setIsActive(true);
      clearTimeout(idleTimer);
      // Wait 3 seconds of inactivity before hiding the theme toggle
      idleTimer = setTimeout(() => {
        setIsActive(false);
      }, 3000);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleUserActivity, { passive: true });
      window.addEventListener('scroll', handleUserActivity, { passive: true });
      window.addEventListener('keydown', handleUserActivity, { passive: true });
      window.addEventListener('touchstart', handleUserActivity, { passive: true });
      
      // Initial trigger to start the timer
      handleUserActivity();
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleUserActivity);
        window.removeEventListener('scroll', handleUserActivity);
        window.removeEventListener('keydown', handleUserActivity);
        window.removeEventListener('touchstart', handleUserActivity);
      }
      clearTimeout(idleTimer);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(prev => !prev)}
      className={`fixed bottom-6 right-6 z-50 p-4 rounded-full transition-all duration-500 flex items-center justify-center border backdrop-blur-xl hover:scale-110 active:scale-95 cursor-pointer ${
        isActive 
          ? "opacity-100 scale-100 translate-y-0" 
          : "opacity-0 scale-75 translate-y-4 pointer-events-none"
      } ${
        isDark 
          ? "bg-slate-900/60 border-slate-700/40 text-slate-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_12px_24px_-4px_rgba(0,0,0,0.6)]" 
          : "bg-amber-100/70 border-amber-300/50 text-amber-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_12px_24px_-4px_rgba(245,158,11,0.2)]"
      }`}
      id="floating-theme-toggle"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        // User in dark mode: Show soft-white moon with glow
        <Moon className="h-5 w-5 text-white fill-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
      ) : (
        // User in light mode: Show light-yellow/orange sun
        <Sun className="h-5 w-5 text-amber-500 animate-spin-slow drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
      )}
    </button>
  );
}
