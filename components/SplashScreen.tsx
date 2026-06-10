"use client";

import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-black overflow-hidden flex items-center justify-center"
        >
          {/* 
            Using a standard img tag for the splash to avoid any Next.js Image overhead 
            and ensure it shows up immediately. object-cover ensures it fills the screen.
          */}
          <motion.img
            src="/splash.gif"
            alt="Momo"
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
