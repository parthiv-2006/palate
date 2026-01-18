'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Keyboard shortcut hints overlay
 * Press '?' to toggle visibility
 */
export function KeyboardHints({ 
  shortcuts = [],
  enabled = true,
}) {
  const [isVisible, setIsVisible] = useState(false);

  const defaultShortcuts = [
    { key: '?', description: 'Toggle this help menu' },
    { key: 'Esc', description: 'Close dialogs' },
  ];

  const allShortcuts = [...defaultShortcuts, ...shortcuts];

  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;
    
    // Toggle with ? key
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      setIsVisible(v => !v);
    }
    
    // Close with Escape
    if (e.key === 'Escape' && isVisible) {
      setIsVisible(false);
    }
  }, [enabled, isVisible]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!enabled) return null;

  return (
    <>
      {/* Hint badge in corner */}
      <motion.button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 
                   flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Keyboard shortcuts (?)"
      >
        <span className="text-lg font-mono">?</span>
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsVisible(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-3xl p-8 max-w-md w-full border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-2xl">⌨️</span>
                  Keyboard Shortcuts
                </h2>
                <button
                  onClick={() => setIsVisible(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {allShortcuts.map((shortcut, i) => (
                  <motion.div
                    key={shortcut.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  >
                    <span className="text-white/70">{shortcut.description}</span>
                    <kbd className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-mono text-sm">
                      {shortcut.key}
                    </kbd>
                  </motion.div>
                ))}
              </div>

              <p className="text-white/30 text-xs text-center mt-6">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-xs">?</kbd> anytime to toggle this menu
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Swipe gesture hints for matching page
 */
export function SwipeHints({ show = true, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    if (show && !dismissed) {
      const timer = setTimeout(() => {
        setDismissed(true);
        onDismiss?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, dismissed, onDismiss]);

  if (!show || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="glass-card rounded-2xl px-6 py-4 border border-white/20 flex items-center gap-6">
        {/* Left swipe hint */}
        <div className="flex items-center gap-2 text-white/60">
          <motion.div
            animate={{ x: [-5, 0, -5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
          >
            👈
          </motion.div>
          <div className="text-center">
            <div className="text-red-400 font-bold text-sm">Nope</div>
            <kbd className="text-xs text-white/40 font-mono">← or A</kbd>
          </div>
        </div>

        <div className="w-px h-8 bg-white/20" />

        {/* Right swipe hint */}
        <div className="flex items-center gap-2 text-white/60">
          <div className="text-center">
            <div className="text-green-400 font-bold text-sm">Like</div>
            <kbd className="text-xs text-white/40 font-mono">→ or D</kbd>
          </div>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
          >
            👉
          </motion.div>
        </div>
      </div>

      <button
        onClick={() => {
          setDismissed(true);
          onDismiss?.();
        }}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white/60 hover:text-white transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

/**
 * First-time user tooltip
 */
export function FirstTimeTooltip({
  show = false,
  position = 'bottom',
  children,
  onDismiss,
}) {
  const positions = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`absolute ${positions[position]} z-50`}
    >
      <div className="bg-gradient-to-r from-[#ff6b35] to-[#f72585] rounded-xl px-4 py-2 text-white text-sm font-medium shadow-lg">
        {children}
        <button
          onClick={onDismiss}
          className="ml-2 text-white/70 hover:text-white"
        >
          Got it
        </button>
      </div>
      {/* Arrow */}
      <div className={`absolute w-3 h-3 bg-[#ff6b35] transform rotate-45 ${
        position === 'bottom' ? '-top-1.5 left-1/2 -translate-x-1/2' :
        position === 'top' ? '-bottom-1.5 left-1/2 -translate-x-1/2' :
        position === 'left' ? '-right-1.5 top-1/2 -translate-y-1/2' :
        '-left-1.5 top-1/2 -translate-y-1/2'
      }`} />
    </motion.div>
  );
}

export default KeyboardHints;
