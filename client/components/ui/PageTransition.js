'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

/**
 * Page transition wrapper component
 * Wrap page content for smooth fade/slide transitions
 */

const variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
  slideInFromBottom: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
  },
};

export function PageTransition({ 
  children, 
  variant = 'slideUp',
  duration = 0.3,
  delay = 0,
  className = '',
}) {
  const selectedVariant = variants[variant] || variants.slideUp;

  return (
    <motion.div
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      exit={selectedVariant.exit}
      transition={{ 
        duration, 
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Smooth easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered children animation - animate children one after another
 */
export function StaggerContainer({ 
  children, 
  staggerDelay = 0.1,
  className = '',
}) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      className={className}
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger item - use inside StaggerContainer
 */
export function StaggerItem({ 
  children, 
  variant = 'slideUp',
  className = '',
}) {
  const itemVariants = {
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
    },
  };

  return (
    <motion.div
      variants={itemVariants[variant] || itemVariants.slideUp}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated card with hover effects
 */
export function AnimatedCard({ 
  children, 
  className = '',
  onClick,
  whileHover = { scale: 1.02 },
  whileTap = { scale: 0.98 },
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={whileHover}
      whileTap={onClick ? whileTap : undefined}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={className}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Float animation - gentle up/down movement
 */
export function FloatAnimation({ 
  children, 
  className = '',
  duration = 3,
  y = 10,
}) {
  return (
    <motion.div
      animate={{ 
        y: [0, -y, 0],
      }}
      transition={{ 
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Pulse animation - scale up/down
 */
export function PulseAnimation({ 
  children, 
  className = '',
  duration = 2,
  scale = 1.05,
}) {
  return (
    <motion.div
      animate={{ 
        scale: [1, scale, 1],
      }}
      transition={{ 
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Slide in from side animation
 */
export function SlideIn({ 
  children, 
  direction = 'left',
  className = '',
  delay = 0,
}) {
  const xValue = direction === 'left' ? -50 : 50;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: xValue }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Bounce animation for celebratory elements
 */
export function BounceIn({ 
  children, 
  className = '',
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
