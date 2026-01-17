'use client';

import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

/**
 * Confetti celebration effect component
 * Triggers confetti animation when `trigger` prop changes to true
 */
export function Confetti({ trigger, type = 'celebration' }) {
  const fireConfetti = useCallback(() => {
    if (type === 'celebration') {
      // Big celebration burst
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#ff6b35', '#f72585', '#7209b7', '#4cc9f0', '#ffd60a'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#ff6b35', '#f72585', '#7209b7', '#4cc9f0', '#ffd60a'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      // Initial big burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff6b35', '#f72585', '#7209b7', '#4cc9f0', '#ffd60a'],
      });

      frame();
    } else if (type === 'burst') {
      // Quick burst for smaller celebrations
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ff6b35', '#f72585', '#7209b7', '#4cc9f0'],
      });
    } else if (type === 'emoji') {
      // Emoji confetti
      const emojis = ['🍕', '🍣', '🌮', '🍔', '🎉', '✨'];
      confetti({
        particleCount: 30,
        spread: 100,
        origin: { y: 0.6 },
        shapes: ['circle'],
        colors: ['#ff6b35', '#f72585', '#7209b7'],
      });
    }
  }, [type]);

  useEffect(() => {
    if (trigger) {
      fireConfetti();
    }
  }, [trigger, fireConfetti]);

  return null; // This component doesn't render anything
}

/**
 * Hook to manually trigger confetti
 */
export function useConfetti() {
  const fire = useCallback((options = {}) => {
    const {
      particleCount = 100,
      spread = 70,
      origin = { y: 0.6 },
      colors = ['#ff6b35', '#f72585', '#7209b7', '#4cc9f0', '#ffd60a'],
    } = options;

    confetti({
      particleCount,
      spread,
      origin,
      colors,
    });
  }, []);

  const fireCelebration = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#ff6b35', '#f72585', '#7209b7', '#4cc9f0', '#ffd60a'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#ff6b35', '#f72585', '#7209b7', '#4cc9f0', '#ffd60a'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff6b35', '#f72585', '#7209b7', '#4cc9f0', '#ffd60a'],
    });

    frame();
  }, []);

  return { fire, fireCelebration };
}

export default Confetti;
