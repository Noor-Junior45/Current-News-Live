import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, CircleDot } from 'lucide-react';

export default function ScrollHelper() {
  const [isVisible, setIsVisible] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Show the scroll bar helper when scrolled past a certain amount
  useEffect(() => {
    let activityTimer: NodeJS.Timeout;

    const handleUserActivity = () => {
      setIsActive(true);
      clearTimeout(activityTimer);
      // Wait exactly 1 second (1000ms) of inactivity before hiding
      activityTimer = setTimeout(() => {
        setIsActive(false);
      }, 1000);
    };

    const toggleVisibility = () => {
      if (window.scrollY > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      handleUserActivity();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', toggleVisibility, { passive: true });
      window.addEventListener('mousemove', handleUserActivity, { passive: true });
      window.addEventListener('touchstart', handleUserActivity, { passive: true });
      window.addEventListener('keydown', handleUserActivity, { passive: true });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', toggleVisibility);
        window.removeEventListener('mousemove', handleUserActivity);
        window.removeEventListener('touchstart', handleUserActivity);
        window.removeEventListener('keydown', handleUserActivity);
      }
      clearTimeout(activityTimer);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToMiddle = () => {
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const middlePosition = (documentHeight - windowHeight) / 2;
    window.scrollTo({
      top: middlePosition,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-24 right-5 sm:right-7 z-50 flex flex-col items-center gap-1.5 p-2 rounded-full bg-white/20 dark:bg-slate-950/20 backdrop-blur-xl border border-white/30 dark:border-slate-800/30 shadow-2xl transition-all duration-500 hover:scale-105 group ${
        isActive 
          ? "opacity-100 scale-100 translate-y-0" 
          : "opacity-0 scale-75 translate-y-4 pointer-events-none"
      }`}
      id="samsung-scroll-helper"
    >
      {/* Scroll to Top Trigger */}
      <button
        onClick={scrollToTop}
        className="p-2 text-slate-800 dark:text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-full transition-all duration-200 cursor-pointer text-center"
        title="Scroll to Top"
        id="scroll-to-top-btn"
      >
        <ChevronUp className="h-4.5 w-4.5" />
      </button>

      {/* Middle Scroll Snap Dot Element */}
      <button
        onClick={scrollToMiddle}
        className="p-2 text-slate-800 dark:text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-full transition-all duration-200 cursor-pointer text-center"
        title="Scroll to Middle of Page"
        id="scroll-to-middle-btn"
      >
        <CircleDot className="h-4 w-4 text-indigo-500 animate-pulse" />
      </button>

      {/* Scroll to Bottom Trigger */}
      <button
        onClick={scrollToBottom}
        className="p-2 text-slate-800 dark:text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-full transition-all duration-200 cursor-pointer text-center"
        title="Scroll to Bottom"
        id="scroll-to-bottom-btn"
      >
        <ChevronDown className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
