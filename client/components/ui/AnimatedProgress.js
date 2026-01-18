'use client';

import { motion } from 'framer-motion';

/**
 * Circular progress indicator
 */
export function CircularProgress({ 
  progress = 0, 
  size = 80, 
  strokeWidth = 6,
  showText = true,
  label = '',
  color = '#ff6b35',
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            key={progress}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-lg font-bold text-white"
          >
            {Math.round(progress)}%
          </motion.span>
          {label && (
            <span className="text-xs text-white/50">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Linear progress bar with animation
 */
export function LinearProgress({
  progress = 0,
  height = 8,
  showLabel = true,
  label = '',
  gradient = true,
  className = '',
}) {
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-white/50">{label}</span>
          <motion.span 
            key={progress}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#ffd60a] font-bold"
          >
            {Math.round(progress)}%
          </motion.span>
        </div>
      )}
      <div 
        className="bg-white/10 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <motion.div 
          className={`h-full rounded-full ${
            gradient 
              ? 'bg-gradient-to-r from-[#ff6b35] via-[#f72585] to-[#ffd60a]' 
              : 'bg-[#ff6b35]'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/**
 * Participant progress - shows X of Y with visual dots
 */
export function ParticipantProgress({
  current = 0,
  total = 0,
  label = 'participants',
  className = '',
}) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={`text-center ${className}`}>
      <div className="flex items-center justify-center gap-2 mb-3">
        {[...Array(total)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1,
              backgroundColor: i < current 
                ? ['#ff6b35', '#f72585', '#ffd60a'][i % 3] 
                : 'rgba(255,255,255,0.1)',
            }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="w-3 h-3 rounded-full"
          />
        ))}
      </div>
      <div className="text-white/70">
        <motion.span 
          key={current}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="text-xl font-bold text-white"
        >
          {current}
        </motion.span>
        <span className="text-white/40"> of </span>
        <span className="text-lg font-semibold">{total}</span>
        <span className="text-white/40 text-sm ml-2">{label}</span>
      </div>
    </div>
  );
}

/**
 * Waiting indicator with animated dots
 */
export function WaitingIndicator({ 
  text = 'Waiting for others',
  className = '',
}) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[#ff6b35]"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      <span className="text-white/60">{text}</span>
    </div>
  );
}

/**
 * Step indicator for multi-step flows
 */
export function StepIndicator({
  steps = [],
  currentStep = 0,
  className = '',
}) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <motion.div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${i < currentStep 
                ? 'bg-gradient-to-r from-[#ff6b35] to-[#f72585] text-white' 
                : i === currentStep 
                  ? 'bg-white/20 text-white border-2 border-[#ff6b35]' 
                  : 'bg-white/5 text-white/30 border border-white/10'}
            `}
            initial={{ scale: 0.8 }}
            animate={{ scale: i === currentStep ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {i < currentStep ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              i + 1
            )}
          </motion.div>
          
          {i < steps.length - 1 && (
            <div className="w-8 h-0.5 mx-1 bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#ff6b35] to-[#f72585]"
                initial={{ width: 0 }}
                animate={{ width: i < currentStep ? '100%' : '0%' }}
                transition={{ duration: 0.3, delay: 0.2 }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Countdown timer display
 */
export function CountdownDisplay({
  seconds = 0,
  size = 'md',
  className = '',
}) {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <motion.div
      key={seconds}
      initial={{ scale: 1.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`font-bold ${sizes[size]} ${className}`}
    >
      <span className="gradient-text">{seconds}</span>
    </motion.div>
  );
}

export default CircularProgress;
