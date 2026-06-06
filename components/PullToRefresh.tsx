"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { RefreshCw } from "lucide-react";

const PULL_THRESHOLD = 80;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);

  function onTouchStart(e: React.TouchEvent) {
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startYRef.current === null || isRefreshing) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0 && window.scrollY === 0) {
      pullingRef.current = true;
      setPullDistance(Math.min(delta * 0.4, PULL_THRESHOLD + 20));
    } else {
      startYRef.current = null;
      setPullDistance(0);
    }
  }

  async function onTouchEnd() {
    if (pullingRef.current && pullDistance > PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(40);
      router.refresh();
      await new Promise((r) => setTimeout(r, 800));
      setIsRefreshing(false);
    }
    setPullDistance(0);
    startYRef.current = null;
    pullingRef.current = false;
  }

  return (
    <div
      className="relative overflow-visible"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Indicador de refresh */}
      <m.div
        className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-50"
        style={{
          y: pullDistance - 50,
          opacity: Math.min(1, pullDistance / 40),
        }}
        animate={isRefreshing ? { y: 20, opacity: 1 } : {}}
      >
        <div className="bg-white rounded-full p-2 shadow-xl border border-slate-100">
          <m.div
            animate={isRefreshing ? { rotate: 360 } : { rotate: pullDistance * 3 }}
            transition={
              isRefreshing
                ? { repeat: Infinity, duration: 1, ease: "linear" }
                : { type: "tween" }
            }
          >
            <RefreshCw size={18} className="text-forest" strokeWidth={3} />
          </m.div>
        </div>
      </m.div>

      {/* Wrapper sem drag — scroll nativo preservado */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? "transform 0.3s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
