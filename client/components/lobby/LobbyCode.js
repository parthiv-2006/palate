'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export function LobbyCode({ code, onJoin }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.toString());
      setCopied(true);
      toast.success('Code copied!', { 
        icon: '📋',
        duration: 2000,
      });
      
      // Reset after animation
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  // Display mode (code provided)
  if (code) {
    return (
      <div className="text-center">
        <p className="text-sm text-white/50 mb-4 font-medium">Lobby Code</p>
        
        {/* Code Display with copy functionality */}
        <motion.button
          onClick={handleCopy}
          className="relative group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex gap-2 justify-center mb-3">
            {code.toString().split('').map((digit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`
                  w-12 h-14 md:w-14 md:h-16 
                  bg-gradient-to-br from-[#ff6b35] to-[#f72585] 
                  text-white text-2xl md:text-3xl font-bold 
                  rounded-xl flex items-center justify-center 
                  shadow-lg shadow-[#ff6b35]/20
                  transition-transform duration-200
                  group-hover:shadow-[#ff6b35]/40
                  ${copied ? 'scale-95' : ''}
                `}
              >
                {digit}
              </motion.div>
            ))}
          </div>
          
          {/* Copy indicator */}
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="copied"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center justify-center gap-2 text-[#4cc9f0]"
              >
                <motion.svg 
                  className="w-5 h-5"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </motion.svg>
                <span className="text-sm font-medium">Copied!</span>
              </motion.div>
            ) : (
              <motion.div
                key="tap-to-copy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 text-white/40 group-hover:text-white/60 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-xs">Tap to copy</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        
        <p className="text-xs text-white/30 mt-4">Share this code with your friends</p>
      </div>
    );
  }

  // Entry mode (joining lobby)
  const handleDigitChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      setTimeout(() => {
        document.getElementById(`digit-${index + 1}`)?.focus();
      }, 10);
    }

    // Auto-submit when all digits entered
    if (newDigits.every(d => d !== '') && newDigits.join('').length === 6) {
      handleJoin(newDigits.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      document.getElementById(`digit-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newDigits = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      setDigits(newDigits);
      
      if (pastedData.length === 6) {
        handleJoin(pastedData);
      }
    }
  };

  const handleJoin = async (joinCode) => {
    if (onJoin) {
      await onJoin(joinCode);
    } else {
      router.push(`/lobby/${joinCode}/room`);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-white/60 font-semibold">Enter Lobby Code</p>
      <div className="flex gap-2 justify-center">
        {digits.map((digit, i) => (
          <motion.input
            key={i}
            id={`digit-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileFocus={{ scale: 1.05 }}
            className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl md:text-3xl font-bold 
                       bg-white/5 border-2 border-white/20 rounded-xl 
                       text-white placeholder:text-white/20
                       focus:border-[#ff6b35] focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/30 
                       focus:bg-white/10 transition-all"
            autoComplete="off"
          />
        ))}
      </div>
      <p className="text-center text-white/30 text-xs">Paste or type the 6-digit code</p>
    </div>
  );
}
