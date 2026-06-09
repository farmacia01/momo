"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { RefreshCw } from "lucide-react";

const PULL_THRESHOLD = 80;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAtTop, setIsAtTop] = useState(true);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY <= 5);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing || !isAtTop) return;
    startY.current = e.touches[0].pageY;
    pulling.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling.current || isRefreshing || !isAtTop) return;
    
    const currentY = e.touches[0].pageY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Apply resistance
      const distance = Math.min(diff * 0.4, PULL_THRESHOLD + 20);
      setPullDistance(distance);
      
      // Prevent default scroll when pulling down at the top
      if (diff > 10 && e.cancelable) {
        // e.preventDefault(); // Can't prevent default in passive listener, but we are in React event
      }
    } else {
      setPullDistance(0);
      pulling.current = false;
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling.current || isRefreshing) return;
    pulling.current = false;

    if (pullDistance > PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(40);
      
      router.refresh();
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      setIsRefreshing(false);
      setPullDistance(0);
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div 
      className="relative w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Indicator */}
      <m.div
        className="fixed top-4 left-0 right-0 flex justify-center pointer-events-none z-[100]"
        style={{ 
          y: pullDistance - 60,
          opacity: Math.min(1, pullDistance / 40)
        }}
        animate={isRefreshing ? { y: 20, opacity: 1 } : {}}
      >
        <div className="bg-surface rounded-full p-2 shadow-xl border border-surface-border flex items-center justify-center">
          <m.div
            animate={isRefreshing ? { rotate: 360 } : { rotate: pullDistance * 4 }}
            transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: "tween" }}
          >
            <RefreshCw size={18} className="text-ember" strokeWidth={3} />
          </m.div>
        </div>
      </m.div>

      {/* Main content - moves down when pulled */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pulling.current ? "none" : "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          willChange: pullDistance > 0 ? "transform" : "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
